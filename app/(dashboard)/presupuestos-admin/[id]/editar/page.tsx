export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Topbar } from '@/components/dashboard/topbar'
import { EditarPresupuestoForm } from '@/components/presupuestos/editar-presupuesto-form'

export default async function EditarPresupuestoPage({ params }: { params: { id: string } }) {
  const presupuesto = await prisma.presupuesto.findUnique({
    where: { id: params.id },
    include: {
      trabajo: {
        include: { cliente: { select: { nombre: true } } },
      },
      secciones: {
        include: { lineas: { orderBy: { orden: 'asc' } } },
        orderBy: { orden: 'asc' },
      },
    },
  })

  if (!presupuesto) notFound()

  return (
    <>
      <Topbar titulo="Editar presupuesto" />
      <div className="p-6 max-w-4xl">
        <EditarPresupuestoForm presupuesto={presupuesto} />
      </div>
    </>
  )
}
