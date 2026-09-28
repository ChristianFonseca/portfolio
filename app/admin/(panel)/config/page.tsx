import { redirect } from "next/navigation"
import { CheckCircle2, XCircle } from "lucide-react"
import { getSessionUser } from "@/lib/auth"
import { DEFAULT_GEMINI_FALLBACK_MODEL, DEFAULT_GEMINI_MODEL, GEMINI_MODELS, getSetting } from "@/lib/settings"
import { DEPRECATIONS_CHECKED, DEPRECATIONS_URL, SETTING_FALLBACK, getBlockedModels, getGeminiCatalog } from "@/lib/gemini"
import { getKnowledgeBase } from "@/lib/chat/knowledge"
import { ConfigForm } from "@/components/admin/config-form"
import { ChatConfigForm } from "@/components/admin/chat-config-form"
import { KnowledgePanel } from "@/components/admin/knowledge-panel"
import { ActivityConfigForm } from "@/components/admin/activity-config-form"
import {
  DEFAULT_AUDIT_RETENTION_DAYS,
  DEFAULT_CHAT_RETENTION_DAYS,
  DEFAULT_VISITOR_RETENTION_DAYS,
  SETTING_AUDIT_RETENTION,
  SETTING_CHAT_RETENTION,
  SETTING_VISITOR_RETENTION,
} from "@/lib/activity"
import {
  CHAT_OUTPUT,
  DEFAULT_CHAT_DAILY_LIMIT,
  DEFAULT_CHAT_GLOBAL_LIMIT,
  SETTING_CHAT_ALLOWLIST,
  SETTING_CHAT_DAILY_LIMIT,
  SETTING_CHAT_GLOBAL_LIMIT,
} from "@/lib/chat/guardrails"
import { estimateCostUsd, priceFor } from "@/lib/gemini-pricing"

export const dynamic = "force-dynamic"

export default async function AdminConfigPage() {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") redirect("/")

  const hasApiKey = Boolean(process.env.GEMINI_API_KEY)
  const [
    model,
    fallbackModel,
    catalog,
    blocked,
    dailyLimit,
    globalLimit,
    allowlist,
    extraContext,
    kb,
    visitorDays,
    auditDays,
    chatDays,
  ] = await Promise.all([
    getSetting<string>("gemini_model", DEFAULT_GEMINI_MODEL),
    getSetting<string>(SETTING_FALLBACK, DEFAULT_GEMINI_FALLBACK_MODEL),
    getGeminiCatalog(),
    getBlockedModels(),
    getSetting<number>(SETTING_CHAT_DAILY_LIMIT, DEFAULT_CHAT_DAILY_LIMIT),
    getSetting<number>(SETTING_CHAT_GLOBAL_LIMIT, DEFAULT_CHAT_GLOBAL_LIMIT),
    getSetting<string[]>(SETTING_CHAT_ALLOWLIST, []),
    getSetting<string>("chat_extra_context", ""),
    getKnowledgeBase(),
    getSetting<number>(SETTING_VISITOR_RETENTION, DEFAULT_VISITOR_RETENTION_DAYS),
    getSetting<number>(SETTING_AUDIT_RETENTION, DEFAULT_AUDIT_RETENTION_DAYS),
    getSetting<number>(SETTING_CHAT_RETENTION, DEFAULT_CHAT_RETENTION_DAYS),
  ])

  // Costo aproximado de un mensaje: base de conocimiento + reglas + historial medio de
  // entrada, y una respuesta típica de salida. Sirve para traducir el tope global a $/día.
  const price = priceFor(model)
  const costPerMessageUsd = price ? estimateCostUsd(price, kb.approxTokens + 900, Math.round(CHAT_OUTPUT.maxOutputTokens / 2)) : null

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold">Configuración</h1>
      <p className="mb-8 mt-1 text-sm text-muted-foreground">
        Gemini para la traducción EN ↔ ES y el asistente de chat; base de conocimiento que usa el asistente.
      </p>

      <div className="mb-6 rounded-2xl border border-border bg-card/40 p-5">
        <div className="flex items-center gap-2">
          {hasApiKey ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-400" />
          )}
          <p className="text-sm font-semibold">GEMINI_API_KEY {hasApiKey ? "configurada" : "no configurada"}</p>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          La API key vive en el gestor de secretos del servidor (Bitwarden Secrets Manager), nunca en la base de datos
          ni en el navegador.{" "}
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
              , cárgala como <code className="rounded bg-background/60 px-1.5 py-0.5">GEMINI_API_KEY</code> en el
              proyecto de Bitwarden y reinicia el contenedor.
            </>
          )}
        </p>
      </div>

      <ConfigForm
        currentModel={model}
        fallbackModel={fallbackModel}
        defaultModel={DEFAULT_GEMINI_MODEL}
        seedModels={GEMINI_MODELS}
        catalog={catalog}
        blocked={blocked}
        hasApiKey={hasApiKey}
        deprecationsUrl={DEPRECATIONS_URL}
        deprecationsChecked={DEPRECATIONS_CHECKED}
      />

      <KnowledgePanel initial={kb} modelId={model} />

      <ChatConfigForm
        dailyLimit={dailyLimit}
        globalLimit={globalLimit}
        allowlist={allowlist}
        extraContext={extraContext}
        costPerMessageUsd={costPerMessageUsd}
      />

      <ActivityConfigForm visitorDays={visitorDays} auditDays={auditDays} chatDays={chatDays} />
    </div>
  )
}
