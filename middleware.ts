import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

// Rutas que no requieren sesión
const RUTAS_PUBLICAS = ['/login', '/registro', '/catalogo', '/api/auth']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Dejar pasar rutas públicas y assets
  if (
    RUTAS_PUBLICAS.some((r) => pathname.startsWith(r)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Verificar sesión leyendo la cookie que setea better-auth
  const session = getSessionCookie(req)

  if (!session) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
