'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/auth-client'

export function RegistroForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const nombre = (form.elements.namedItem('nombre') as HTMLInputElement).value
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    const confirmar = (form.elements.namedItem('confirmar') as HTMLInputElement).value

    if (password !== confirmar) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    // Crear cuenta
    const res = await fetch('/api/auth/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Error al crear la cuenta')
      setLoading(false)
      return
    }

    // Iniciar sesión automáticamente
    const { error: loginError } = await signIn.email({
      email,
      password,
      callbackURL: data.rol === 'ADMIN' ? '/dashboard' : '/inicio',
    })

    if (loginError) {
      setError('Cuenta creada, pero hubo un error al ingresar. Intenta desde login.')
      setLoading(false)
      return
    }

    router.push(data.rol === 'ADMIN' ? '/dashboard' : '/inicio')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
          Nombre completo
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          required
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6DC424] focus:border-transparent transition"
          placeholder="Tu nombre"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6DC424] focus:border-transparent transition"
          placeholder="correo@ejemplo.com"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6DC424] focus:border-transparent transition"
          placeholder="Mínimo 8 caracteres"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirmar" className="block text-sm font-medium text-gray-700">
          Confirmar contraseña
        </label>
        <input
          id="confirmar"
          name="confirmar"
          type="password"
          required
          minLength={8}
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6DC424] focus:border-transparent transition"
          placeholder="Repite la contraseña"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[#0f0f0f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#6DC424] focus:ring-offset-2 disabled:opacity-60 transition"
      >
        {loading ? 'Creando cuenta...' : 'Crear cuenta'}
      </button>
    </form>
  )
}
