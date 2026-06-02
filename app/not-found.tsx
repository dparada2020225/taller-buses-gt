import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white text-center px-4">
      <div className="bg-[#0f0f0f] rounded-2xl p-5 mb-6">
        <Image src="/images/logo.png" alt="Logo" width={64} height={64} />
      </div>
      <h1 className="text-6xl font-black text-gray-900">404</h1>
      <p className="mt-2 text-lg font-semibold text-gray-600">Página no encontrada</p>
      <p className="mt-1 text-sm text-gray-400">La página que buscas no existe o fue movida.</p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-[#0f0f0f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1a1a1a] transition"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
