'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ESTADOS = [
  { value: 'COTIZACION', label: 'Cotización', color: 'bg-gray-100 text-gray-700' },
  { value: 'EN_CURSO',   label: 'En curso',   color: 'bg-blue-50 text-blue-700' },
  { value: 'COMPLETADO', label: 'Completado', color: 'bg-green-50 text-green-700' },
  { value: 'CANCELADO',  label: 'Cancelado',  color: 'bg-red-50 text-red-600' },
]

interface Props {
  trabajoId: string
  estadoActual: string
}

export function CambiarEstadoTrabajo({ trabajoId, estadoActual }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [abierto, setAbierto] = useState(false)

  const estadoInfo = ESTADOS.find(e => e.value === estadoActual) ?? ESTADOS[0]

  async function cambiar(nuevoEstado: string) {
    if (nuevoEstado === estadoActual) { setAbierto(false); return }
    setLoading(true)
    await fetch(`/api/trabajos/${trabajoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado }),
    })
    setLoading(false)
    setAbierto(false)
    router.refresh()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setAbierto(v => !v)}
        disabled={loading}
        className={`rounded-full px-3 py-1 text-xs font-semibold ${estadoInfo.color} hover:opacity-80 transition`}
      >
        {loading ? '...' : estadoInfo.label} ▾
      </button>

      {abierto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAbierto(false)} />
          <div className="absolute right-0 top-8 z-20 w-40 rounded-lg border border-gray-200 bg-white shadow-lg py-1">
            {ESTADOS.map(e => (
              <button
                key={e.value}
                onClick={() => cambiar(e.value)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition ${
                  e.value === estadoActual ? 'font-semibold' : ''
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
