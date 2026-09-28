"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

// El layout raíz pone <html lang> con la cabecera x-locale del middleware, pero
// / y /es comparten ese layout y Next no lo vuelve a renderizar al navegar entre
// ellos. Resultado: al cambiar de idioma con el botón de la barra, una página en
// español seguía anunciándose como lang="en" hasta recargar. Los lectores de
// pantalla eligen la voz y las reglas de pronunciación con ese atributo, así que
// aquí se mantiene al día desde la ruta, que sí es reactiva.
export function LocaleSync() {
  const pathname = usePathname() || "/"
  useEffect(() => {
    document.documentElement.lang = pathname === "/es" || pathname.startsWith("/es/") ? "es" : "en"
  }, [pathname])
  return null
}
