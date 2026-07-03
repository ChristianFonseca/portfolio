import { ImageResponse } from "next/og"

export const alt = "Christian Fonseca - AI Solutions Engineer"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(ellipse at top, #1e1033 0%, #0a0613 60%, #060409 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 84,
            fontWeight: 700,
            background: "linear-gradient(90deg, #a855f7, #ec4899)",
            backgroundClip: "text",
            color: "transparent",
            marginBottom: 24,
          }}
        >
          Christian Fonseca
        </div>
        <div style={{ fontSize: 36, color: "#e5e0f0", marginBottom: 48 }}>
          AI Engineer | Data Architect | Data Scientist
        </div>
        <div style={{ fontSize: 28, color: "#8b7fa8" }}>christianfonseca.dev</div>
      </div>
    ),
    size,
  )
}
