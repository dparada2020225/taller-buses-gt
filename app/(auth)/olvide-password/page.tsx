export const dynamic = 'force-dynamic'

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'

export default function OlvidePasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: err } = await authClient.forgetPassword({
      email,
      redirectTo: `${window.location.origin}/restablecer`,
    })

    if (err) {
      setError('No se pudo enviar el correo. Verifica el email ingresado.')
    } else {
      setEnviado(true)
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-[#0f0f0f] p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 -left-16 w-72 h-72 rounded-full border-[50px] border-[#6DC424]/10" />
          <div className="absolute -bottom-16 -right-16 w-[28rem] h-[28rem] rounded-full border-[70px] border-[#6DC424]/10" />
        </div>
        <div className="relative z-10 flex flex-col items-center text-center space-y-8">
          <Image src="/images/logo.png" alt="Logo" width={140} height={140} priority />
          <div className="space-y-1">
            <p className="text-[#6DC424] text-sm font-semibold tracking-[0.25em] uppercase">Reconstructora</p>
            <h1 className="text-white text-5xl font-bold tracking-tight leading-none">Antigua Jr.</h1>
          </div>
        </div>
      </div>

      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-sm space-y-6">
          {enviado ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Revisa tu correo</h2>
              <p className="text-sm text-gray-500">
                Si el correo <strong>{email}</strong> está registrado, recibirás un enlace para restablecer tu contraseña.
              </p>
              <Link href="/login" className="text-sm text-[#6DC424] hover:underline">
                Volver al login
              </Link>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">¿Olvidaste tu contraseña?</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Ingresa tu correo y te enviaremos un enlace para restablecerla.
                </p>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="correo@ejemplo.com"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424] focus:border-transparent transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-[#0f0f0f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a1a1a] disabled:opacity-60 transition"
                >
                  {loading ? 'Enviando...' : 'Enviar enlace'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500">
                <Link href="/login" className="text-[#6DC424] hover:underline">
                  Volver al login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
