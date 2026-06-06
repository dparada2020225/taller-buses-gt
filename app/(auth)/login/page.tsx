export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import Image from 'next/image'
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Panel izquierdo — marca */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-[#0f0f0f] p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 -left-16 w-72 h-72 rounded-full border-[50px] border-[#6DC424]/10" />
          <div className="absolute -bottom-16 -right-16 w-[28rem] h-[28rem] rounded-full border-[70px] border-[#6DC424]/10" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center space-y-8">
          <Image
            src="/images/logo.png"
            alt="Reconstructora Antigua Jr."
            width={140}
            height={140}
            priority
          />
          <div className="space-y-1">
            <p className="text-[#6DC424] text-sm font-semibold tracking-[0.25em] uppercase">
              Reconstructora
            </p>
            <h1 className="text-white text-5xl font-bold tracking-tight leading-none">
              Antigua Jr.
            </h1>
            <p className="text-[#6DC424]/60 text-xs tracking-[0.3em] uppercase mt-2">
              El trabajo bien hecho
            </p>
          </div>
          <div className="w-16 h-px bg-[#6DC424]/30" />
          <p className="text-white/30 text-sm max-w-xs leading-relaxed">
            Sistema interno de gestión de trabajos, inventario y clientes.
          </p>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center bg-white px-8 py-12">
        <div className="flex lg:hidden flex-col items-center mb-10 space-y-3">
          <div className="bg-[#0f0f0f] rounded-2xl p-4">
            <Image src="/images/logo.png" alt="Logo" width={64} height={64} />
          </div>
          <div className="text-center">
            <p className="text-xs text-[#6DC424] font-semibold tracking-widest uppercase">Reconstructora</p>
            <p className="text-2xl font-bold text-gray-900">Antigua Jr.</p>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-gray-500">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Suspense requerido porque LoginForm usa useSearchParams() */}
          <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-gray-100" />}>
            <LoginForm />
          </Suspense>

          <p className="text-center text-sm text-gray-500">
            ¿Primera vez?{' '}
            <a href="/registro" className="text-[#6DC424] hover:underline font-medium">
              Crear cuenta
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}