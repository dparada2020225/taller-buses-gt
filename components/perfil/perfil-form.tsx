'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatearFecha } from '@/lib/utils'
import { User, Mail, Phone, Calendar, CheckCircle } from 'lucide-react'

interface Usuario {
  id: string
  nombre: string
  email: string
  telefono: string | null
  rol: string
  createdAt: Date | string
}

export function PerfilForm({ usuario }: { usuario: Usuario }) {
  const router = useRouter()
  const [nombre, setNombre]     = useState(usuario.nombre)
  const [telefono, setTelefono] = useState(usuario.telefono ?? '')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [exito, setExito]       = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setExito(false)

    const res = await fetch('/api/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, telefono }),
    })

    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Error al guardar los cambios')
      setLoading(false)
      return
    }

    setExito(true)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Tarjeta de info estática */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-900">Información de la cuenta</h2>
        <div className="space-y-2.5">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Mail className="h-4 w-4 text-gray-400 shrink-0" />
            <span>{usuario.email}</span>
            <span className="ml-auto text-xs text-gray-400">(no editable)</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <User className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="capitalize">{usuario.rol.toLowerCase()}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
            <span>Miembro desde {formatearFecha(usuario.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Formulario editable */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Editar datos</h2>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {exito && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Datos actualizados correctamente
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                required
                minLength={2}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                placeholder="Ej: 5555-1234"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#0f0f0f] py-2.5 text-sm font-semibold text-white hover:bg-[#1a1a1a] transition disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  )
}
