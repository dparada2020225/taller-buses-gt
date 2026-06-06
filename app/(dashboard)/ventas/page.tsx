export const dynamic = 'force-dynamic'

import { Topbar } from '@/components/dashboard/topbar'
import { VentasLista } from '@/components/ventas/ventas-lista'

export default function VentasPage() {
  return (
    <>
      <Topbar titulo="Ventas directas" />
      <VentasLista />
    </>
  )
}
