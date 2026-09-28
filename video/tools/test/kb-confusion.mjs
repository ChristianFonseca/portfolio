// ¿Confunde Syn un proyecto con otro? Pregunta N veces y clasifica cada respuesta.
// Uso: node video/tools/test/kb-confusion.mjs [base] [N]   (contra una base DESECHABLE)
const B = process.argv[2] || "http://localhost:3300", N = Number(process.argv[3] || 12)
const QUESTIONS = ["¿Qué es Atalaya?", "What is Atalaya?", "¿Qué hace Atalaya?", "Cuéntame de Atalaya"]
const WRONG = /vs ?code|cangrejo|crab|avi[oó]n|airplane|plane|extensi[oó]n/i
const RIGHT = /monitor|vigil|servidor|server|alert/i
let right = 0, wrong = 0, other = 0
for (let i = 0; i < N; i++) {
  const message = QUESTIONS[i % QUESTIONS.length]
  const r = await fetch(`${B}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json", "cf-connecting-ip": `198.51.100.${10 + i}` },
    body: JSON.stringify({ message, locale: /[¿é]/.test(message) ? "es" : "en" }) })
  const a = ((await r.json().catch(() => ({}))).answer || "").replace(/\s+/g, " ")
  const verdict = WRONG.test(a) ? "MAL" : RIGHT.test(a) ? "bien" : "?"
  if (verdict === "MAL") wrong++; else if (verdict === "bien") right++; else other++
  console.log(`${verdict.padEnd(4)} ${message.padEnd(22)} ${a.slice(0, 110)}`)
}
console.log(`\nbien ${right}/${N} · MAL ${wrong}/${N} · dudosas ${other}/${N}`)
