"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { dismissGeminiIncident } from "@/app/admin/actions"

export function DismissIncidentButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await dismissGeminiIncident()
          router.refresh()
        })
      }
      className="rounded-lg border border-current/30 px-2 py-1 text-xs hover:bg-yellow-500/15 disabled:opacity-50"
    >
      {pending ? "…" : "Descartar aviso"}
    </button>
  )
}
