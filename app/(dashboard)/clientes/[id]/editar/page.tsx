import { Topbar } from '@/components/dashboard/topbar'
import { EditarClienteForm } from '@/components/clientes/editar-cliente-form'

export default function EditarClientePage({ params }: { params: { id: string } }) {
  return (
    <>
      <Topbar titulo="Editar cliente" />
      <EditarClienteForm clienteId={params.id} />
    </>
  )
}
