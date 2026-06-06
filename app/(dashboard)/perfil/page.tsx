import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { Topbar } from '@/components/dashboard/topbar'
import { PerfilForm } from '@/components/perfil/perfil-form'

export const dynamic = 'force-dynamic'

export default async function PerfilPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const usuario = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, nombre: true, email: true, telefono: true, rol: true, createdAt: true },
  })
  if (!usuario) redirect('/login')

  return (
    <>
      <Topbar titulo="Mi perfil" />
      <div className="p-6 max-w-lg">
        <PerfilForm usuario={usuario} />
      </div>
    </>
  )
}
