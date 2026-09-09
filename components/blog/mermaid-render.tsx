"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"

// Renderiza los bloques <pre class="mermaid"> del post como diagramas SVG.
// Carga mermaid de forma diferida: solo se importa si el post tiene diagramas.
// Re-renderiza al cambiar el tema (claro/oscuro).
export function MermaidRender() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("pre.mermaid"))
    if (nodes.length === 0) return
    let cancelled = false

    ;(async () => {
      try {
        const mermaid = (await import("mermaid")).default
        // Guarda el código fuente para poder re-renderizar al cambiar de tema
        for (const n of nodes) {
          if (!n.dataset.src) n.dataset.src = n.textContent || ""
          n.removeAttribute("data-processed")
          n.innerHTML = n.dataset.src
        }
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: resolvedTheme === "dark" ? "dark" : "default",
          fontFamily: "inherit",
        })
        if (cancelled) return
        await mermaid.run({ nodes })
      } catch (e) {
        console.error("mermaid render error:", e)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [resolvedTheme])

  return null
}
