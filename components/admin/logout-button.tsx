"use client"

import { Button } from "@/components/ui/button"

export function LogoutButton() {
  const handleLogout = async () => {
    await fetch("/auth/logout", { method: "POST" })
    window.location.href = "/login"
  }
  return (
    <Button variant="outline" size="sm" className="rounded-full text-xs bg-transparent" onClick={handleLogout}>
      Salir
    </Button>
  )
}
