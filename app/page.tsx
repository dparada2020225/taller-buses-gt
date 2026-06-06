import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getSession } from '@/lib/session'
import { Wrench, ShieldCheck, Truck, ArrowRight, Star } from 'lucide-react'

const SERVICIOS = [
  {
    icon: Wrench,
    titulo: 'Reconversión completa',
    descripcion:
      'Transformamos buses escolares estadounidenses en transporte extraurbano de alta calidad, adaptado al contexto guatemalteco.',
  },
  {
    icon: ShieldCheck,
    titulo: 'Garantía de trabajo',
    descripcion:
      'Cada trabajo cuenta con presupuesto detallado por secciones, control de insumos y registro de pagos en tiempo real.',
  },
  {
    icon: Truck,
    titulo: 'Seguimiento en línea',
    descripcion:
      'Los clientes pueden ver el estado de su trabajo, aprobar presupuestos y consultar su historial de pagos desde cualquier dispositivo.',
  },
]

const STATS = [
  { valor: '100+', etiqueta: 'Buses reconvertidos' },
  { valor: '15+',  etiqueta: 'Años de experiencia' },
  { valor: '98%',  etiqueta: 'Clientes satisfechos' },
]

export default async function HomePage() {
  // Si ya hay sesión activa, redirigir al panel correspondiente
  const session = await getSession()
  if (session) {
    if (session.user.rol === 'ADMIN') redirect('/dashboard')
    else redirect('/inicio')
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Navbar */}
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/80 backdrop-blur">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/images/logo.png" alt="Taller Buses GT" width={32} height={32} className="rounded" />
            <span className="font-bold text-gray-900 text-sm">Taller Buses GT</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <Link href="/catalogo" className="hover:text-gray-900 transition">Catálogo</Link>
            <Link href="/login"    className="hover:text-gray-900 transition">Mi cuenta</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/catalogo"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              Ver catálogo
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-[#0f0f0f] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#1a1a1a] transition"
            >
              Ingresar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 py-20 flex flex-col items-center text-center gap-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#6DC424]/30 bg-[#6DC424]/10 px-4 py-1.5 text-xs font-medium text-[#4a8a15]">
          <Star className="h-3.5 w-3.5" />
          Especialistas en reconversión de buses escolares
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight max-w-2xl">
          Tu bus escolar, transformado en transporte extraurbano
        </h1>
        <p className="text-base text-gray-500 max-w-xl leading-relaxed">
          Reconvertimos buses escolares estadounidenses con altos estándares de calidad.
          Presupuesto transparente, seguimiento en línea y entrega garantizada.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/registro"
            className="flex items-center gap-2 rounded-xl bg-[#6DC424] px-6 py-3 text-sm font-semibold text-white hover:bg-[#5daa1e] transition shadow-sm shadow-[#6DC424]/30"
          >
            Empezar ahora <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/catalogo"
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Ver catálogo de accesorios
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-8 flex flex-wrap gap-10 justify-center">
          {STATS.map(s => (
            <div key={s.etiqueta} className="text-center">
              <p className="text-3xl font-extrabold text-gray-900">{s.valor}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.etiqueta}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Servicios */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            ¿Por qué trabajar con nosotros?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SERVICIOS.map(s => (
              <div key={s.titulo} className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm">
                <div className="rounded-xl bg-[#6DC424]/10 p-3 w-fit mb-4">
                  <s.icon className="h-6 w-6 text-[#6DC424]" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{s.titulo}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flujo de trabajo */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Así funciona el proceso</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          {[
            { num: '1', titulo: 'Contacto',     desc: 'Nos contactas y el admin registra tu solicitud en el sistema.' },
            { num: '2', titulo: 'Presupuesto',  desc: 'Recibes un presupuesto detallado por secciones. Lo apruebas en línea.' },
            { num: '3', titulo: 'En curso',     desc: 'Seguimiento en tiempo real. Puedes ver pagos realizados y saldo pendiente.' },
            { num: '4', titulo: 'Entrega',      desc: 'El trabajo queda en tu historial con toda la documentación.' },
          ].map((paso, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-[#0f0f0f] text-white flex items-center justify-center text-base font-bold mb-4">
                {paso.num}
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{paso.titulo}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{paso.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0f0f0f] py-16">
        <div className="container mx-auto px-6 text-center space-y-5">
          <h2 className="text-2xl font-bold text-white">¿Listo para empezar?</h2>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            Crea tu cuenta hoy y recibe tu primer presupuesto sin costo.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/registro"
              className="rounded-xl bg-[#6DC424] px-6 py-3 text-sm font-semibold text-white hover:bg-[#5daa1e] transition"
            >
              Crear cuenta gratis
            </Link>
            <Link
              href="/catalogo"
              className="rounded-xl border border-gray-700 px-6 py-3 text-sm font-semibold text-gray-300 hover:bg-gray-800 transition"
            >
              Ver catálogo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <span>© {new Date().getFullYear()} Taller Buses GT. Todos los derechos reservados.</span>
          <div className="flex items-center gap-4">
            <Link href="/catalogo"  className="hover:text-gray-600">Catálogo</Link>
            <Link href="/login"     className="hover:text-gray-600">Ingresar</Link>
            <Link href="/registro"  className="hover:text-gray-600">Registrarse</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
