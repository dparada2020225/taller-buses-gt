import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Topbar } from '@/components/dashboard/topbar'
import { EditarPresupuestoForm } from '@/components/presupuestos/editar-presupuesto-form'
import { ArrowLeft } from 'lucide-react'

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
      <div className="p-6 max-w-4xl space-y-4">
        <Link
          href={`/presupuestos-admin/${params.id}`}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver al presupuesto
        </Link>
        <EditarPresupuestoForm presupuesto={presupuesto} />
      </div>
    </>
  )
}
