'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpDown, X } from 'lucide-react'

interface Props {
  insumo: {
    id: string
    nombre: string
    unidad: string
    stockActual: number
  }
}

export function AjustarStockDialog({ insumo }: Props) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function cerrar() { setAbierto(false); setError('') }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const nuevoStock = Number((form.elements.namedItem('stockActual') as HTMLInputElement).value)

    const res = await fetch(`/api/insumos/${insumo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stockActual: nuevoStock }),
    })

    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Error al ajustar stock')
      setLoading(false)
      return
    }

    cerrar()
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
        title="Ajustar stock"
      >
        <ArrowUpDown className="h-4 w-4" />
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={cerrar} />
          <div className="relative z-10 w-full max-w-xs rounded-xl bg-white shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Ajustar stock</h2>
              <button onClick={cerrar} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              {insumo.nombre} — Actual: <strong>{Number(insumo.stockActual)} {insumo.unidad}</strong>
            </p>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo stock ({insumo.unidad})</label>
                <input
                  name="stockActual"
                  type="number"
                  step="0.001"
                  min="0"
                  defaultValue={Number(insumo.stockActual)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#0f0f0f] py-2.5 text-sm font-semibold text-white hover:bg-[#1a1a1a] transition disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Actualizar stock'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
