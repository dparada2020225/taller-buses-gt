import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

// Rutas accesibles sin sesión
const RUTAS_PUBLICAS = [
  '/',
  '/login',
  '/registro',
  '/catalogo',
  '/olvide-password',
  '/restablecer',
  '/api/auth',
  '/api/ventas',   // POST desde catálogo público también necesita auth, pero el GET del catálogo no
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Recursos estáticos y rutas públicas: pasar directo
  if (
    pathname === '/' ||
    RUTAS_PUBLICAS.some((r) => r !== '/' && pathname.startsWith(r)) ||
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
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Nota: protección por rol se hace en cada Server Component / Route Handler via getSession().
  // El middleware solo garantiza que el usuario esté autenticado.
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
