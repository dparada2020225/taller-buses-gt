import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function getSession() {
  const session = await auth.api.getSession({ headers: headers() })
  if (!session?.user?.id) return null

  // better-auth no incluye campos custom (rol) en el objeto de sesión
  // los obtenemos directo de la BD
  const usuario = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, nombre: true, email: true, rol: true },
  })

  if (!usuario) return null

  return {
    ...session,
    user: {
      ...session.user,
      rol: usuario.rol,
      nombre: usuario.nombre,
    },
  }
}
