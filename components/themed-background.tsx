"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import Starfield from "@/components/starfield"
import { FloatingShapes } from "@/components/floating-shapes"

// Las estrellas y formas flotantes están diseñadas para fondo oscuro;
// en tema claro no se renderizan (el fondo claro lleva su propio gradiente CSS).
export function ThemedBackground() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted || resolvedTheme !== "dark") return null
  return (
    <>
      <Starfield />
      <FloatingShapes />
    </>
  )
}
