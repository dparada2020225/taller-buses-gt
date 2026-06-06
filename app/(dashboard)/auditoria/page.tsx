import { prisma } from '@/lib/prisma'
import { Topbar } from '@/components/dashboard/topbar'
import { formatearFechaHora } from '@/lib/utils'
import { Shield, User } from 'lucide-react'

export const dynamic = 'force-dynamic'

const ACCION_BADGE: Record<string, string> = {
  CREAR_INSUMO:           'bg-blue-50 text-blue-700',
  CREAR_VENTA:            'bg-blue-50 text-blue-700',
  CONFIRMAR_VENTA:        'bg-green-50 text-green-700',
  CANCELAR_VENTA:         'bg-red-50 text-red-600',
  CREAR_PRESUPUESTO:      'bg-purple-50 text-purple-700',
  EDITAR_PRESUPUESTO:     'bg-yellow-50 text-yellow-700',
  ELIMINAR_PRESUPUESTO:   'bg-red-50 text-red-600',
  REGISTRAR_PAGO:         'bg-green-50 text-green-700',
  CAMBIAR_ESTADO_TRABAJO: 'bg-gray-100 text-gray-700',
}

const PAGE_SIZE = 50

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: { pagina?: string; accion?: string; entidad?: string }
}) {
  const pagina  = Math.max(1, Number(searchParams.pagina ?? 1))
  const accion  = searchParams.accion  ?? ''
  const entidad = searchParams.entidad ?? ''

  const [registros, total] = await Promise.all([
    prisma.auditoria.findMany({
      where: {
        ...(accion  ? { accion:  { contains: accion,  mode: 'insensitive' } } : {}),
        ...(entidad ? { entidad: { contains: entidad, mode: 'insensitive' } } : {}),
      },
      include: { usuario: { select: { nombre: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: (pagina - 1) * PAGE_SIZE,
    }),
    prisma.auditoria.count({
      where: {
        ...(accion  ? { accion:  { contains: accion,  mode: 'insensitive' } } : {}),
        ...(entidad ? { entidad: { contains: entidad, mode: 'insensitive' } } : {}),
      },
    }),
  ])

  const totalPaginas = Math.ceil(total / PAGE_SIZE)

  function buildHref(params: Record<string, string>) {
    const p = new URLSearchParams({ ...(accion ? { accion } : {}), ...(entidad ? { entidad } : {}), ...params })
    return `/auditoria?${p}`
  }

  return (
    <>
      <Topbar titulo="Auditoría" />
      <div className="p-6 space-y-5">

        {/* KPI */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2.5">
              <Shield className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Eventos registrados</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
          </div>
        </div>

        {/* Filtros como form GET */}
        <form method="GET" className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex flex-wrap gap-3">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs text-gray-500 mb-1">Acción</label>
            <input
              name="accion"
              defaultValue={accion}
              placeholder="Ej: REGISTRAR_PAGO"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs text-gray-500 mb-1">Entidad</label>
            <input
              name="entidad"
              defaultValue={entidad}
              placeholder="Ej: Presupuesto, Pago..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="rounded-lg bg-[#0f0f0f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a1a1a] transition"
            >
              Filtrar
            </button>
            {(accion || entidad) && (
              <a
                href="/auditoria"
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 transition"
              >
                Limpiar
              </a>
            )}
          </div>
        </form>

        {/* Tabla */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {registros.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Shield className="h-10 w-10 text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">No hay registros de auditoría</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Acción</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Entidad</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registros.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
                      {formatearFechaHora(r.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {r.usuario ? (
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-gray-300" />
                          <span className="text-gray-700">{r.usuario.nombre}</span>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">Sistema</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ACCION_BADGE[r.accion] ?? 'bg-gray-100 text-gray-600'}`}>
                        {r.accion.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {r.entidad}
                      {r.entidadId && (
                        <span className="text-gray-300 text-xs ml-1">
                          #{r.entidadId.slice(0, 8)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-[240px] truncate font-mono">
                      {r.detalle ? JSON.stringify(r.detalle) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Página {pagina} de {totalPaginas} · {total} registros
            </p>
            <div className="flex gap-2">
              {pagina > 1 && (
                <a
                  href={buildHref({ pagina: String(pagina - 1) })}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                >
                  ← Anterior
                </a>
              )}
              {pagina < totalPaginas && (
                <a
                  href={buildHref({ pagina: String(pagina + 1) })}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                >
                  Siguiente →
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
