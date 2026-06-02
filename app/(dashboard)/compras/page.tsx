import { prisma } from '@/lib/prisma'
import { Topbar } from '@/components/dashboard/topbar'
import { NuevaCompraDialog } from '@/components/compras/nueva-compra-dialog'
import { formatearFecha, formatearMoneda } from '@/lib/utils'
import { ShoppingCart } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ComprasPage() {
  const compras = await prisma.compra.findMany({
    include: {
      proveedor: { select: { nombre: true } },
      lineas: {
        include: { insumo: { select: { nombre: true, unidad: true } } },
      },
    },
    orderBy: { fecha: 'desc' },
  })

  const totalGastado = compras.reduce((sum, c) => sum + Number(c.total), 0)
  const proveedoresUnicos = new Set(compras.map(c => c.proveedor.nombre)).size

  return (
    <>
      <Topbar titulo="Compras" />
      <div className="p-6 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Total compras</p>
            <p className="text-xl font-bold text-gray-900">{compras.length}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Total gastado</p>
            <p className="text-xl font-bold text-gray-900">{formatearMoneda(totalGastado)}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Proveedores</p>
            <p className="text-xl font-bold text-gray-900">{proveedoresUnicos}</p>
          </div>
        </div>

        {/* Historial */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">
              Historial de compras
              <span className="ml-2 text-xs font-normal text-gray-400">({compras.length})</span>
            </h3>
            <NuevaCompraDialog />
          </div>

          {compras.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <ShoppingCart className="h-10 w-10" />
              <p className="text-sm">No hay compras registradas</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {compras.map(compra => (
                <div key={compra.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{compra.proveedor.nombre}</span>
                        <span className="text-xs text-gray-400">{formatearFecha(compra.fecha)}</span>
                      </div>
                      {compra.notas && (
                        <p className="text-xs text-gray-500">{compra.notas}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {compra.lineas.map(l => (
                          <span
                            key={l.id}
                            className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
                          >
                            {l.insumo.nombre} x {Number(l.cantidad)} {l.insumo.unidad}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">{formatearMoneda(Number(compra.total))}</p>
                      <p className="text-xs text-gray-400">{compra.lineas.length} {compra.lineas.length === 1 ? 'insumo' : 'insumos'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
