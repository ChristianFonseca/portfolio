import { MessageSquare } from "lucide-react"
import { sql } from "@/lib/db"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

interface QuestionRow {
  id: number
  ip_hash: string
  locale: string
  question: string
  answer: string
  model: string
  created_at: string
}

interface Stats {
  total: string
  today: string
  week: string
  unique_ips: string
}

export default async function AdminQuestionsPage() {
  let questions: QuestionRow[] = []
  let stats: Stats = { total: "0", today: "0", week: "0", unique_ips: "0" }
  let dbError = false
  try {
    const [rows, statRows] = await Promise.all([
      sql<QuestionRow[]>`
        select id, ip_hash, locale, question, answer, model,
               to_char(created_at, 'DD Mon YYYY, HH24:MI') as created_at
        from chat_questions order by id desc limit 100
      `,
      sql<Stats[]>`
        select count(*)::text as total,
               count(*) filter (where created_at > now() - interval '24 hours')::text as today,
               count(*) filter (where created_at > now() - interval '7 days')::text as week,
               count(distinct ip_hash)::text as unique_ips
        from chat_questions
      `,
    ])
    questions = rows
    if (statRows[0]) stats = statRows[0]
  } catch (error) {
    console.error("admin questions:", error)
    dbError = true
  }

  const cards = [
    { label: "Total", value: stats.total },
    { label: "Últimas 24 h", value: stats.today },
    { label: "Últimos 7 días", value: stats.week },
    { label: "Visitantes únicos", value: stats.unique_ips },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold">Preguntas del chat</h1>
      <p className="mb-8 mt-1 text-sm text-muted-foreground">
        Todo lo que los visitantes le preguntan al asistente. Las IPs se guardan solo como hash irreversible.
      </p>

      {dbError ? (
        <p className="text-sm text-red-400">No se pudo conectar a la base de datos.</p>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {cards.map((c) => (
              <div key={c.label} className="rounded-2xl border border-border bg-card/40 px-5 py-4">
                <p className="text-2xl font-bold tabular-nums">{c.value}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
            ))}
          </div>

          {questions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
              <MessageSquare className="mx-auto mb-3 h-6 w-6 opacity-40" />
              Aún no hay preguntas. Cuando alguien use el chat de la landing, aparecerán aquí.
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q) => (
                <details key={q.id} className="group rounded-2xl border border-border bg-card/40">
                  <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-3.5 [&::-webkit-details-marker]:hidden">
                    <MessageSquare className="h-4 w-4 shrink-0 text-primary/60" />
                    <span className="min-w-0 flex-1 truncate text-sm">{q.question}</span>
                    <Badge variant="secondary" className="shrink-0 text-[10px] uppercase">
                      {q.locale}
                    </Badge>
                    <span className="hidden shrink-0 font-mono text-[10px] text-muted-foreground/50 sm:block">
                      {q.ip_hash.slice(0, 8)}
                    </span>
                    <span className="hidden shrink-0 text-[11px] text-muted-foreground/60 md:block">
                      {q.created_at}
                    </span>
                  </summary>
                  <div className="border-t border-border/60 px-5 py-4 text-sm">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Pregunta completa
                    </p>
                    <p className="mb-4 whitespace-pre-wrap">{q.question}</p>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Respuesta ({q.model})
                    </p>
                    <p className="whitespace-pre-wrap text-muted-foreground">{q.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
