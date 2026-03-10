"use client"

import { useEffect, useRef } from "react"

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { alpha: false })
    if (!ctx) return

    let animationFrameId: number

    // Resize canvas to match window
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    // Initial resize
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Star properties
    interface Star {
      x: number
      y: number
      radius: number
      speed: number
      opacity: number
      isLarge: boolean
    }

    const stars: Star[] = []

    // Helper to create stars
    // speed is basically pixels per frame (approx 60fps)
    const createStars = (count: number, size: number, speedBase: number, opacityBase: number, isLarge: boolean) => {
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: size,
          speed: speedBase + Math.random() * 0.5,
          opacity: opacityBase,
          isLarge
        })
      }
    }

    // Initialize stars matching previous counts and classes.
    // Assuming 60fps, falling total screen height in ~15-25s requires speeds around 0.3 - 0.8
    createStars(100, 0.5, 0.4, 0.5, false) // small 
    createStars(50, 1.0, 0.6, 0.7, false)  // medium
    createStars(20, 1.5, 0.8, 1.0, true)  // large

    // Animation loop
    const render = () => {
      // Clear canvas efficiently
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw background explicitly since alpha: false
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height, 0,
        canvas.width / 2, canvas.height, canvas.height
      )
      gradient.addColorStop(0, '#1a0033')
      gradient.addColorStop(1, '#000000')

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      stars.forEach(star => {
        // Move star down
        star.y += star.speed

        // Reset to top if it goes off screen seamlessly
        if (star.y > canvas.height + 10) {
          star.y = -10
          star.x = Math.random() * canvas.width
        }

        // Draw primary star body
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`
        ctx.fill()

        // Fast fake glow for large stars instead of shadowBlur
        if (star.isLarge) {
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.radius * 2.5, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(168, 85, 247, 0.3)` // Purple subtle glow
          ctx.fill()
        }
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ zIndex: -10 }}
      className="fixed inset-0 w-full h-full pointer-events-none"
    />
  )
}
