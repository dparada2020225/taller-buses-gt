export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { Topbar } from '@/components/dashboard/topbar'
import { NuevoPresupuestoForm } from '@/components/presupuestos/nuevo-presupuesto-form'

interface Props {
  searchParams: { clienteId?: string; trabajoId?: string }
}

export default async function NuevoPresupuestoPage({ searchParams }: Props) {
  const clientes = await prisma.user.findMany({
    where: { rol: 'CLIENTE' },
    select: { id: true, nombre: true, telefono: true },
    orderBy: { nombre: 'asc' },
  })

  // Si viene trabajoId, cargar el trabajo para pre-rellenar datos
  const trabajoExistente = searchParams.trabajoId
    ? await prisma.trabajo.findUnique({
        where: { id: searchParams.trabajoId },
        select: { id: true, clienteId: true, descripcion: true, nombreTransporte: true, noPlaca: true },
      })
    : null

  return (
    <>
      <Topbar titulo={trabajoExistente ? 'Agregar presupuesto extra' : 'Nuevo presupuesto'} />
      <div className="p-6 max-w-4xl">
        <NuevoPresupuestoForm
          clientes={clientes}
          clienteIdInicial={searchParams.clienteId ?? trabajoExistente?.clienteId ?? ''}
          trabajoExistente={trabajoExistente ?? null}
        />
      </div>
    </>
  )
}
