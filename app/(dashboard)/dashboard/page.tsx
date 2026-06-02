import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Topbar } from '@/components/dashboard/topbar'
import { formatearFecha, formatearMoneda } from '@/lib/utils'
import { Users, Wrench, Package, CreditCard } from 'lucide-react'

export const dynamic = 'force-dynamic'

const ESTADO: Record<string, { label: string; cls: string }> = {
  COTIZACION: { label: 'Cotización', cls: 'bg-gray-100 text-gray-600' },
  EN_CURSO:   { label: 'En curso',   cls: 'bg-blue-50 text-blue-700' },
  COMPLETADO: { label: 'Completado', cls: 'bg-green-50 text-green-700' },
  CANCELADO:  { label: 'Cancelado',  cls: 'bg-red-50 text-red-600' },
}

export default async function DashboardPage() {
  const [
    totalClientes,
    trabajosEnCurso,
    todosTrabajosRecientes,
    todosInsumos,
    pagosEsteMes,
  ] = await Promise.all([
    prisma.user.count({ where: { rol: 'CLIENTE' } }),
    prisma.trabajo.count({ where: { estado: 'EN_CURSO' } }),
    prisma.trabajo.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        cliente: { select: { nombre: true } },
        presupuestos: { select: { montoTotal: true, estado: true, tipo: true } },
        pagos: { select: { monto: true } },
      },
    }),
    prisma.insumo.findMany({ select: { stockActual: true, stockMinimo: true } }),
    prisma.pago.aggregate({
      _sum: { monto: true },
      where: {
        fecha: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
  ])

  const insumosConAlerta = todosInsumos.filter(i => Number(i.stockActual) <= Number(i.stockMinimo)).length
  const totalPagosEsteMes = Number(pagosEsteMes._sum.monto ?? 0)

  const tarjetas = [
    { label: 'Clientes registrados', valor: totalClientes.toString(), icon: Users, color: 'text-blue-500', href: '/clientes' },
    { label: 'Trabajos en curso',     valor: trabajosEnCurso.toString(), icon: Wrench, color: 'text-[#6DC424]', href: '/trabajos' },
    { label: 'Insumos bajo stock',    valor: insumosConAlerta.toString(), icon: Package, color: 'text-orange-500', href: '/inventario' },
    { label: 'Cobros este mes',       valor: formatearMoneda(totalPagosEsteMes), icon: CreditCard, color: 'text-purple-500', href: '/pagos' },
  ]

  return (
    <>
      <Topbar titulo="Panel de administración" />
      <div className="p-6 space-y-6">
        {/* Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {tarjetas.map(({ label, valor, icon: Icon, color, href }) => (
            <Link
              key={label}
              href={href}
              className="rounded-xl border border-gray-200 bg-white p-5 flex items-center gap-4 shadow-sm hover:border-gray-300 transition"
            >
              <div className={`rounded-lg bg-gray-50 p-3 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{valor}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Trabajos recientes */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Trabajos recientes</h2>
            <Link href="/trabajos" className="text-xs text-[#6DC424] hover:underline font-medium">Ver todos</Link>
          </div>

          {todosTrabajosRecientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Wrench className="h-10 w-10 text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">No hay trabajos registrados aún</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {todosTrabajosRecientes.map(t => {
                const presInicial = t.presupuestos.find(p => p.tipo === 'INICIAL' && p.estado === 'APROBADO')
                const totalPagado = t.pagos.reduce((s, p) => s + Number(p.monto), 0)
                const estadoInfo = ESTADO[t.estado] ?? ESTADO.COTIZACION

                return (
                  <Link
                    key={t.id}
                    href={`/trabajos/${t.id}`}
                    className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${estadoInfo.cls}`}>
                        {estadoInfo.label}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t.cliente.nombre}</p>
                        <p className="text-xs text-gray-400">{formatearFecha(t.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {presInicial ? (
                        <>
                          <p className="text-sm font-semibold text-gray-900">{formatearMoneda(Number(presInicial.montoTotal))}</p>
                          <p className="text-xs text-gray-400">pagado {formatearMoneda(totalPagado)}</p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-400">sin presupuesto aprobado</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
