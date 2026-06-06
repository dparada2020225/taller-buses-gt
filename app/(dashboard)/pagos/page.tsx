import { Topbar } from '@/components/dashboard/topbar'
import { PagosTabla } from '@/components/pagos/pagos-tabla'

export default function PagosPage() {
  return (
    <>
      <Topbar titulo="Pagos" />
      <PagosTabla />
    </>
  )
}
