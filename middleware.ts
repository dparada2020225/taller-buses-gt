import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

const RUTAS_PUBLICAS = ['/login', '/registro', '/catalogo', '/api/auth']
const RUTAS_ADMIN = ['/dashboard', '/clientes', '/trabajos', '/presupuestos-admin', '/inventario', '/compras', '/pagos']
const RUTAS_CLIENTE = ['/inicio', '/mis-presupuestos', '/historial']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (
    RUTAS_PUBLICAS.some((r) => pathname.startsWith(r)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const session = getSessionCookie(req)

  if (!session) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Nota: el middleware no tiene acceso al rol (la cookie solo tiene el token).
  // La protección por rol se hace en cada Server Component / Route Handler via getSession().
  // Aquí solo garantizamos que el usuario esté autenticado.
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
