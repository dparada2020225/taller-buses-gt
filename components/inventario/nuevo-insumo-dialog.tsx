'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'

export function NuevoInsumoDialog() {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [esPublico, setEsPublico] = useState(false)

  function cerrar() { setAbierto(false); setError(''); setEsPublico(false) }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const data = {
      nombre: (form.elements.namedItem('nombre') as HTMLInputElement).value,
      descripcion: (form.elements.namedItem('descripcion') as HTMLInputElement).value,
      unidad: (form.elements.namedItem('unidad') as HTMLInputElement).value,
      stockActual: Number((form.elements.namedItem('stockActual') as HTMLInputElement).value),
      stockMinimo: Number((form.elements.namedItem('stockMinimo') as HTMLInputElement).value),
      esPublico,
      precioVenta: esPublico
        ? Number((form.elements.namedItem('precioVenta') as HTMLInputElement).value)
        : null,
    }

    const res = await fetch('/api/insumos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Error al crear el insumo')
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
        className="flex items-center gap-2 rounded-lg bg-[#0f0f0f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a1a1a] transition"
      >
        <Plus className="h-4 w-4" /> Nuevo insumo
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={cerrar} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">Nuevo insumo</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  name="nombre"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                  placeholder="Ej: Pintura sintética blanca"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input
                  name="descripcion"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                  placeholder="Opcional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de medida *</label>
                <input
                  name="unidad"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                  placeholder="Ej: galón, unidad, metro, libra"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock actual</label>
                  <input
                    name="stockActual"
                    type="number"
                    step="0.001"
                    min="0"
                    defaultValue="0"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo</label>
                  <input
                    name="stockMinimo"
                    type="number"
                    step="0.001"
                    min="0"
                    defaultValue="0"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={esPublico}
                    onChange={e => setEsPublico(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Visible en catálogo público</span>
                </label>
              </div>

              {esPublico && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio de venta (Q)</label>
                  <input
                    name="precioVenta"
                    type="number"
                    step="0.01"
                    min="0"
                    required={esPublico}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                    placeholder="0.00"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#0f0f0f] py-2.5 text-sm font-semibold text-white hover:bg-[#1a1a1a] transition disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Crear insumo'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
