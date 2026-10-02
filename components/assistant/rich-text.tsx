import Link from "next/link"
import { Fragment, type ReactNode } from "react"
import { parseMarkdown, type Inline } from "@/lib/chat/markdown"

// Pinta una respuesta de Syn con su formato (negrita, listas, enlaces…). Todo son
// elementos de React a partir de lib/chat/markdown.ts: nunca HTML crudo.
//
// Los enlaces al propio sitio usan next/link: navegan sin recargar la página, así que
// el widget sigue montado y la conversación no se pierde. Los externos y los archivos
// del sitio (el CV en PDF) abren en otra pestaña.

const linkCls = "font-medium text-primary underline underline-offset-2 hover:opacity-80"

function renderInline(nodes: Inline[]): ReactNode[] {
  return nodes.map((n, i) => {
    switch (n.t) {
      case "text":
        return <Fragment key={i}>{n.v}</Fragment>
      case "br":
        return <br key={i} />
      case "strong":
        return (
          <strong key={i} className="font-semibold text-foreground">
            {renderInline(n.c)}
          </strong>
        )
      case "em":
        return <em key={i}>{renderInline(n.c)}</em>
      case "code":
        return (
          <code key={i} className="rounded bg-background/70 px-1 py-px font-mono text-[0.92em]">
            {n.v}
          </code>
        )
      case "link":
        if (n.kind === "internal")
          return (
            <Link key={i} href={n.href} className={linkCls} data-track="mascot:answer-link">
              {renderInline(n.c)}
            </Link>
          )
        return (
          <a
            key={i}
            href={n.href}
            className={linkCls}
            data-track="mascot:answer-link"
            {...(n.kind === "external"
              ? { target: "_blank", rel: "noopener noreferrer nofollow" }
              : n.kind === "file"
                ? { target: "_blank", rel: "noopener" }
                : {})}
          >
            {renderInline(n.c)}
          </a>
        )
    }
  })
}

export function RichText({ text }: { text: string }) {
  const blocks = parseMarkdown(text)
  return (
    <div className="space-y-1.5">
      {blocks.map((b, i) => {
        if (b.t === "p") return <p key={i}>{renderInline(b.c)}</p>
        const items = b.items.map((it, j) => (
          <li key={j} className="pl-0.5">
            {renderInline(it)}
          </li>
        ))
        return b.t === "ul" ? (
          <ul key={i} className="list-disc space-y-0.5 pl-4 marker:text-primary/70">
            {items}
          </ul>
        ) : (
          <ol key={i} start={b.start} className="list-decimal space-y-0.5 pl-5 marker:text-primary/70">
            {items}
          </ol>
        )
      })}
    </div>
  )
}
