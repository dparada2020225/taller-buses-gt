import { getSession } from '@/lib/session'

export async function Topbar({ titulo }: { titulo?: string }) {
  const session = await getSession()
  const nombre = session?.user?.name ?? 'Admin'

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
      {titulo && (
        <h1 className="text-base font-semibold text-gray-900">{titulo}</h1>
      )}
      <div className="ml-auto flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900 leading-none">{nombre}</p>
          <p className="text-xs text-gray-400 mt-0.5">{session?.user?.email}</p>
        </div>
        <div className="h-8 w-8 rounded-full bg-[#0f0f0f] flex items-center justify-center text-[#6DC424] text-sm font-bold">
          {nombre.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
