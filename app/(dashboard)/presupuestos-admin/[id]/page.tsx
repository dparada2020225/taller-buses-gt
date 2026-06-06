import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Topbar } from '@/components/dashboard/topbar'
import { VistaPresupuesto } from '@/components/presupuestos/vista-presupuesto'
import { ArrowLeft } from 'lucide-react'

export default async function PresupuestoPage({ params }: { params: { id: string } }) {
  const [presupuesto, auditoria] = await Promise.all([
    prisma.presupuesto.findUnique({
      where: { id: params.id },
      include: {
        trabajo: {
          include: {
            cliente: { select: { nombre: true, email: true, telefono: true } },
          },
        },
        secciones: {
          include: { lineas: { orderBy: { orden: 'asc' } } },
          orderBy: { orden: 'asc' },
        },
      },
    }),
    prisma.auditoria.findMany({
      where: { entidad: 'Presupuesto', entidadId: params.id },
      include: { usuario: { select: { nombre: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  if (!presupuesto) notFound()

  return (
    <>
      <Topbar titulo="Presupuesto" />
      <div className="p-6 space-y-4">
        <Link
          href={`/trabajos/${presupuesto.trabajoId}`}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver al trabajo
        </Link>
        <VistaPresupuesto presupuesto={presupuesto} auditoria={auditoria} />
      </div>
    </>
  )
}
