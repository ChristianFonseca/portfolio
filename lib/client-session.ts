// Id de sesión de analítica por pestaña (sessionStorage, sin cookies). Lo usan el
// tracker y las llamadas a /api/chat y /api/contact para enlazar eventos de servidor.
const KEY = "cf_sid"
let memo: string | null = null

function random(): string {
  try {
    return crypto.randomUUID().replace(/-/g, "")
  } catch {
    return Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join("")
  }
}

export function getSessionId(): string {
  if (memo) return memo
  try {
    let s = sessionStorage.getItem(KEY)
    if (!s || !/^[a-zA-Z0-9_-]{8,64}$/.test(s)) {
      s = random()
      sessionStorage.setItem(KEY, s)
    }
    memo = s
  } catch {
    memo = random()
  }
  return memo
}
