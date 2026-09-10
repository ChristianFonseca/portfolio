import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { DEFAULT_GEMINI_MODEL, getSetting } from "@/lib/settings"
import { SETTING_INCIDENT, getBlockedModels, getGeminiCatalog, modelStatus, type GeminiIncident } from "@/lib/gemini"
import { DismissIncidentButton } from "@/components/admin/dismiss-incident-button"

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("es", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima" })

// Aviso persistente en todo el admin cuando el modelo Gemini configurado dejó de
// existir (hubo un fallback real) o ya no aparece/está deprecado en el catálogo.
export async function GeminiIncidentBanner() {
  const [incident, catalog, model, blocked] = await Promise.all([
    getSetting<GeminiIncident | null>(SETTING_INCIDENT, null),
    getGeminiCatalog(),
    getSetting<string>("gemini_model", DEFAULT_GEMINI_MODEL),
    getBlockedModels(),
  ])
  const status = modelStatus(model, catalog, blocked)
  const stale = status === "deprecated" || status === "missing" || status === "blocked"
  if (!incident && !stale) return null

  return (
    <div className="mb-6 flex flex-wrap items-start gap-3 rounded-2xl border border-yellow-500/50 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-200">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1">
        {incident && (
          <p>
            <b>El modelo {incident.model} no respondió</b> ({incident.context === "chat" ? "chat" : "traducción"}, HTTP{" "}
            {incident.status}, {fmtDate(incident.at)}).{" "}
            {incident.recovered
              ? `Se usó el respaldo ${incident.fallback} y la respuesta salió bien.`
              : `El respaldo ${incident.fallback ?? "—"} también falló.`}
            {incident.detail && <span className="block text-xs opacity-80">{incident.detail}</span>}
          </p>
        )}
        {stale && (
          <p>
            El modelo configurado <b>{model}</b>{" "}
            {status === "deprecated"
              ? "está deprecado"
              : status === "blocked"
                ? "está bloqueado manualmente"
                : "ya no aparece en el catálogo de la API"}
            : elige otro en Configuración.
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Link href="/config" className="text-xs font-semibold underline underline-offset-2 hover:opacity-80">
          Ir a Configuración
        </Link>
        {incident && <DismissIncidentButton />}
      </div>
    </div>
  )
}
