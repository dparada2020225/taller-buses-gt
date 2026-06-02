'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { FileText, History, LogOut, LayoutDashboard } from 'lucide-react'
import { signOut } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/inicio', label: 'Inicio', icon: LayoutDashboard },
  { href: '/mis-presupuestos', label: 'Mis presupuestos', icon: FileText },
  { href: '/historial', label: 'Historial', icon: History },
]

export function SidebarCliente() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    await signOut({ fetchOptions: { onSuccess: () => router.push('/login') } })
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0f0f0f] shrink-0">
          <Image src="/images/logo.png" alt="Logo" width={28} height={28} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-[#6DC424] tracking-widest uppercase leading-none">Reconstructora</p>
          <p className="text-sm font-bold text-gray-900 leading-tight truncate">Antigua Jr.</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/inicio' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-[#0f0f0f] text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-[#6DC424]' : '')} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
