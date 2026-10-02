// Pruebas del Markdown mínimo de Syn (lib/chat/markdown.ts).
// Uso: node --import ./video/tools/test/register.mjs video/tools/test/markdown.unit.mjs
import assert from "node:assert/strict"
const { parseMarkdown, parseInline, safeHref } = await import("../../../lib/chat/markdown.ts")

let n = 0
const t = (name, fn) => { fn(); n++; console.log(`OK   ${name}`) }
// Representación compacta del árbol para comparar fácil
const flat = (nodes) => nodes.map((x) =>
  x.t === "text" ? x.v : x.t === "br" ? "⏎" : x.t === "code" ? `<code:${x.v}>` :
  x.t === "link" ? `<${x.kind}:${x.href}|${flat(x.c)}>` : `<${x.t}:${flat(x.c)}>`).join("")

t("negrita", () => assert.equal(flat(parseInline("Tiene **13 certificaciones** de AWS")), "Tiene <strong:13 certificaciones> de AWS"))
t("negrita con guiones bajos", () => assert.equal(flat(parseInline("__importante__")), "<strong:importante>"))
t("cursiva", () => assert.equal(flat(parseInline("un *proyecto* personal")), "un <em:proyecto> personal"))
t("negrita con enlace dentro", () =>
  assert.equal(flat(parseInline("**lee [el artículo](https://christianfonseca.dev/blog/x)**")), "<strong:lee <internal:/blog/x|el artículo>>"))
t("código en línea conserva los asteriscos", () => assert.equal(flat(parseInline("usa `**kwargs` en Python")), "usa <code:**kwargs> en Python"))

// falsos positivos
t("'2 * 3 * 4' no es cursiva", () => assert.equal(flat(parseInline("2 * 3 * 4")), "2 * 3 * 4"))
t("snake_case_word no es cursiva", () => assert.equal(flat(parseInline("la variable max_output_tokens")), "la variable max_output_tokens"))
t("'**' sin cerrar se queda como texto", () => assert.equal(flat(parseInline("esto **no cierra")), "esto **no cierra"))
t("guiones bajos dentro de una URL no rompen el enlace", () =>
  assert.equal(flat(parseInline("ver https://example.com/a_b_c")), "ver <external:https://example.com/a_b_c|example.com/a_b_c>"))

// enlaces y URLs sueltas
t("URL del propio sitio sin https → enlace interno", () =>
  assert.equal(flat(parseInline("Léelo en christianfonseca.dev/blog/anatomy-of-a-real-rce.")), "Léelo en <internal:/blog/anatomy-of-a-real-rce|christianfonseca.dev/blog/anatomy-of-a-real-rce>."))
t("URL con https del propio sitio → interno, sin el dominio en el href", () =>
  assert.equal(flat(parseInline("https://christianfonseca.dev/blog/x")), "<internal:/blog/x|christianfonseca.dev/blog/x>"))
t("archivo del propio sitio (el CV) → 'file', no navegación interna", () =>
  assert.equal(flat(parseInline("Su CV: christianfonseca.dev/cv.pdf.")), "Su CV: <file:/cv.pdf|christianfonseca.dev/cv.pdf>."))
t("URL externa → externo; la puntuación final queda fuera", () =>
  assert.equal(flat(parseInline("(ver https://github.com/ChristianFonseca/crabair).")), "(ver <external:https://github.com/ChristianFonseca/crabair|github.com/ChristianFonseca/crabair>)."))
t("correo → mailto", () =>
  assert.equal(flat(parseInline("escribe a christian.fonseca.r@gmail.com.")), "escribe a <mail:mailto:christian.fonseca.r@gmail.com|christian.fonseca.r@gmail.com>."))
t("un correo del propio dominio no se parte en enlace web", () =>
  assert.equal(flat(parseInline("no-reply@christianfonseca.dev")), "<mail:mailto:no-reply@christianfonseca.dev|no-reply@christianfonseca.dev>"))

// seguridad
t("[x](javascript:…) se queda en texto, sin enlace", () => assert.equal(flat(parseInline("[haz clic](javascript:alert(1))")), "haz clic)"))
t("[x](data:…) se queda en texto", () => assert.equal(flat(parseInline("[img](data:text/html,hola)")), "img"))
t("HTML crudo se queda como texto literal", () => assert.equal(flat(parseInline('<img src=x onerror="alert(1)">')), '<img src=x onerror="alert(1)">'))
t("safeHref rechaza esquemas peligrosos", () => {
  for (const s of ["javascript:alert(1)", "JAVASCRIPT:alert(1)", "data:text/html,x", "vbscript:x", "file:///etc/passwd"]) assert.equal(safeHref(s), null, s)
})
t("'//evil.com' (relativa al protocolo) nunca pasa por enlace interno", () => {
  const r = safeHref("//evil.com")
  assert.ok(r === null || (r.kind === "external" && r.href.startsWith("https://evil.com")), JSON.stringify(r))
})
t("safeHref acepta rutas propias, http(s) y mailto", () => {
  assert.deepEqual(safeHref("/blog/x"), { href: "/blog/x", kind: "internal" })
  assert.equal(safeHref("https://example.com").kind, "external")
  assert.equal(safeHref("mailto:a@b.co").kind, "mail")
})

// bloques
t("párrafos separados por línea en blanco, saltos simples como <br>", () => {
  const b = parseMarkdown("Hola.\nSegunda línea.\n\nOtro párrafo.")
  assert.equal(b.length, 2); assert.equal(flat(b[0].c), "Hola.⏎Segunda línea.")
})
t("lista con viñetas (-, * y •)", () => {
  const b = parseMarkdown("Proyectos:\n- Furtale\n* MAT\n• **Atalaya**")
  assert.equal(b[1].t, "ul"); assert.deepEqual(b[1].items.map(flat), ["Furtale", "MAT", "<strong:Atalaya>"])
})
t("lista numerada conserva el número de inicio", () => {
  const b = parseMarkdown("3. tres\n4. cuatro")
  assert.equal(b[0].t, "ol"); assert.equal(b[0].start, 3); assert.equal(b[0].items.length, 2)
})
t("'**Negrita**' al principio de línea no es una viñeta", () => assert.equal(parseMarkdown("**Resumen:** bien")[0].t, "p"))
t("línea con sangría continúa el elemento de la lista", () => {
  const b = parseMarkdown("- primero\n  sigue aquí\n- segundo")
  assert.deepEqual(b[0].items.map(flat), ["primero sigue aquí", "segundo"])
})
t("título '## x' pasa a párrafo en negrita", () => assert.equal(flat(parseMarkdown("## Proyectos")[0].c), "<strong:Proyectos>"))
t("separador '---' desaparece", () => assert.equal(parseMarkdown("a\n\n---\n\nb").length, 2))
t("texto vacío no revienta", () => assert.deepEqual(parseMarkdown(""), []))
t("CRLF de Windows se normaliza", () => assert.equal(parseMarkdown("- a\r\n- b")[0].items.length, 2))

console.log(`\n${n} pruebas OK`)
