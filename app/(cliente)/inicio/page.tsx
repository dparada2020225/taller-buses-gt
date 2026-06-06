import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { formatearFecha, formatearMoneda } from '@/lib/utils'
import { FileText, Wrench, CreditCard, AlertCircle } from 'lucide-react'

const ESTADO_COLOR: Record<string, string> = {
  COTIZACION: 'bg-gray-100 text-gray-600',
  EN_CURSO:   'bg-blue-50 text-blue-700',
  COMPLETADO: 'bg-green-50 text-green-700',
}

export default async function InicioClientePage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const trabajos = await prisma.trabajo.findMany({
    where: { clienteId: session.user.id, estado: { not: 'CANCELADO' } },
    include: {
      presupuestos: { orderBy: { creadoEn: 'desc' } },
      pagos: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const presupuestosPendientes = trabajos.flatMap(t =>
    t.presupuestos.filter(p => p.estado === 'PENDIENTE')
  )

  // Sumar inicial + todos los extras aprobados
  const totalPresupuestado = trabajos.reduce((sum, t) =>
    sum + t.presupuestos
      .filter(p => p.estado === 'APROBADO')
      .reduce((s, p) => s + Number(p.montoTotal), 0),
  0)

  const totalPagado = trabajos.reduce((sum, t) =>
    sum + t.pagos.reduce((s, p) => s + Number(p.monto), 0), 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Bienvenido, {session.user.nombre}</h1>
        <p className="text-sm text-gray-400">Aquí puedes ver el estado de tus trabajos y presupuestos.</p>
      </div>

      {presupuestosPendientes.length > 0 && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Tienes {presupuestosPendientes.length} presupuesto{presupuestosPendientes.length > 1 ? 's' : ''} pendiente{presupuestosPendientes.length > 1 ? 's' : ''} de aprobación
            </p>
            <Link href="/mis-presupuestos" className="text-xs text-yellow-700 underline mt-0.5">
              Ver presupuestos
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total presupuestado', valor: totalPresupuestado, icon: FileText, color: 'text-gray-900', iconColor: 'text-gray-400' },
          { label: 'Total pagado', valor: totalPagado, icon: CreditCard, color: 'text-green-700', iconColor: 'text-green-500' },
          { label: 'Saldo pendiente', valor: totalPresupuestado - totalPagado, icon: CreditCard, color: 'text-orange-600', iconColor: 'text-orange-400' },
        ].map(({ label, valor, icon: Icon, color, iconColor }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`h-4 w-4 ${iconColor}`} />
              <p className="text-xs text-gray-500">{label}</p>
            </div>
            <p className={`text-xl font-bold ${color}`}>{formatearMoneda(valor)}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Wrench className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Mis trabajos</h2>
        </div>

        {trabajos.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Wrench className="h-8 w-8 text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">No tienes trabajos registrados aún</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {trabajos.map((trabajo) => {
              const pagado = trabajo.pagos.reduce((s, p) => s + Number(p.monto), 0)
              const total  = trabajo.presupuestos
                .filter(p => p.estado === 'APROBADO')
                .reduce((s, p) => s + Number(p.montoTotal), 0)
              const pct = total > 0 ? Math.min(100, Math.round((pagado / total) * 100)) : 0

              return (
                <div key={trabajo.id} className="px-5 py-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{trabajo.descripcion}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_COLOR[trabajo.estado] ?? ''}`}>
                          {trabajo.estado.replace('_', ' ')}
                        </span>
                      </div>
                      {trabajo.nombreTransporte && (
                        <p className="text-xs text-gray-400">{trabajo.nombreTransporte}</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{formatearFecha(trabajo.createdAt)}</p>
                  </div>

                  {total > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Pagado: {formatearMoneda(pagado)}</span>
                        <span>Total: {formatearMoneda(total)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-[#6DC424] transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-gray-400">{pct}% pagado</p>
                    </div>
                  )}

                  {trabajo.presupuestos.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {trabajo.presupuestos.map(p => (
                        <Link
                          key={p.id}
                          href={`/mis-presupuestos/${p.id}`}
                          className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-[#6DC424] hover:text-[#6DC424] transition"
                        >
                          <FileText className="h-3 w-3" />
                          {p.tipo}
                          {p.estado === 'PENDIENTE' && (
                            <span className="font-semibold text-yellow-600">· Pendiente</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
