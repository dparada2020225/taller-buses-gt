import { prisma } from '@/lib/prisma'
import { formatearFecha } from '@/lib/utils'
import { Users } from 'lucide-react'

// Server Component — fetch directo a BD, sin round-trip extra al cliente
export async function ClientesTabla() {
  const clientes = await prisma.user.findMany({
    where: { rol: 'CLIENTE' },
    select: {
      id: true,
      nombre: true,
      email: true,
      telefono: true,
      createdAt: true,
      _count: { select: { trabajos: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (clientes.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col items-center justify-center py-16 text-center">
        <Users className="h-10 w-10 text-gray-200 mb-3" />
        <p className="text-sm text-gray-400">No hay clientes registrados aún</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Correo</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Teléfono</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trabajos</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Registro</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {clientes.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-900">{c.nombre}</td>
              <td className="px-4 py-3 text-gray-500">{c.email}</td>
              <td className="px-4 py-3 text-gray-500">{c.telefono ?? '—'}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                  {c._count.trabajos}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-400">{formatearFecha(c.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
