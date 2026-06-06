export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Topbar } from '@/components/dashboard/topbar'
import { formatearFecha, formatearMoneda } from '@/lib/utils'
import { Pencil, ArrowLeft, Wrench, FileText } from 'lucide-react'

const ESTADO_BADGE: Record<string, string> = {
  COTIZACION: 'bg-gray-100 text-gray-600',
  EN_CURSO:   'bg-blue-50 text-blue-700',
  COMPLETADO: 'bg-green-50 text-green-700',
  CANCELADO:  'bg-red-50 text-red-600',
}

const PRES_BADGE: Record<string, string> = {
  PENDIENTE: 'bg-yellow-50 text-yellow-700',
  APROBADO:  'bg-green-50 text-green-700',
  RECHAZADO: 'bg-red-50 text-red-600',
}

export default async function DetalleClientePage({ params }: { params: { id: string } }) {
  const cliente = await prisma.user.findUnique({
    where: { id: params.id, rol: 'CLIENTE' },
    include: {
      trabajos: {
        include: {
          presupuestos: {
            include: { secciones: false },
            orderBy: { creadoEn: 'desc' },
          },
          pagos: { orderBy: { fecha: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!cliente) notFound()

  // Calcular totales globales
  const totalPresupuestado = cliente.trabajos.reduce((sum, t) => {
    const presAprobado = t.presupuestos.find(p => p.estado === 'APROBADO' && p.tipo === 'INICIAL')
    return sum + Number(presAprobado?.montoTotal ?? 0)
  }, 0)

  const totalPagado = cliente.trabajos.reduce((sum, t) =>
    sum + t.pagos.reduce((s, p) => s + Number(p.monto), 0), 0)

  const saldoPendiente = totalPresupuestado - totalPagado

  return (
    <>
      <Topbar titulo={cliente.nombre} />
      <div className="p-6 space-y-5">
        {/* Breadcrumb */}
        <Link href="/clientes" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition w-fit">
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a clientes
        </Link>

        {/* Info + acciones */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-gray-900">{cliente.nombre}</h2>
            <p className="text-sm text-gray-500">{cliente.email}</p>
            {cliente.telefono && <p className="text-sm text-gray-500">{cliente.telefono}</p>}
            <p className="text-xs text-gray-400">Registrado el {formatearFecha(cliente.createdAt)}</p>
          </div>
          <Link
            href={`/clientes/${params.id}/editar`}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition shrink-0"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Link>
        </div>

        {/* Resumen financiero */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total presupuestado', valor: totalPresupuestado, color: 'text-gray-900' },
            { label: 'Total pagado', valor: totalPagado, color: 'text-green-700' },
            { label: 'Saldo pendiente', valor: saldoPendiente, color: saldoPendiente > 0 ? 'text-orange-600' : 'text-gray-400' },
          ].map(({ label, valor, color }) => (
            <div key={label} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{formatearMoneda(valor)}</p>
            </div>
          ))}
        </div>

        {/* Trabajos */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Trabajos ({cliente.trabajos.length})</h3>
            <Link
              href={`/presupuestos-admin/nuevo?clienteId=${params.id}`}
              className="flex items-center gap-1.5 text-xs text-[#6DC424] hover:underline font-medium"
            >
              <FileText className="h-3.5 w-3.5" />
              Nuevo presupuesto
            </Link>
          </div>

          {cliente.trabajos.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Wrench className="h-8 w-8 text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">Sin trabajos aún</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {cliente.trabajos.map((trabajo) => {
                const presInicial = trabajo.presupuestos.find(p => p.tipo === 'INICIAL')
                const totalPagadoTrabajo = trabajo.pagos.reduce((s, p) => s + Number(p.monto), 0)
                const saldo = Number(presInicial?.montoTotal ?? 0) - totalPagadoTrabajo

                return (
                  <div key={trabajo.id} className="px-5 py-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{trabajo.descripcion}</p>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_BADGE[trabajo.estado]}`}>
                            {trabajo.estado.replace('_', ' ')}
                          </span>
                        </div>
                        {trabajo.nombreTransporte && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {trabajo.nombreTransporte} {trabajo.noPlaca ? `/ ${trabajo.noPlaca}` : ''}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 shrink-0">{formatearFecha(trabajo.createdAt)}</p>
                    </div>

                    {/* Presupuestos del trabajo */}
                    {trabajo.presupuestos.length > 0 && (
                      <div className="ml-2 space-y-1.5">
                        {trabajo.presupuestos.map((p) => (
                          <div key={p.id} className="flex items-center justify-between text-xs">
                            <Link
                              href={`/presupuestos-admin/${p.id}`}
                              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                            >
                              <span className={`rounded-full px-2 py-0.5 font-medium ${PRES_BADGE[p.estado]}`}>
                                {p.tipo} · {p.estado}
                              </span>
                              <span className="text-[#6DC424] hover:underline">Ver PDF</span>
                            </Link>
                            <span className="font-semibold text-gray-700">{formatearMoneda(Number(p.montoTotal))}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pagos */}
                    {trabajo.pagos.length > 0 && (
                      <div className="ml-2 bg-gray-50 rounded-lg px-3 py-2 space-y-1">
                        <p className="text-xs font-medium text-gray-500">Pagos registrados</p>
                        {trabajo.pagos.map((pago) => (
                          <div key={pago.id} className="flex justify-between text-xs text-gray-600">
                            <span>{formatearFecha(pago.fecha)} · {pago.metodo}</span>
                            <span className="font-medium text-green-700">+{formatearMoneda(Number(pago.monto))}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-xs font-semibold pt-1 border-t border-gray-200">
                          <span className="text-gray-500">Saldo pendiente</span>
                          <span className={saldo > 0 ? 'text-orange-600' : 'text-green-600'}>
                            {formatearMoneda(saldo)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
