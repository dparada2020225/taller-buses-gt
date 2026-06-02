import { prisma } from '@/lib/prisma'
import { Topbar } from '@/components/dashboard/topbar'
import { NuevoPresupuestoForm } from '@/components/presupuestos/nuevo-presupuesto-form'

export default async function NuevoPresupuestoPage() {
  const clientes = await prisma.user.findMany({
    where: { rol: 'CLIENTE' },
    select: { id: true, nombre: true, telefono: true },
    orderBy: { nombre: 'asc' },
  })

  return (
    <>
      <Topbar titulo="Nuevo presupuesto" />
      <div className="p-6 max-w-4xl">
        <NuevoPresupuestoForm clientes={clientes} />
      </div>
    </>
  )
}
