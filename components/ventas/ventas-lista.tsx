'use client'

import { useEffect, useState, useCallback } from 'react'
import { formatearFecha, formatearMoneda } from '@/lib/utils'
import { ShoppingBag, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'

const ESTADO_BADGE: Record<string, string> = {
  PENDIENTE:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  CONFIRMADA: 'bg-green-50 text-green-700 border-green-200',
  CANCELADA:  'bg-red-50 text-red-600 border-red-200',
}

const METODOS: Record<string, string> = {
  EFECTIVO:      'Efectivo',
  TRANSFERENCIA: 'Transferencia',
}

interface LineaVenta {
  id: string
  cantidad: string
  precioUnit: string
  insumo: { nombre: string; unidad: string; imagenUrl: string | null }
}

interface Venta {
  id: string
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA'
  total: string
  metodo: string | null
  notas: string | null
  createdAt: string
  cliente: { nombre: string; email: string }
  lineas: LineaVenta[]
}

export function VentasLista() {
  const [ventas, setVentas]           = useState<Venta[]>([])
  const [cargando, setCargando]       = useState(true)
  const [filtro, setFiltro]           = useState('')
  const [expandida, setExpandida]     = useState<string | null>(null)
  const [procesando, setProcesando]   = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    const params = new URLSearchParams()
    if (filtro) params.set('estado', filtro)
    const res = await fetch(`/api/ventas?${params}`)
    if (res.ok) setVentas(await res.json())
    setCargando(false)
  }, [filtro])

  useEffect(() => { cargar() }, [cargar])

  async function cambiarEstado(id: string, estado: 'CONFIRMADA' | 'CANCELADA') {
    setProcesando(id)
    const res = await fetch(`/api/ventas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    })
    if (res.ok) await cargar()
    setProcesando(null)
  }

  const pendientes       = ventas.filter(v => v.estado === 'PENDIENTE').length
  const confirmadas      = ventas.filter(v => v.estado === 'CONFIRMADA')
  const totalConfirmado  = confirmadas.reduce((s, v) => s + Number(v.total), 0)

  return (
    <div className="p-6 space-y-6">

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex items-center gap-3">
          <div className="rounded-lg bg-yellow-50 p-2.5">
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Pendientes de confirmación</p>
            <p className="text-2xl font-bold text-yellow-700">{pendientes}</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex items-center gap-3">
          <div className="rounded-lg bg-green-50 p-2.5">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Ventas confirmadas</p>
            <p className="text-2xl font-bold text-green-700">{confirmadas.length}</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Total confirmado</p>
          <p className="text-2xl font-bold text-gray-900">{formatearMoneda(totalConfirmado)}</p>
        </div>
      </div>

      {/* Filtro de estado */}
      <div className="flex gap-2">
        {[
          { value: '',           label: 'Todos' },
          { value: 'PENDIENTE',  label: 'Pendientes' },
          { value: 'CONFIRMADA', label: 'Confirmadas' },
          { value: 'CANCELADA',  label: 'Canceladas' },
        ].map(op => (
          <button
            key={op.value}
            onClick={() => setFiltro(op.value)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition border ${
              filtro === op.value
                ? 'bg-[#0f0f0f] text-white border-[#0f0f0f]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {op.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {cargando ? (
        <div className="flex items-center justify-center py-16 text-sm text-gray-400 gap-2">
          <div className="h-4 w-4 rounded-full border-2 border-gray-300 border-t-[#6DC424] animate-spin" />
          Cargando ventas...
        </div>
      ) : ventas.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col items-center py-16 text-center">
          <ShoppingBag className="h-10 w-10 text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">
            {filtro ? 'No hay ventas con ese estado' : 'No hay ventas registradas'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {ventas.map(venta => (
            <div
              key={venta.id}
              className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
            >
              {/* Fila principal */}
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{venta.cliente.nombre}</p>
                    <p className="text-xs text-gray-400">
                      {venta.cliente.email} · {formatearFecha(venta.createdAt)}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${ESTADO_BADGE[venta.estado]}`}>
                    {venta.estado}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {venta.metodo && (
                    <span className="text-xs text-gray-500 hidden sm:block">
                      {METODOS[venta.metodo] ?? venta.metodo}
                    </span>
                  )}
                  <span className="text-base font-bold text-gray-900">
                    {formatearMoneda(Number(venta.total))}
                  </span>

                  {venta.estado === 'PENDIENTE' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => cambiarEstado(venta.id, 'CONFIRMADA')}
                        disabled={procesando === venta.id}
                        className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition disabled:opacity-50"
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Confirmar
                      </button>
                      <button
                        onClick={() => cambiarEstado(venta.id, 'CANCELADA')}
                        disabled={procesando === venta.id}
                        className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Cancelar
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setExpandida(expandida === venta.id ? null : venta.id)}
                    className="text-gray-400 hover:text-gray-600 ml-1"
                  >
                    {expandida === venta.id
                      ? <ChevronUp className="h-4 w-4" />
                      : <ChevronDown className="h-4 w-4" />
                    }
                  </button>
                </div>
              </div>

              {/* Detalle expandible */}
              {expandida === venta.id && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-3">
                  {venta.notas && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Notas:</span> {venta.notas}
                    </p>
                  )}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                        <th className="pb-2">Producto</th>
                        <th className="pb-2 text-center">Cant.</th>
                        <th className="pb-2 text-right">P. Unit.</th>
                        <th className="pb-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {venta.lineas.map(l => (
                        <tr key={l.id}>
                          <td className="py-2 text-gray-800">{l.insumo.nombre}</td>
                          <td className="py-2 text-center text-gray-600">
                            {Number(l.cantidad)} {l.insumo.unidad}
                          </td>
                          <td className="py-2 text-right text-gray-600">
                            {formatearMoneda(Number(l.precioUnit))}
                          </td>
                          <td className="py-2 text-right font-semibold text-gray-900">
                            {formatearMoneda(Number(l.precioUnit) * Number(l.cantidad))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
