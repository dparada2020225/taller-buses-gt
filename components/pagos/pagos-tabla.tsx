'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { formatearFecha, formatearMoneda } from '@/lib/utils'
import { CreditCard, TrendingUp, Search, X, Filter } from 'lucide-react'

const METODOS: Record<string, string> = {
  EFECTIVO:      'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  CHEQUE:        'Cheque',
}

interface Pago {
  id: string
  monto: string
  metodo: 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE'
  fecha: string
  notas: string | null
  trabajo: {
    id: string
    descripcion: string
    nombreTransporte: string | null
    cliente: { nombre: string }
  }
}

export function PagosTabla() {
  const [pagos, setPagos]       = useState<Pago[]>([])
  const [cargando, setCargando] = useState(true)
  const [q, setQ]               = useState('')
  const [metodo, setMetodo]     = useState('')
  const [desde, setDesde]       = useState('')
  const [hasta, setHasta]       = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    const params = new URLSearchParams()
    if (q)      params.set('q', q)
    if (metodo) params.set('metodo', metodo)
    if (desde)  params.set('desde', desde)
    if (hasta)  params.set('hasta', hasta)

    const res = await fetch(`/api/pagos?${params}`)
    if (res.ok) setPagos(await res.json())
    setCargando(false)
  }, [q, metodo, desde, hasta])

  useEffect(() => { cargar() }, [cargar])

  const totalFiltrado = pagos.reduce((s, p) => s + Number(p.monto), 0)
  const porMetodo = Object.fromEntries(
    Object.keys(METODOS).map(m => [
      m,
      pagos.filter(p => p.metodo === m).reduce((s, p) => s + Number(p.monto), 0),
    ])
  )
  const tieneFiltros = q || metodo || desde || hasta

  function limpiar() { setQ(''); setMetodo(''); setDesde(''); setHasta('') }

  return (
    <div className="p-6 space-y-6">

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="h-4 w-4 text-gray-400" />
            <p className="text-xs text-gray-500">Registros</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{pagos.length}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <p className="text-xs text-gray-500">Total recibido</p>
          </div>
          <p className="text-2xl font-bold text-green-700">{formatearMoneda(totalFiltrado)}</p>
        </div>

        {Object.entries(METODOS).map(([key, label]) => (
          <div key={key} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-xl font-bold text-gray-900">
              {formatearMoneda(porMetodo[key] ?? 0)}
            </p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs text-gray-500 mb-1">Buscar cliente</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Nombre del cliente..."
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Método</label>
            <select
              value={metodo}
              onChange={e => setMetodo(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
            >
              <option value="">Todos</option>
              {Object.entries(METODOS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={e => setDesde(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={e => setHasta(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
            />
          </div>

          {tieneFiltros && (
            <button
              onClick={limpiar}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 transition"
            >
              <X className="h-3.5 w-3.5" /> Limpiar
            </button>
          )}
        </div>

        {tieneFiltros && (
          <p className="mt-2 text-xs text-gray-400 flex items-center gap-1">
            <Filter className="h-3 w-3" />
            {pagos.length} resultado{pagos.length !== 1 ? 's' : ''} con filtros aplicados
          </p>
        )}
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {cargando ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400 gap-2">
            <div className="h-4 w-4 rounded-full border-2 border-gray-300 border-t-[#6DC424] animate-spin" />
            Cargando pagos...
          </div>
        ) : pagos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CreditCard className="h-10 w-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">
              {tieneFiltros ? 'No hay pagos con esos filtros' : 'No hay pagos registrados'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trabajo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Método</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Notas</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagos.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {p.trabajo.cliente.nombre}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/trabajos/${p.trabajo.id}`}
                      className="text-[#6DC424] hover:underline"
                    >
                      {p.trabajo.nombreTransporte ?? p.trabajo.descripcion}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatearFecha(p.fecha)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      p.metodo === 'EFECTIVO'      ? 'bg-green-50 text-green-700'  :
                      p.metodo === 'TRANSFERENCIA' ? 'bg-blue-50 text-blue-700'    :
                                                     'bg-gray-100 text-gray-600'
                    }`}>
                      {METODOS[p.metodo]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 max-w-[180px] truncate">
                    {p.notas ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-700">
                    {formatearMoneda(Number(p.monto))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-gray-700">
                  Total mostrado
                </td>
                <td className="px-4 py-3 text-right text-base font-bold text-green-700">
                  {formatearMoneda(totalFiltrado)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}
