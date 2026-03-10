import type { ReactNode } from "react"
import { Card } from "@/components/ui/card"

interface BubbleCardProps {
  children: ReactNode
  className?: string
  size?: "sm" | "md" | "lg"
  variant?: "default" | "accent" | "muted"
  noAnimation?: boolean
}

export function BubbleCard({
  children,
  className = "",
  size = "md",
  variant = "default",
  noAnimation = false,
}: BubbleCardProps) {
  const sizeClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  }

  const variantClasses = {
    default: "bg-card border-border hover:border-primary/20",
    accent: "bg-primary/5 border-primary/20 hover:border-primary/40",
    muted: "bg-muted border-border hover:border-muted-foreground/20",
  }

  const animationClasses = noAnimation ? "" : "transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"

  return (
    <Card
      className={`
      ${sizeClasses[size]} 
      ${variantClasses[variant]}
      ${animationClasses}
      rounded-3xl border-2
      ${className}
    `}
    >
      {children}
    </Card>
  )
}
