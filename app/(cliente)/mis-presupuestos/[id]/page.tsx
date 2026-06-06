import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { VistaPresupuestoCliente } from '@/components/presupuestos/vista-presupuesto-cliente'
import { ArrowLeft } from 'lucide-react'

export default async function PresupuestoClientePage({ params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const presupuesto = await prisma.presupuesto.findUnique({
    where: { id: params.id },
    include: {
      trabajo: {
        include: {
          cliente: { select: { nombre: true, telefono: true } },
        },
      },
      secciones: {
        include: { lineas: { orderBy: { orden: 'asc' } } },
        orderBy: { orden: 'asc' },
      },
    },
  })

  if (!presupuesto) notFound()

  if (presupuesto.trabajo.clienteId !== session.user.id) {
    redirect('/mis-presupuestos')
  }

  return (
    <div className="p-6 space-y-4">
      <Link
        href="/mis-presupuestos"
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition w-fit"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Volver a mis presupuestos
      </Link>
      <VistaPresupuestoCliente presupuesto={presupuesto} />
    </div>
  )
}
