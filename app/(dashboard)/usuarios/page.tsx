import { prisma } from '@/lib/prisma'
import { Topbar } from '@/components/dashboard/topbar'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { formatearFecha } from '@/lib/utils'
import { UsuariosTabla } from '@/components/usuarios/usuarios-tabla'

export const dynamic = 'force-dynamic'

export default async function UsuariosPage() {
  const session = await getSession()
  if (!session || session.user.rol !== 'ADMIN') redirect('/dashboard')

  const usuarios = await prisma.user.findMany({
    select: {
      id: true,
      nombre: true,
      email: true,
      telefono: true,
      rol: true,
      emailVerified: true,
      createdAt: true,
      _count: { select: { trabajos: true } },
    },
    orderBy: [{ rol: 'asc' }, { createdAt: 'asc' }],
  })

  return (
    <>
      <Topbar titulo="Usuarios" />
      <UsuariosTabla usuarios={usuarios} sesionId={session.user.id} />
    </>
  )
}
