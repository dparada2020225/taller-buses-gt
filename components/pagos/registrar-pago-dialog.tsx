'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'

const METODOS = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'CHEQUE', label: 'Cheque' },
]

interface Props {
  trabajoId: string
}

export function RegistrarPagoDialog({ trabajoId }: Props) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const data = {
      monto: (form.elements.namedItem('monto') as HTMLInputElement).value,
      metodo: (form.elements.namedItem('metodo') as HTMLSelectElement).value,
      fecha: (form.elements.namedItem('fecha') as HTMLInputElement).value,
      notas: (form.elements.namedItem('notas') as HTMLInputElement).value,
    }

    const res = await fetch(`/api/trabajos/${trabajoId}/pagos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Error al registrar el pago')
      setLoading(false)
      return
    }

    setAbierto(false)
    router.refresh()
  }

  const hoy = new Date().toISOString().split('T')[0]

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="flex items-center gap-1.5 text-xs text-[#6DC424] hover:underline font-medium"
      >
        <Plus className="h-3.5 w-3.5" /> Registrar pago
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAbierto(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-xl bg-white shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">Registrar pago</h2>
              <button onClick={() => setAbierto(false)} className="text-gray-400 hover:text-gray-600">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto (Q)</label>
                <input
                  name="monto"
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Método</label>
                <select
                  name="metodo"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                >
                  {METODOS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input
                  name="fecha"
                  type="date"
                  defaultValue={hoy}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                />
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
                disabled={loading}
                className="w-full rounded-lg bg-[#0f0f0f] py-2.5 text-sm font-semibold text-white hover:bg-[#1a1a1a] transition disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Registrar pago'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
