import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Topbar } from '@/components/dashboard/topbar'
import { VistaPresupuesto } from '@/components/presupuestos/vista-presupuesto'

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
      <div className="p-6">
        <VistaPresupuesto presupuesto={presupuesto} auditoria={auditoria} />
      </div>
    </>
  )
}
