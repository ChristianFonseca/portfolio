import { Bot, Gauge, Quote, Rocket, Route, ShieldCheck, type LucideIcon } from "lucide-react"
import type { ApproachData, SectionEntry } from "@/lib/content/schemas"
import type { Dictionary } from "@/lib/i18n/dictionaries"

// Claves de APPROACH_ICON_KEYS (schemas.ts). Una clave desconocida usa la primera.
const APPROACH_ICONS: Record<string, LucideIcon> = {
  cite: Quote,
  shield: ShieldCheck,
  route: Route,
  rocket: Rocket,
  bot: Bot,
  gauge: Gauge,
}

export function ApproachSection({ section, dict }: { section: SectionEntry<ApproachData>; dict: Dictionary }) {
  const { intro, items } = section.data
  return (
    <section id="approach" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 floating-element bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {section.title}
        </h2>
        {intro && <p className="mx-auto mb-14 max-w-2xl text-balance text-center text-lg text-muted-foreground">{intro}</p>}

        <ol className={`grid gap-5 md:grid-cols-2 ${items.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
          {items.map((item, i) => {
            const Icon = APPROACH_ICONS[item.icon] ?? Quote
            return (
              <li
                key={`${item.title}-${i}`}
                className="group relative flex flex-col overflow-hidden rounded-3xl border-2 border-border bg-card p-6 transition-colors hover:border-primary/30"
              >
                {/* Franja superior en gradiente: une visualmente las tarjetas como una serie */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-accent opacity-60 transition-opacity group-hover:opacity-100"
                />
                <div className="mb-5 flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span
                    aria-hidden
                    className="font-serif text-4xl italic leading-none text-foreground/15 transition-colors group-hover:text-primary/40"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                {item.proof.length > 0 && (
                  <div className="mt-auto pt-5">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                      {dict.approach.seenIn}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.proof.map((p) => (
                        <span
                          key={p}
                          className="rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
