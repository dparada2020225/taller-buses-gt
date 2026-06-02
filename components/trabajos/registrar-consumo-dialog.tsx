'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Package, X } from 'lucide-react'

interface Insumo {
  id: string
  nombre: string
  unidad: string
  stockActual: number
}

interface Props {
  trabajoId: string
}

export function RegistrarConsumoDialog({ trabajoId }: Props) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [insumoId, setInsumoId] = useState('')
  const [cargado, setCargado] = useState(false)

  useEffect(() => {
    if (abierto && !cargado) {
      setCargado(true)
      fetch('/api/insumos')
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            setInsumos(data)
            if (data.length > 0) setInsumoId(data[0].id)
          }
        })
        .catch(() => setCargado(false))
    }
  }, [abierto, cargado])

  const insumoSeleccionado = insumos.find(i => i.id === insumoId)

  function cerrar() { setAbierto(false); setError(''); setCargado(false) }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const data = {
      insumoId,
      cantidad: Number((form.elements.namedItem('cantidad') as HTMLInputElement).value),
      costoUnit: Number((form.elements.namedItem('costoUnit') as HTMLInputElement).value),
      notas: (form.elements.namedItem('notas') as HTMLInputElement).value || null,
    }

    const res = await fetch(`/api/trabajos/${trabajoId}/consumos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Error al registrar consumo')
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
        className="flex items-center gap-1.5 text-xs text-[#6DC424] hover:underline font-medium"
      >
        <Package className="h-3.5 w-3.5" /> Registrar consumo
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={cerrar} />
          <div className="relative z-10 w-full max-w-sm rounded-xl bg-white shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">Registrar consumo</h2>
              <button onClick={cerrar} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Insumo</label>
                <select
                  value={insumoId}
                  onChange={e => setInsumoId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                >
                  {insumos.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.nombre} ({Number(i.stockActual)} {i.unidad} disponibles)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad ({insumoSeleccionado?.unidad ?? ''})
                  </label>
                  <input
                    name="cantidad"
                    type="number"
                    step="0.001"
                    min="0.001"
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Costo unitario (Q)</label>
                  <input
                    name="costoUnit"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <input
                  name="notas"
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                  placeholder="Opcional"
                />
              </div>

              <button
                type="submit"
                disabled={loading || insumos.length === 0}
                className="w-full rounded-lg bg-[#0f0f0f] py-2.5 text-sm font-semibold text-white hover:bg-[#1a1a1a] transition disabled:opacity-50"
              >
                {loading ? 'Registrando...' : 'Registrar consumo'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
