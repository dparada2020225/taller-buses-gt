import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Topbar } from '@/components/dashboard/topbar'
import { formatearFecha, formatearMoneda } from '@/lib/utils'
import { Wrench, Plus } from 'lucide-react'

const ESTADO: Record<string, { label: string; cls: string }> = {
  COTIZACION: { label: 'Cotización',  cls: 'bg-gray-100 text-gray-600' },
  EN_CURSO:   { label: 'En curso',    cls: 'bg-blue-50 text-blue-700' },
  COMPLETADO: { label: 'Completado',  cls: 'bg-green-50 text-green-700' },
  CANCELADO:  { label: 'Cancelado',   cls: 'bg-red-50 text-red-600' },
}

export default async function TrabajosPage() {
  const trabajos = await prisma.trabajo.findMany({
    include: {
      cliente: { select: { nombre: true } },
      presupuestos: { select: { montoTotal: true, estado: true, tipo: true } },
      pagos: { select: { monto: true } },
      _count: { select: { presupuestos: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <>
      <Topbar titulo="Trabajos" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{trabajos.length} trabajo{trabajos.length !== 1 ? 's' : ''}</p>
          <Link
            href="/presupuestos-admin/nuevo"
            className="flex items-center gap-2 rounded-lg bg-[#0f0f0f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a1a1a] transition"
          >
            <Plus className="h-4 w-4" />
            Nuevo trabajo
          </Link>
        </div>

        {trabajos.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col items-center justify-center py-16">
            <Wrench className="h-10 w-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">No hay trabajos registrados</p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Transporte</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Presupuestado</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Pagado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {trabajos.map(t => {
                  const presInicial = t.presupuestos.find(p => p.tipo === 'INICIAL' && p.estado === 'APROBADO')
                  const totalPagado = t.pagos.reduce((s, p) => s + Number(p.monto), 0)
                  const estado = ESTADO[t.estado] ?? ESTADO.COTIZACION
                  return (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{t.cliente.nombre}</td>
                      <td className="px-4 py-3 text-gray-500">{t.nombreTransporte ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${estado.cls}`}>{estado.label}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {presInicial ? formatearMoneda(Number(presInicial.montoTotal)) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-green-700">
                        {totalPagado > 0 ? formatearMoneda(totalPagado) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400">{formatearFecha(t.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/trabajos/${t.id}`} className="text-xs text-[#6DC424] hover:underline font-medium">
                          Ver
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
