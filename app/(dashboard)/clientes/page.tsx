import { Topbar } from '@/components/dashboard/topbar'
import { ClientesTabla } from '@/components/clientes/clientes-tabla'
import { NuevoClienteDialog } from '@/components/clientes/nuevo-cliente-dialog'

export default function ClientesPage() {
  return (
    <>
      <Topbar titulo="Clientes" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Clientes registrados en el sistema</p>
          <NuevoClienteDialog />
        </div>
        <ClientesTabla />
      </div>
    </>
  )
}
