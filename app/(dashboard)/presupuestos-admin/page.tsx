export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Topbar } from '@/components/dashboard/topbar'
import { formatearFecha, formatearMoneda } from '@/lib/utils'
import { Plus, FileText } from 'lucide-react'

const ESTADO_BADGE: Record<string, string> = {
  PENDIENTE: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  APROBADO:  'bg-green-50 text-green-700 border-green-200',
  RECHAZADO: 'bg-red-50 text-red-700 border-red-200',
}

export default async function PresupuestosPage() {
  const presupuestos = await prisma.presupuesto.findMany({
    include: {
      trabajo: {
        include: { cliente: { select: { nombre: true } } },
      },
    },
    orderBy: { creadoEn: 'desc' },
  })

  return (
    <>
      <Topbar titulo="Presupuestos" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{presupuestos.length} presupuesto{presupuestos.length !== 1 ? 's' : ''} registrado{presupuestos.length !== 1 ? 's' : ''}</p>
          <Link
            href="/presupuestos-admin/nuevo"
            className="flex items-center gap-2 rounded-lg bg-[#0f0f0f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a1a1a] transition"
          >
            <Plus className="h-4 w-4" />
            Nuevo presupuesto
          </Link>
        </div>

        {presupuestos.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-10 w-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">No hay presupuestos registrados aún</p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Transporte</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {presupuestos.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.trabajo.cliente.nombre}</td>
                    <td className="px-4 py-3 text-gray-500">{p.trabajo.nombreTransporte ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">{p.tipo}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${ESTADO_BADGE[p.estado]}`}>
                        {p.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {formatearMoneda(Number(p.montoTotal))}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{formatearFecha(p.creadoEn)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/presupuestos-admin/${p.id}`}
                        className="text-xs text-[#6DC424] hover:underline font-medium"
                      >
                        Ver / PDF
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
