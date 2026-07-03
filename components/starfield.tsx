"use client"

import { useEffect, useRef } from "react"

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { alpha: false })
    if (!ctx) return

    let animationFrameId = 0
    let width = 0
    let height = 0
    let gradient: CanvasGradient | null = null

    // Tamaño lógico en px CSS + backing store escalado por devicePixelRatio
    // para que las estrellas se vean nítidas en pantallas retina.
    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // El gradiente se cachea aquí: crearlo en cada frame era costoso y
      // provocaba caídas de FPS visibles.
      gradient = ctx.createRadialGradient(width / 2, height, 0, width / 2, height, height)
      gradient.addColorStop(0, "#1a0033")
      gradient.addColorStop(1, "#000000")
    }

    interface Star {
      x: number
      y: number
      radius: number
      speed: number // px por frame de referencia (60 fps); se escala por delta-time
      opacity: number
      isLarge: boolean
    }

    const stars: Star[] = []

    const createStars = (count: number, size: number, speedBase: number, opacityBase: number, isLarge: boolean) => {
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: size,
          speed: speedBase + Math.random() * 0.5,
          opacity: opacityBase,
          isLarge,
        })
      }
    }

    const drawFrame = (delta: number) => {
      if (!gradient) return
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      for (const star of stars) {
        star.y += star.speed * delta

        if (star.y > height + 10) {
          star.y = -10
          star.x = Math.random() * width
        }

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`
        ctx.fill()

        if (star.isLarge) {
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.radius * 2.5, 0, Math.PI * 2)
          ctx.fillStyle = "rgba(168, 85, 247, 0.3)"
          ctx.fill()
        }
      }
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const handleResize = () => {
      resizeCanvas()
      if (reducedMotion) drawFrame(0)
    }

    resizeCanvas()
    window.addEventListener("resize", handleResize)

    createStars(100, 0.5, 0.4, 0.5, false) // pequeñas
    createStars(50, 1.0, 0.6, 0.7, false) // medianas
    createStars(20, 1.5, 0.8, 1.0, true) // grandes con glow

    if (reducedMotion) {
      // Accesibilidad: un solo frame estático, sin animación perpetua
      drawFrame(0)
      return () => window.removeEventListener("resize", handleResize)
    }

    // Movimiento por TIEMPO real, no por frame: la velocidad de caída es
    // idéntica a 60Hz, 144Hz o con FPS variable. delta = 1.0 equivale a un
    // frame de 60fps; se limita a 3 para no "teletransportar" estrellas al
    // volver de una pestaña en segundo plano.
    let lastTime = performance.now()
    const render = (now: number) => {
      const delta = Math.min((now - lastTime) / (1000 / 60), 3)
      lastTime = now
      drawFrame(delta)
      animationFrameId = requestAnimationFrame(render)
    }
    animationFrameId = requestAnimationFrame(render)

    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas ref={canvasRef} style={{ zIndex: -10 }} className="fixed inset-0 w-full h-full pointer-events-none" />
  )
}
