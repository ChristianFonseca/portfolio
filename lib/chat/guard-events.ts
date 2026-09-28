import { sql } from "@/lib/db"

// Cuándo actuó un guardrail. Solo los casos que NO dejan fila en chat_questions (los
// bloqueos de Google, las respuestas vacías y las cortadas ya quedan ahí con su
// `outcome`). Se agrega por hora, tipo, IP y estado HTTP: un bot golpeando el límite
// suma n en una fila por hora en vez de escribir miles, y un 429 de cuota no se mezcla
// con un timeout de la misma hora.

export type GuardKind =
  | "invalid_input" // el cuerpo no pasó la validación (400)
  | "limit_ip" // límite por IP alcanzado (429)
  | "limit_global" // tope global alcanzado o chat apagado (503)
  | "upstream_error" // Gemini respondió con error, timeout o fallo de red
  | "fallback" // el modelo elegido no estaba disponible y respondió el de respaldo
  | "internal_error" // excepción en la ruta (500)

export const GUARD_KIND_LABEL: Record<GuardKind, string> = {
  invalid_input: "Petición inválida",
  limit_ip: "Límite por IP alcanzado",
  limit_global: "Tope global / chat apagado",
  upstream_error: "Error de Gemini",
  fallback: "Respondió el modelo de respaldo",
  internal_error: "Error interno",
}

// Nunca lanza: un fallo al registrar no debe romper la respuesta al visitante.
export async function logGuardEvent(e: {
  kind: GuardKind
  ipHash?: string
  locale?: string
  model?: string
  /** Estado HTTP de Gemini en upstream_error (429 = cuota agotada); 0 si no aplica. */
  status?: number
  detail?: Record<string, unknown>
}): Promise<void> {
  try {
    await sql`
      insert into chat_guard_events (bucket, kind, ip_hash, status, locale, model, detail)
      values (date_trunc('hour', now()), ${e.kind}, ${e.ipHash ?? ""}, ${e.status ?? 0}, ${e.locale ?? ""},
              ${e.model ?? ""}, ${sql.json((e.detail ?? {}) as never)})
      on conflict (bucket, kind, ip_hash, status) do update
        set n = chat_guard_events.n + 1,
            last_ts = now(),
            locale = excluded.locale,
            model = excluded.model,
            detail = excluded.detail
    `
  } catch (error) {
    console.error("logGuardEvent:", error)
  }
}
