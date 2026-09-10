import type { HeatPoint } from "@/lib/analytics"

// Heatmap de clics sin dependencias: SVG con un círculo translúcido por clic; la
// densidad se ve por acumulación de opacidad. Coordenadas normalizadas (‰ del ancho
// del viewport y ‰ del alto total de la página), así que mezcla tamaños de pantalla
// de forma aproximada; el filtro por dispositivo lo afina.
export function ClickHeatmap({ points, path }: { points: HeatPoint[]; path: string }) {
  if (!points.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
        Sin clics registrados en <code className="mx-1 rounded bg-background/60 px-1.5 py-0.5">{path}</code> para este filtro.
      </div>
    )
  }

  // Proporción alto/ancho de la página: mediana de ph/vw entre los clics con datos.
  const ratios = points.filter((p) => p.vw > 0 && p.ph > 0).map((p) => p.ph / p.vw).sort((a, b) => a - b)
  const aspect = Math.min(8, Math.max(1.2, ratios.length ? ratios[Math.floor(ratios.length / 2)] : 3))
  const W = 1000
  const H = Math.round(W * aspect)
  const r = Math.max(10, Math.round(W / 70))

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background/40">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={`Heatmap de clics en ${path}`}>
        <rect x={0} y={0} width={W} height={H} fill="transparent" />
        {Array.from({ length: 9 }, (_, i) => (i + 1) * 10).map((pct) => (
          <g key={pct}>
            <line x1={0} x2={W} y1={(H * pct) / 100} y2={(H * pct) / 100} stroke="currentColor" strokeOpacity={0.08} />
            <text x={8} y={(H * pct) / 100 - 6} fontSize={r} fill="currentColor" fillOpacity={0.35}>
              {pct}%
            </text>
          </g>
        ))}
        <g style={{ mixBlendMode: "multiply" }}>
          {points.map((p, i) => (
            <circle
              key={i}
              cx={(p.x / 1000) * W}
              cy={(p.y / 1000) * H}
              r={r}
              fill="rgb(239 68 68)"
              fillOpacity={0.16}
            />
          ))}
        </g>
      </svg>
    </div>
  )
}
