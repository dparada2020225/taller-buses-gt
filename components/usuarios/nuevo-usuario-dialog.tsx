'use client'

import { useState } from 'react'
import { UserPlus, X, Eye, EyeOff } from 'lucide-react'

interface UsuarioCreado {
  id: string
  nombre: string
  email: string
  telefono: string | null
  rol: 'ADMIN' | 'CLIENTE'
  emailVerified: boolean
  createdAt: string
  _count: { trabajos: number }
}

interface Props {
  onCreado: (usuario: UsuarioCreado) => void
}

export function NuevoUsuarioDialog({ onCreado }: Props) {
  const [abierto, setAbierto]           = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [rol, setRol]                   = useState<'CLIENTE' | 'ADMIN'>('CLIENTE')
  const [verPassword, setVerPassword]   = useState(false)

  function cerrar() { setAbierto(false); setError(''); setRol('CLIENTE'); setVerPassword(false) }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const data = {
      nombre:   (form.elements.namedItem('nombre')   as HTMLInputElement).value.trim(),
      email:    (form.elements.namedItem('email')    as HTMLInputElement).value.trim(),
      telefono: (form.elements.namedItem('telefono') as HTMLInputElement).value.trim(),
      password: (form.elements.namedItem('password') as HTMLInputElement).value,
      rol,
    }

    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Error al crear el usuario')
      setLoading(false)
      return
    }

    const nuevo = await res.json()
    onCreado({ ...nuevo, emailVerified: true, createdAt: new Date().toISOString(), _count: { trabajos: 0 } })
    cerrar()
  }

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="flex items-center gap-2 rounded-lg bg-[#0f0f0f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a1a1a] transition"
      >
        <UserPlus className="h-4 w-4" />
        Nuevo usuario
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={cerrar} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">Nuevo usuario</h2>
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
              {/* Selector de rol destacado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rol *</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'CLIENTE', label: 'Cliente',       desc: 'Ve sus trabajos y presupuestos',  color: 'blue' },
                    { value: 'ADMIN',   label: 'Administrador', desc: 'Acceso total al sistema',         color: 'purple' },
                  ] as const).map(op => (
                    <button
                      key={op.value}
                      type="button"
                      onClick={() => setRol(op.value)}
                      className={`rounded-xl border-2 p-3 text-left transition ${
                        rol === op.value
                          ? op.color === 'purple'
                            ? 'border-purple-400 bg-purple-50'
                            : 'border-blue-400 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className={`text-sm font-semibold mb-0.5 ${
                        rol === op.value
                          ? op.color === 'purple' ? 'text-purple-800' : 'text-blue-800'
                          : 'text-gray-800'
                      }`}>
                        {op.label}
                      </p>
                      <p className="text-xs text-gray-400">{op.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                <input name="nombre" type="text" required
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico *</label>
                <input name="email" type="email" required
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input name="telefono" type="tel"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                  placeholder="5555-1234"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña temporal *</label>
                <div className="relative">
                  <input
                    name="password"
                    type={verPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setVerPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {verPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  El usuario puede cambiarla desde su perfil después de ingresar.
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={cerrar}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 rounded-lg bg-[#0f0f0f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a1a1a] disabled:opacity-60 transition"
                >
                  {loading ? 'Creando...' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
