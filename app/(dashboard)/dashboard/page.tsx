import { Topbar } from '@/components/dashboard/topbar'
import { Users, Wrench, Package, CreditCard } from 'lucide-react'

const TARJETAS = [
  { label: 'Clientes registrados', valor: '—', icon: Users, color: 'text-blue-500' },
  { label: 'Trabajos en curso', valor: '—', icon: Wrench, color: 'text-[#6DC424]' },
  { label: 'Insumos con stock bajo', valor: '—', icon: Package, color: 'text-orange-500' },
  { label: 'Pagos este mes', valor: '—', icon: CreditCard, color: 'text-purple-500' },
]

export default function DashboardPage() {
  return (
    <>
      <Topbar titulo="Panel de administración" />
      <div className="p-6 space-y-6">
        {/* Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {TARJETAS.map(({ label, valor, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-xl border border-gray-200 bg-white p-5 flex items-center gap-4 shadow-sm"
            >
              <div className={`rounded-lg bg-gray-50 p-3 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{valor}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Placeholder trabajos recientes */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Trabajos recientes</h2>
          </div>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Wrench className="h-10 w-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">No hay trabajos registrados aún</p>
          </div>
        </div>
      </div>
    </>
  )
}
