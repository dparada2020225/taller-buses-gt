import { prisma } from '@/lib/prisma'
import { Topbar } from '@/components/dashboard/topbar'
import { NuevoInsumoDialog } from '@/components/inventario/nuevo-insumo-dialog'
import { EditarInsumoDialog } from '@/components/inventario/editar-insumo-dialog'
import { AjustarStockDialog } from '@/components/inventario/ajustar-stock-dialog'
import { formatearMoneda } from '@/lib/utils'
import { AlertTriangle, Package, ShoppingBag } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function InventarioPage() {
  const insumos = await prisma.insumo.findMany({ orderBy: { nombre: 'asc' } })

  const alertas = insumos.filter(i => Number(i.stockActual) <= Number(i.stockMinimo))
  const publicos = insumos.filter(i => i.esPublico)

  return (
    <>
      <Topbar titulo="Inventario" />
      <div className="p-6 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2.5">
              <Package className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total insumos</p>
              <p className="text-xl font-bold text-gray-900">{insumos.length}</p>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Bajo stock minimo</p>
              <p className="text-xl font-bold text-amber-600">{alertas.length}</p>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2.5">
              <ShoppingBag className="h-5 w-5 text-[#6DC424]" />
            </div>
            <div>
              <p className="text-xs text-gray-500">En catalogo publico</p>
              <p className="text-xl font-bold text-gray-900">{publicos.length}</p>
            </div>
          </div>
        </div>

        {/* Alertas de reabastecimiento */}
        {alertas.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-semibold text-amber-800">
                Reabastecimiento requerido ({alertas.length})
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {alertas.map(i => (
                <span
                  key={i.id}
                  className="rounded-full bg-white border border-amber-200 px-3 py-1 text-xs text-amber-800 font-medium"
                >
                  {i.nombre} - {Number(i.stockActual)} / min. {Number(i.stockMinimo)} {i.unidad}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tabla de insumos */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">
              Todos los insumos
              <span className="ml-2 text-xs font-normal text-gray-400">({insumos.length})</span>
            </h3>
            <NuevoInsumoDialog />
          </div>

          {insumos.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-gray-400">
              No hay insumos registrados todavia.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Unidad</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock actual</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Minimo</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio venta</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {insumos.map(insumo => {
                    const bajoStock = Number(insumo.stockActual) <= Number(insumo.stockMinimo)
                    return (
                      <tr key={insumo.id} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{insumo.nombre}</span>
                            {bajoStock && (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                            )}
                          </div>
                          {insumo.descripcion && (
                            <p className="text-xs text-gray-400 mt-0.5">{insumo.descripcion}</p>
                          )}
                        </td>
                        <td className="px-5 py-3 text-gray-500">{insumo.unidad}</td>
                        <td className={`px-5 py-3 text-right font-semibold tabular-nums ${bajoStock ? 'text-amber-600' : 'text-gray-900'}`}>
                          {Number(insumo.stockActual)}
                        </td>
                        <td className="px-5 py-3 text-right text-gray-400 tabular-nums">
                          {Number(insumo.stockMinimo)}
                        </td>
                        <td className="px-5 py-3">
                          {insumo.esPublico ? (
                            <span className="rounded-full bg-green-50 text-green-700 px-2 py-0.5 text-xs font-medium">
                              Publico
                            </span>
                          ) : (
                            <span className="rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 text-xs font-medium">
                              Interno
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right text-gray-600 tabular-nums">
                          {insumo.precioVenta ? formatearMoneda(Number(insumo.precioVenta)) : '-'}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <AjustarStockDialog
                              insumo={{
                                id: insumo.id,
                                nombre: insumo.nombre,
                                unidad: insumo.unidad,
                                stockActual: Number(insumo.stockActual),
                              }}
                            />
                            <EditarInsumoDialog
                              insumo={{
                                id: insumo.id,
                                nombre: insumo.nombre,
                                descripcion: insumo.descripcion,
                                unidad: insumo.unidad,
                                stockActual: Number(insumo.stockActual),
                                stockMinimo: Number(insumo.stockMinimo),
                                esPublico: insumo.esPublico,
                                precioVenta: insumo.precioVenta ? Number(insumo.precioVenta) : null,
                                imagenUrl: insumo.imagenUrl ?? null,
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Catalogo publico */}
        {publicos.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                Catalogo publico
                <span className="ml-2 text-xs font-normal text-gray-400">({publicos.length} productos)</span>
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-5">
              {publicos.map(p => (
                <div key={p.id} className="rounded-lg border border-gray-100 p-3 space-y-1">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">{p.nombre}</p>
                  <p className="text-xs text-gray-400">{Number(p.stockActual)} {p.unidad} disponibles</p>
                  <p className="text-sm font-bold text-[#6DC424]">
                    {p.precioVenta ? formatearMoneda(Number(p.precioVenta)) : '-'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
