'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white text-center px-4">
      <h1 className="text-2xl font-bold text-gray-900">Algo salió mal</h1>
      <p className="mt-2 text-sm text-gray-400">Ocurrió un error inesperado.</p>
      <button
        onClick={reset}
        className="mt-5 rounded-lg bg-[#0f0f0f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1a1a1a] transition"
      >
        Reintentar
      </button>
    </div>
  )
}
