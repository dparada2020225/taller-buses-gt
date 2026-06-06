import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { formatearFecha, formatearMoneda } from '@/lib/utils'
import Link from 'next/link'
import { ShoppingBag, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

const ESTADO_BADGE: Record<string, string> = {
  PENDIENTE:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  CONFIRMADA: 'bg-green-50 text-green-700 border-green-200',
  CANCELADA:  'bg-red-50 text-red-600 border-red-200',
}

const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE:  'Pendiente de confirmación',
  CONFIRMADA: 'Confirmada',
  CANCELADA:  'Cancelada',
}

export default async function MisComprasPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const ventas = await prisma.venta.findMany({
    where: { clienteId: session.user.id },
    include: {
      lineas: {
        include: { insumo: { select: { nombre: true, unidad: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Mis compras</h1>
        <Link
          href="/catalogo"
          className="flex items-center gap-1.5 text-sm text-[#6DC424] hover:underline font-medium"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Ir al catálogo
        </Link>
      </div>

      {ventas.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col items-center py-16 text-center">
          <ShoppingBag className="h-10 w-10 text-gray-200 mb-3" />
          <p className="text-sm text-gray-400 mb-4">No tienes compras registradas</p>
          <Link
            href="/catalogo"
            className="rounded-lg bg-[#0f0f0f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a1a1a] transition"
          >
            Ver catálogo
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {ventas.map(venta => (
            <div key={venta.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              {/* Encabezado */}
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${ESTADO_BADGE[venta.estado]}`}>
                      {ESTADO_LABEL[venta.estado]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{formatearFecha(venta.createdAt)}</p>
                </div>
                <p className="text-base font-bold text-gray-900">{formatearMoneda(Number(venta.total))}</p>
              </div>

              {/* Líneas */}
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {venta.lineas.map(l => (
                  <div key={l.id} className="flex items-center justify-between px-5 py-2.5">
                    <span className="text-sm text-gray-700">{l.insumo.nombre}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-400">
                        {Number(l.cantidad)} {l.insumo.unidad} × {formatearMoneda(Number(l.precioUnit))}
                      </span>
                      <span className="font-medium text-gray-900 w-20 text-right">
                        {formatearMoneda(Number(l.cantidad) * Number(l.precioUnit))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              {venta.estado === 'PENDIENTE' && (
                <div className="border-t border-gray-100 px-5 py-3 bg-yellow-50">
                  <p className="text-xs text-yellow-700">
                    Tu pedido está siendo revisado. El equipo del taller confirmará el pago a la brevedad.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
