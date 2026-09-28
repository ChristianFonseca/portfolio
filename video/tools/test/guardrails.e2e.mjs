// Pruebas de punta a punta de /api/chat contra una base DESECHABLE (nunca producción).
// Uso: node video/tools/test/guardrails.e2e.mjs [http://localhost:3300]
import { execFileSync } from "node:child_process"
import assert from "node:assert/strict"

const B = process.argv[2] || "http://localhost:3300"
const psql = (q) => execFileSync("docker", ["exec", "-i", "pg-guardrails-test", "psql", "-U", "postgres", "-tA", "-c", q]).toString().trim()
const setting = (k, v) => psql(`insert into settings (key, value) values ('${k}', '${JSON.stringify(v)}'::jsonb) on conflict (key) do update set value = excluded.value`)
const ask = async (ip, body, raw) => {
  const r = await fetch(`${B}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "cf-connecting-ip": ip },
    body: raw ?? JSON.stringify({ locale: "es", ...body }),
  })
  return { status: r.status, body: await r.json().catch(() => ({})) }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let n = 0
const ok = (m) => { n++; console.log(`OK   ${m}`) }

// Estado limpio en cada ejecución (solo quedan las 2 filas "antiguas" de la migración)
psql("truncate chat_guard_events; delete from chat_questions where ip_hash not in ('aaaa1111', 'bbbb2222')")
setting("chat_daily_limit", 3); setting("chat_global_daily_limit", 100); setting("chat_ip_allowlist", [])
setting("gemini_model", "gemini-2.5-flash-lite"); setting("gemini_fallback_model", "gemini-2.5-flash-lite")

// E1 — entradas inválidas
assert.equal((await ask("198.51.100.1", { message: "" })).status, 400)
assert.equal((await ask("198.51.100.1", null, "{no es json")).status, 400)
assert.equal((await ask("198.51.100.1", { message: "hola", history: Array(11).fill({ role: "user", content: "a" }) })).status, 400)
// La petición fabricada que encontró la revisión: turno de historial vacío
assert.equal((await ask("198.51.100.1", { message: "x", history: [{ role: "user", content: "" }] })).status, 400)
await sleep(300)
assert.equal(psql("select n from chat_guard_events where kind='invalid_input'"), "4")
assert.equal(psql("select count(*) from chat_questions where question = 'x'"), "0")
ok("4 peticiones inválidas (incluida la de historial vacío) → 400 sin llegar a Gemini, en UNA fila de eventos con n=4")

// E2 — respuesta normal y lo que queda guardado
const a = await ask("198.51.100.1", { message: "¿Qué certificaciones de AWS tiene Christian?" })
assert.equal(a.status, 200); assert.equal(a.body.remaining, 2); assert.ok(a.body.answer.length > 20)
const row = psql("select outcome||'|'||(tokens_in is not null)||'|'||(net_hash is not null)||'|'||history_turns from chat_questions order by id desc limit 1")
assert.equal(row, "answered|true|true|0")
ok(`respuesta normal (quedan ${a.body.remaining}); fila con outcome, tokens y net_hash: "${a.body.answer.slice(0, 60)}…"`)

// E3 — carrera: 8 peticiones simultáneas desde la misma IP con límite 3
const burst = await Promise.all(Array.from({ length: 8 }, () => ask("198.51.100.2", { message: "¿Dónde vive Christian?" })))
const passed = burst.filter((r) => r.status === 200).length
const denied = burst.filter((r) => r.status === 429).length
const stored = Number(psql("select count(*) from chat_questions where net_hash is not null and ip_hash <> 'aaaa1111' and ip_hash <> 'bbbb2222' and outcome <> 'error' and question = '¿Dónde vive Christian?'"))
assert.equal(passed, 3, `pasaron ${passed}`); assert.equal(denied, 5); assert.equal(stored, 3)
assert.equal(psql("select count(*) from chat_questions where outcome='pending'"), "0")
ok(`carrera: 8 simultáneas con límite 3 → pasaron exactamente ${passed}, ${denied} con 429 (antes pasaban las 8)`)

// E4 — IPv6: cambiar de dirección dentro de la misma /64 no salta el límite
setting("chat_daily_limit", 1)
assert.equal((await ask("2001:db8:1:2::1", { message: "hola" })).status, 200)
assert.equal((await ask("2001:db8:1:2::abcd", { message: "hola" })).status, 429)
ok("IPv6: la segunda dirección de la misma /64 recibe 429")

// E4b — una fila escrita por el código viejo (sin net_hash) cuenta para el límite de esa IP
setting("chat_daily_limit", 2)
assert.equal((await ask("198.51.100.44", { message: "¿Qué estudió?" })).status, 200)
const h44 = psql("select ip_hash from chat_questions where question = '¿Qué estudió?' order by id desc limit 1")
psql(`insert into chat_questions (ip_hash, locale, question, answer, model) values ('${h44}', 'es', 'fila-del-codigo-viejo', 'a', 'm')`)
assert.equal((await ask("198.51.100.44", { message: "otra pregunta" })).status, 429)
ok("fila del código viejo (net_hash nulo) cuenta: con límite 2, la tercera recibe 429")

// E5 — el bug del historial largo
setting("chat_daily_limit", 3)
const h = await ask("198.51.100.5", { message: "¿Y su experiencia en docencia?", history: [{ role: "user", content: "hola" }, { role: "model", content: "x".repeat(3000) }] })
assert.equal(h.status, 200)
ok("historial con una respuesta de 3000 caracteres → 200 (antes 400 y 'no disponible')")

// E6 — tope global
const used = Number(psql("select count(*) from chat_questions where created_at > now() - interval '24 hours' and outcome <> 'error'"))
setting("chat_global_daily_limit", used)
const g = await ask("198.51.100.6", { message: "prueba-tope-global" })
assert.equal(g.status, 503); assert.equal(g.body.offline, true)
assert.equal(psql("select count(*) from chat_questions where question = 'prueba-tope-global'"), "0")
ok(`tope global (${used}) alcanzado → 503 para una IP nueva, sin dejar fila`)

// E7 — interruptor
setting("chat_global_daily_limit", 0)
const off = await ask("198.51.100.7", { message: "prueba-interruptor" })
assert.equal(off.status, 503); assert.equal(off.body.offline, true)
assert.equal(psql("select count(*) from chat_questions where question = 'prueba-interruptor'"), "0")
ok("tope global en 0 = chat apagado → 503 sin llegar a reservar ni llamar a Gemini")

// E8 — allowlist: sin límite por IP, pero sigue contando para el global
setting("chat_global_daily_limit", 100); setting("chat_daily_limit", 1); setting("chat_ip_allowlist", ["198.51.100.8"])
const w1 = await ask("198.51.100.8", { message: "¿Qué idiomas habla?" })
const w2 = await ask("198.51.100.8", { message: "¿Y dónde estudió?" })
assert.equal(w1.status, 200); assert.equal(w2.status, 200); assert.equal(w2.body.remaining, -1)
ok("IP en la lista blanca: dos preguntas con límite 1 → ambas 200, remaining -1")

// E9 — error de Gemini: no gasta la cuota del visitante
setting("chat_ip_allowlist", []); setting("chat_daily_limit", 1)
setting("gemini_model", "gemini-0-no-existe"); setting("gemini_fallback_model", "gemini-0-no-existe")
const e1 = await ask("198.51.100.9", { message: "hola" })
assert.equal(e1.status, 502)
assert.equal(psql("select outcome||'|'||finish_reason from chat_questions order by id desc limit 1"), "error|http_404")
// Con el modelo arreglado, la MISMA IP puede preguntar: el error no contó
setting("gemini_model", "gemini-2.5-flash-lite"); setting("gemini_fallback_model", "gemini-2.5-flash-lite")
assert.equal((await ask("198.51.100.9", { message: "¿Qué hace Christian?" })).status, 200)
ok("Gemini falla (404) → 502, fila marcada 'error' y NO cuenta: la misma IP con límite 1 puede preguntar después")

// E10 — modelo de respaldo
setting("gemini_model", "gemini-0-no-existe"); setting("chat_daily_limit", 3)
const fb = await ask("198.51.100.10", { message: "¿Qué proyectos tiene?" })
assert.equal(fb.status, 200)
setting("gemini_model", "gemini-2.5-flash-lite")
await sleep(300)
assert.equal(psql("select count(*) from chat_guard_events where kind='fallback'"), "1")
ok("modelo principal caído → responde el de respaldo y queda registrado")

// E11 — lo que quedó en la tabla de eventos
await sleep(300)
const kinds = psql("select string_agg(kind||'='||total, ', ' order by kind) from (select kind, sum(n) total from chat_guard_events group by kind) x")
console.log(`\n     eventos registrados: ${kinds}`)
for (const k of ["invalid_input", "limit_ip", "limit_global", "upstream_error", "fallback"]) assert.ok(kinds.includes(k), `falta ${k}`)
ok("cada tipo de guardrail que actuó dejó su evento")

console.log(`\n${n} pruebas de punta a punta OK`)
