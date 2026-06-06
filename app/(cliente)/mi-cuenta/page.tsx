import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { PerfilForm } from '@/components/perfil/perfil-form'

export const dynamic = 'force-dynamic'

export default async function MiCuentaPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const usuario = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, nombre: true, email: true, telefono: true, rol: true, createdAt: true },
  })
  if (!usuario) redirect('/login')

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-lg font-semibold text-gray-900 mb-6">Mi cuenta</h1>
      <PerfilForm usuario={usuario} />
    </div>
  )
}
