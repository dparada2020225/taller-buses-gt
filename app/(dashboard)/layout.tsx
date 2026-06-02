// TODO: verificar que el usuario tiene rol ADMIN
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-card">
        {/* TODO: navegación del panel admin */}
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
