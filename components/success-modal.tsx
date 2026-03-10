"use client"

import { CheckCircle2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SuccessModal({ isOpen, onClose }: SuccessModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-300">
        <div className="bg-card/90 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 shadow-[0_0_50px_rgba(168,85,247,0.3)]">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Success icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <CheckCircle2 className="relative h-16 w-16 text-primary" />
            </div>
          </div>

          {/* Content */}
          <h3 className="text-2xl font-bold text-center mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Message Sent Successfully!
          </h3>
          <p className="text-center text-muted-foreground mb-6">
            Thank you for reaching out. I'll get back to you as soon as possible.
          </p>

          {/* Action button */}
          <Button
            onClick={onClose}
            size="lg"
            className="w-full rounded-full glow-effect hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all duration-300"
          >
            Got it!
          </Button>
        </div>
      </div>
    </div>
  )
}
