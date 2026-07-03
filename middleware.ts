import { NextResponse, type NextRequest } from "next/server"
import { jwtVerify } from "jose"

// Rutas del namespace /admin accesibles sin sesión
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/auth/login"]

export async function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").split(":")[0]
  const isAdminHost = host.startsWith("admin.")
  const { pathname } = req.nextUrl

  // Dominio público: /admin no existe
  if (!isAdminHost) {
    if (pathname.startsWith("/admin")) {
      return new NextResponse(null, { status: 404 })
    }
    return NextResponse.next()
  }

  // Host admin: todo vive bajo /admin vía rewrite (la URL del navegador queda limpia)
  const target = pathname.startsWith("/admin") ? pathname : `/admin${pathname === "/" ? "" : pathname}`
  const isPublic = PUBLIC_ADMIN_PATHS.some((p) => target === p)

  if (!isPublic) {
    const token = req.cookies.get("admin_session")?.value
    let authenticated = false
    if (token && process.env.SESSION_SECRET) {
      try {
        await jwtVerify(token, new TextEncoder().encode(process.env.SESSION_SECRET))
        authenticated = true
      } catch {
        authenticated = false
      }
    }
    if (!authenticated) {
      const url = req.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }
  }

  if (target !== pathname) {
    const url = req.nextUrl.clone()
    url.pathname = target
    return NextResponse.rewrite(url)
  }
  return NextResponse.next()
}

export const config = {
  // Excluye assets estáticos (_next, archivos con extensión) y las API públicas
  matcher: ["/((?!_next/|api/|.*\\..*).*)"],
}
