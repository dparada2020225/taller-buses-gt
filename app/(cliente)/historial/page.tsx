import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { formatearFecha, formatearMoneda } from '@/lib/utils'
import { History, FileText } from 'lucide-react'

export default async function HistorialPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const trabajos = await prisma.trabajo.findMany({
    where: { clienteId: session.user.id },
    include: {
      presupuestos: { orderBy: { creadoEn: 'asc' } },
      pagos: { orderBy: { fecha: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const completados = trabajos.filter(t => t.estado === 'COMPLETADO')
  const todos = trabajos

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-gray-400" />
        <h1 className="text-lg font-semibold text-gray-900">Historial de trabajos</h1>
      </div>

      {todos.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col items-center py-16 text-center">
          <History className="h-10 w-10 text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">No hay trabajos registrados aún</p>
        </div>
      ) : (
        <div className="space-y-3">
          {todos.map((trabajo) => {
            const totalPagado = trabajo.pagos.reduce((s, p) => s + Number(p.monto), 0)
            const presInicial = trabajo.presupuestos.find(p => p.tipo === 'INICIAL')
            const extras = trabajo.presupuestos.filter(p => p.tipo === 'EXTRA')

            const ESTADO_STYLE: Record<string, { bg: string; text: string }> = {
              COTIZACION: { bg: 'bg-gray-100', text: 'text-gray-600' },
              EN_CURSO:   { bg: 'bg-blue-50',  text: 'text-blue-700' },
              COMPLETADO: { bg: 'bg-green-50', text: 'text-green-700' },
              CANCELADO:  { bg: 'bg-red-50',   text: 'text-red-600' },
            }
            const estilo = ESTADO_STYLE[trabajo.estado] ?? ESTADO_STYLE.COTIZACION

            return (
              <div key={trabajo.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                {/* Encabezado */}
                <div className="px-5 py-4 flex items-start justify-between gap-4 border-b border-gray-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{trabajo.descripcion}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${estilo.bg} ${estilo.text}`}>
                        {trabajo.estado.replace('_', ' ')}
                      </span>
                    </div>
                    {trabajo.nombreTransporte && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {trabajo.nombreTransporte}{trabajo.noPlaca ? ` / ${trabajo.noPlaca}` : ''}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 shrink-0">{formatearFecha(trabajo.createdAt)}</p>
                </div>

                <div className="px-5 py-3 space-y-3">
                  {/* Presupuestos */}
                  {trabajo.presupuestos.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-gray-500">Presupuestos</p>
                      {trabajo.presupuestos.map(p => (
                        <div key={p.id} className="flex items-center justify-between">
                          <Link
                            href={`/mis-presupuestos/${p.id}`}
                            className="flex items-center gap-2 text-xs text-gray-600 hover:text-[#6DC424] transition"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>{p.tipo === 'INICIAL' ? 'Presupuesto inicial' : `Extra #${trabajo.presupuestos.filter(x => x.tipo === 'EXTRA').indexOf(p) + 1}`}</span>
                            <span className={`font-medium ${p.estado === 'APROBADO' ? 'text-green-600' : p.estado === 'RECHAZADO' ? 'text-red-500' : 'text-yellow-600'}`}>
                              · {p.estado}
                            </span>
                          </Link>
                          <span className="text-xs font-semibold text-gray-700">{formatearMoneda(Number(p.montoTotal))}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pagos */}
                  {trabajo.pagos.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-gray-500">Pagos realizados</p>
                      {trabajo.pagos.map(pago => (
                        <div key={pago.id} className="flex justify-between text-xs text-gray-600">
                          <span>{formatearFecha(pago.fecha)} · {pago.metodo}</span>
                          <span className="font-medium text-green-700">{formatearMoneda(Number(pago.monto))}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-xs font-semibold text-gray-700 pt-1 border-t border-gray-100">
                        <span>Total pagado</span>
                        <span>{formatearMoneda(totalPagado)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
