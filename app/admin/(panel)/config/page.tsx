import { CheckCircle2, XCircle } from "lucide-react"
import { DEFAULT_GEMINI_MODEL, GEMINI_MODELS, getSetting } from "@/lib/settings"
import { ConfigForm } from "@/components/admin/config-form"
import { ChatConfigForm } from "@/components/admin/chat-config-form"

export const dynamic = "force-dynamic"

export default async function AdminConfigPage() {
  const model = await getSetting<string>("gemini_model", DEFAULT_GEMINI_MODEL)
  const hasApiKey = Boolean(process.env.GEMINI_API_KEY)
  const dailyLimit = await getSetting<number>("chat_daily_limit", 10)
  const allowlist = await getSetting<string[]>("chat_ip_allowlist", [])
  const extraContext = await getSetting<string>("chat_extra_context", "")

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">Configuración</h1>
      <p className="mb-8 mt-1 text-sm text-muted-foreground">
        Traducción automática EN ↔ ES del contenido con Gemini.
      </p>

      <div className="mb-6 rounded-2xl border border-border bg-card/40 p-5">
        <div className="flex items-center gap-2">
          {hasApiKey ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-400" />
          )}
          <p className="text-sm font-semibold">
            GEMINI_API_KEY {hasApiKey ? "configurada" : "no configurada"}
          </p>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          La API key vive en las variables de entorno del servidor (archivo <code className="rounded bg-background/60 px-1.5 py-0.5">.env</code>), nunca en la base de
          datos ni en el navegador.{" "}
          {!hasApiKey && (
            <>
              Consíguela en{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google AI Studio
              </a>
              , agrégala como <code className="rounded bg-background/60 px-1.5 py-0.5">GEMINI_API_KEY=...</code> y reinicia el
              contenedor.
            </>
          )}
        </p>
      </div>

      <ConfigForm currentModel={model} models={GEMINI_MODELS} defaultModel={DEFAULT_GEMINI_MODEL} />

      <ChatConfigForm dailyLimit={dailyLimit} allowlist={allowlist} extraContext={extraContext} />
    </div>
  )
}
