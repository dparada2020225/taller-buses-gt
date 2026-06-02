import { SidebarCliente } from '@/components/cliente/sidebar-cliente'

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <SidebarCliente />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
