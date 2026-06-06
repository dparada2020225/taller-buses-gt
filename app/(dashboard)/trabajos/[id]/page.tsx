import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Topbar } from '@/components/dashboard/topbar'
import { formatearFecha, formatearMoneda } from '@/lib/utils'
import { ArrowLeft, FileText, Plus } from 'lucide-react'
import { CambiarEstadoTrabajo } from '@/components/trabajos/cambiar-estado'
import { RegistrarPagoDialog } from '@/components/pagos/registrar-pago-dialog'
import { RegistrarConsumoDialog } from '@/components/trabajos/registrar-consumo-dialog'

const PRES_BADGE: Record<string, string> = {
  PENDIENTE: 'bg-yellow-50 text-yellow-700',
  APROBADO:  'bg-green-50 text-green-700',
  RECHAZADO: 'bg-red-50 text-red-600',
}

export default async function TrabajoPage({ params }: { params: { id: string } }) {
  const trabajo = await prisma.trabajo.findUnique({
    where: { id: params.id },
    include: {
      cliente: { select: { id: true, nombre: true, email: true, telefono: true } },
      presupuestos: {
        orderBy: { creadoEn: 'desc' },
        select: { id: true, folio: true, tipo: true, estado: true, montoTotal: true, creadoEn: true },
      },
      pagos: { orderBy: { fecha: 'desc' } },
      consumos: {
        include: { insumo: { select: { nombre: true, unidad: true } } },
        orderBy: { fecha: 'desc' },
        take: 10,
      },
    },
  })

  if (!trabajo) notFound()

  // Total = inicial aprobado + todos los extras aprobados
  const presupuestosAprobados = trabajo.presupuestos.filter(p => p.estado === 'APROBADO')
  const totalPresupuestado = presupuestosAprobados.reduce((s, p) => s + Number(p.montoTotal), 0)
  const totalPagado = trabajo.pagos.reduce((s, p) => s + Number(p.monto), 0)
  const saldo = totalPresupuestado - totalPagado

  return (
    <>
      <Topbar titulo={trabajo.cliente.nombre} />
      <div className="p-6 space-y-5">
        <Link href="/trabajos" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 w-fit">
          <ArrowLeft className="h-3.5 w-3.5" /> Volver a trabajos
        </Link>

        {/* Encabezado */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-gray-900">{trabajo.descripcion}</h2>
            {trabajo.nombreTransporte && (
              <p className="text-sm text-gray-500">{trabajo.nombreTransporte}{trabajo.noPlaca ? ` / ${trabajo.noPlaca}` : ''}</p>
            )}
            <p className="text-sm text-gray-500">
              Cliente: <Link href={`/clientes/${trabajo.cliente.id}`} className="text-[#6DC424] hover:underline">{trabajo.cliente.nombre}</Link>
              {trabajo.cliente.telefono && ` · ${trabajo.cliente.telefono}`}
            </p>
            <p className="text-xs text-gray-400">Creado el {formatearFecha(trabajo.createdAt)}</p>
          </div>
          <CambiarEstadoTrabajo trabajoId={trabajo.id} estadoActual={trabajo.estado} />
        </div>

        {/* Resumen financiero */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Presupuestado', valor: totalPresupuestado, color: 'text-gray-900' },
            { label: 'Pagado',        valor: totalPagado,        color: 'text-green-700' },
            { label: 'Saldo',         valor: saldo,              color: saldo > 0 ? 'text-orange-600' : 'text-gray-400' },
          ].map(({ label, valor, color }) => (
            <div key={label} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{formatearMoneda(valor)}</p>
            </div>
          ))}
        </div>

        {/* Presupuestos */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Presupuestos</h3>
            <Link
              href={`/presupuestos-admin/nuevo?trabajoId=${trabajo.id}&clienteId=${trabajo.cliente.id}`}
              className="flex items-center gap-1.5 text-xs text-[#6DC424] hover:underline font-medium"
            >
              <Plus className="h-3.5 w-3.5" /> Agregar extra
            </Link>
          </div>
          {trabajo.presupuestos.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-400">Sin presupuestos</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {trabajo.presupuestos.map(p => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <Link href={`/presupuestos-admin/${p.id}`} className="flex items-center gap-2 group">
                    <FileText className="h-4 w-4 text-gray-300 group-hover:text-[#6DC424]" />
                    <span className="text-sm text-gray-700 group-hover:text-[#6DC424]">
                      #{String(p.folio).padStart(4, '0')} · {p.tipo}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRES_BADGE[p.estado]}`}>{p.estado}</span>
                  </Link>
                  <span className="text-sm font-semibold text-gray-700">{formatearMoneda(Number(p.montoTotal))}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagos */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Pagos</h3>
            <RegistrarPagoDialog trabajoId={trabajo.id} />
          </div>
          {trabajo.pagos.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-400">Sin pagos registrados</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Método</th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Notas</th>
                  <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {trabajo.pagos.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-600">{formatearFecha(p.fecha)}</td>
                    <td className="px-5 py-3 text-gray-600">{p.metodo}</td>
                    <td className="px-5 py-3 text-gray-400">{p.notas ?? '—'}</td>
                    <td className="px-5 py-3 text-right font-semibold text-green-700">{formatearMoneda(Number(p.monto))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Consumo de insumos */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Consumo de insumos</h3>
            <RegistrarConsumoDialog trabajoId={trabajo.id} />
          </div>
          {trabajo.consumos.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-400">Sin consumos registrados</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Insumo</th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Cantidad</th>
                  <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Costo</th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {trabajo.consumos.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-700">{c.insumo.nombre}</td>
                    <td className="px-5 py-3 text-gray-600">{Number(c.cantidad)} {c.insumo.unidad}</td>
                    <td className="px-5 py-3 text-right text-gray-700">{formatearMoneda(Number(c.costoUnit) * Number(c.cantidad))}</td>
                    <td className="px-5 py-3 text-gray-400">{formatearFecha(c.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
