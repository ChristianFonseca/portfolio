// Limitador en memoria (ventana deslizante) compartido por login, contacto y eventos.
// Es por proceso: se reinicia con cada deploy y no se comparte entre instancias, lo
// que basta para un sitio de una sola réplica detrás del WAF de Cloudflare.

export interface RateLimiter {
  /** true = permitido (y cuenta el intento); false = bloqueado. */
  check(key: string): boolean
  /** Solo consulta, sin contar. */
  isLimited(key: string): boolean
}

export function createRateLimiter(opts: { windowMs: number; max: number; maxKeys?: number }): RateLimiter {
  const hits = new Map<string, number[]>()
  const maxKeys = opts.maxKeys ?? 10_000

  const prune = (now: number) => {
    if (hits.size <= maxKeys) return
    for (const [k, ts] of hits) {
      if (!ts.some((t) => now - t < opts.windowMs)) hits.delete(k)
    }
  }

  return {
    check(key) {
      const now = Date.now()
      const recent = (hits.get(key) ?? []).filter((t) => now - t < opts.windowMs)
      if (recent.length >= opts.max) {
        hits.set(key, recent)
        return false
      }
      recent.push(now)
      hits.set(key, recent)
      prune(now)
      return true
    },
    isLimited(key) {
      const now = Date.now()
      return (hits.get(key) ?? []).filter((t) => now - t < opts.windowMs).length >= opts.max
    },
  }
}
