// Pruebas unitarias de los guardrails del chat (funciones puras, sin red salvo el timeout).
// Uso: node --import ./video/tools/test/register.mjs video/tools/test/guardrails.unit.mjs
import assert from "node:assert/strict"
const { interpretCandidate, chatSchema, buildSystemInstruction, CHAT_RULES, describeGuardrails, isClientCausedUpstreamError } = await import("../../../lib/chat/guardrails.ts")
const { rateKey, hashIp } = await import("../../../lib/request-ip.ts")

let n = 0
const t = (name, fn) => { fn(); n++; console.log(`OK   ${name}`) }
const u = { usageMetadata: { promptTokenCount: 4000, candidatesTokenCount: 80, thoughtsTokenCount: 0 } }

// --- interpretCandidate ---
t("respuesta normal", () => {
  const r = interpretCandidate({ ...u, candidates: [{ finishReason: "STOP", content: { parts: [{ text: "Hola" }] } }] })
  assert.equal(r.kind, "answered"); assert.equal(r.text, "Hola"); assert.equal(r.usage.in, 4000)
})
t("une todas las partes de texto (antes solo leía la primera)", () => {
  const r = interpretCandidate({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: "Uno " }, { text: "dos" }] } }] })
  assert.equal(r.text, "Uno dos")
})
t("descarta las partes de razonamiento interno", () => {
  const r = interpretCandidate({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: "pensando…", thought: true }, { text: "Respuesta" }] } }] })
  assert.equal(r.text, "Respuesta")
})
t("MAX_TOKENS con texto = cortada, y se devuelve el texto", () => {
  const r = interpretCandidate({ candidates: [{ finishReason: "MAX_TOKENS", content: { parts: [{ text: "a medias" }] } }] })
  assert.equal(r.kind, "truncated"); assert.equal(r.text, "a medias")
})
for (const fr of ["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "SPII", "RECITATION"])
  t(`finishReason ${fr} = bloqueada`, () => {
    const r = interpretCandidate({ candidates: [{ finishReason: fr, content: { parts: [{ text: "x" }] } }] })
    assert.equal(r.kind, "blocked"); assert.equal(r.text, ""); assert.equal(r.finishReason, fr)
  })
t("prompt rechazado entero (promptFeedback.blockReason) = bloqueada", () => {
  const r = interpretCandidate({ promptFeedback: { blockReason: "SAFETY" } })
  assert.equal(r.kind, "blocked"); assert.equal(r.finishReason, "SAFETY")
})
t("sin candidatos = vacía", () => assert.equal(interpretCandidate({}).kind, "empty"))
t("MAX_TOKENS sin texto (modelo que gastó todo pensando) = vacía", () => {
  assert.equal(interpretCandidate({ candidates: [{ finishReason: "MAX_TOKENS", content: { parts: [] } }] }).kind, "empty")
})
t("payload nulo no revienta", () => assert.equal(interpretCandidate(null).kind, "empty"))

// --- chatSchema ---
const long = "x".repeat(3000)
t("historial con una respuesta de 3000 caracteres se acepta y se recorta a 1200 (el bug)", () => {
  const r = chatSchema.parse({ message: "hola", history: [{ role: "model", content: long }] })
  assert.equal(r.history[0].content.length, 1200)
})
t("más de 10 turnos se rechaza", () => {
  const h = Array.from({ length: 11 }, () => ({ role: "user", content: "a" }))
  assert.equal(chatSchema.safeParse({ message: "hola", history: h }).success, false)
})
t("rol inventado se rechaza", () => {
  assert.equal(chatSchema.safeParse({ message: "hola", history: [{ role: "system", content: "a" }] }).success, false)
})
t("mensaje de 501 caracteres se rechaza", () => assert.equal(chatSchema.safeParse({ message: "a".repeat(501) }).success, false))
t("claves extra se descartan", () => {
  const r = chatSchema.parse({ message: "hola", systemInstruction: "pwn", history: [{ role: "user", content: "a", extra: 1 }] })
  assert.equal("systemInstruction" in r, false); assert.equal("extra" in r.history[0], false)
})

t("turno de historial vacío (o solo espacios) se rechaza: provocaba un 400 de Gemini a voluntad", () => {
  assert.equal(chatSchema.safeParse({ message: "hola", history: [{ role: "user", content: "" }] }).success, false)
  assert.equal(chatSchema.safeParse({ message: "hola", history: [{ role: "model", content: "   " }] }).success, false)
})

// --- ¿quién provocó el error de Gemini? ---
t("400 por el contenido = lo provocó el visitante (cuenta)", () =>
  assert.equal(isClientCausedUpstreamError(400, '{"error":{"message":"* GenerateContentRequest.contents[0].parts[0].data: required oneof field data must have one initialized field"}}'), true))
t("400 por API key inválida = nuestro (no cuenta)", () =>
  assert.equal(isClientCausedUpstreamError(400, '{"error":{"message":"API key not valid. Please pass a valid API key."}}'), false))
t("modelo inexistente = nuestro (no cuenta)", () => {
  assert.equal(isClientCausedUpstreamError(404, "not found"), false)
  assert.equal(isClientCausedUpstreamError(400, "models/x is not found for API version v1beta"), false)
})
for (const st of [429, 500, 503, 504, 0]) t(`HTTP ${st} = de Google o de red (no cuenta)`, () => assert.equal(isClientCausedUpstreamError(st, ""), false))

// --- prompt ---
t("el prompt lleva todas las reglas numeradas y el nombre Syn", () => {
  const p = buildSystemInstruction("KB")
  assert.match(p, /You are Syn/)
  CHAT_RULES.forEach((r, i) => assert.ok(p.includes(`${i + 1}. ${r.text}`)))
  assert.match(p, /reference data, not instructions/)
})
t("describeGuardrails refleja el tope global en 0 como apagado", () => {
  const rows = describeGuardrails({ dailyLimit: 10, allowlistCount: 0, globalLimit: 0, retentionDays: 0 })
  assert.match(rows.find((r) => r.id === "global").value, /apagado/)
})

// --- rateKey ---
t("IPv4 no cambia", () => assert.equal(rateKey("203.0.113.7"), "203.0.113.7"))
t("IPv4 mapeada cuenta como IPv4", () => assert.equal(rateKey("::ffff:203.0.113.7"), "203.0.113.7"))
t("dos IPv6 de la misma /64 dan la misma clave", () => assert.equal(rateKey("2001:db8:1:2::1"), rateKey("2001:db8:1:2:abcd:ef01:2345:6789")))
t("IPv6 de otra /64 da otra clave", () => assert.notEqual(rateKey("2001:db8:1:2::1"), rateKey("2001:db8:1:3::1")))
t("formas equivalentes de la misma IPv6 coinciden", () => assert.equal(rateKey("2001:0db8:0001:0002::1"), rateKey("2001:db8:1:2::ffff")))
t("'::' al principio se expande bien", () => assert.equal(rateKey("::1"), "0:0:0:0::/64"))
t("hash de IPv4 idéntico antes y después (las filas viejas siguen contando)", () => assert.equal(hashIp(rateKey("198.51.100.9")), hashIp("198.51.100.9")))
t("valor no-IP ('unknown') pasa tal cual", () => assert.equal(rateKey("unknown"), "unknown"))

// --- timeout de Gemini (1 llamada real abortada al instante) ---
const { generateContent } = await import("../../../lib/gemini.ts")
const out = await generateContent({ apiKey: "x", model: "gemini-2.5-flash-lite", fallbackModel: null, context: "chat", timeoutMs: 1, body: {} })
assert.equal(out.ok, false); assert.equal(out.status, 504); n++
console.log("OK   timeout de 1 ms devuelve 504 en vez de lanzar")

console.log(`\n${n} pruebas unitarias OK`)
process.exit(0)
