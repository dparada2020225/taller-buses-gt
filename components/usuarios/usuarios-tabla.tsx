'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatearFecha } from '@/lib/utils'
import { Fragment } from 'react'
import { Users, Pencil, X, CheckCircle, ShieldAlert, Shield } from 'lucide-react'
import { NuevoUsuarioDialog } from '@/components/usuarios/nuevo-usuario-dialog'

interface Usuario {
  id: string
  nombre: string
  email: string
  telefono: string | null
  rol: 'ADMIN' | 'CLIENTE'
  emailVerified: boolean
  createdAt: Date | string
  _count: { trabajos: number }
}

interface Props {
  usuarios: Usuario[]
  sesionId: string   // para proteger al propio admin de demotarse
}

export function UsuariosTabla({ usuarios: inicial, sesionId }: Props) {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState(inicial)
  const [editando, setEditando]   = useState<string | null>(null)
  const [loading, setLoading]     = useState<string | null>(null)
  const [error, setError]         = useState<Record<string, string>>({})

  // Estado del formulario de edición
  const [form, setForm] = useState({ nombre: '', telefono: '', rol: '' as 'ADMIN' | 'CLIENTE' })

  function abrirEditar(u: Usuario) {
    setEditando(u.id)
    setForm({ nombre: u.nombre, telefono: u.telefono ?? '', rol: u.rol })
    setError(prev => ({ ...prev, [u.id]: '' }))
  }

  function cerrarEditar() { setEditando(null) }

  async function guardar(id: string) {
    setLoading(id)
    setError(prev => ({ ...prev, [id]: '' }))

    const res = await fetch(`/api/usuarios/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre:   form.nombre,
        telefono: form.telefono,
        rol:      form.rol,
      }),
    })

    if (!res.ok) {
      const body = await res.json()
      setError(prev => ({ ...prev, [id]: body.error ?? 'Error al guardar' }))
      setLoading(null)
      return
    }

    const actualizado = await res.json()
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, ...actualizado } : u))
    setEditando(null)
    setLoading(null)
    router.refresh()
  }

  const admins   = usuarios.filter(u => u.rol === 'ADMIN')
  const clientes = usuarios.filter(u => u.rol === 'CLIENTE')

  return (
    <div className="p-6 space-y-6">

      {/* Header con botón */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} registrado{usuarios.length !== 1 ? 's' : ''}
        </p>
        <NuevoUsuarioDialog
          onCreado={nuevo => setUsuarios(prev => [nuevo, ...prev])}
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex items-center gap-3">
          <div className="rounded-lg bg-gray-100 p-2.5">
            <Users className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total usuarios</p>
            <p className="text-2xl font-bold text-gray-900">{usuarios.length}</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex items-center gap-3">
          <div className="rounded-lg bg-purple-50 p-2.5">
            <ShieldAlert className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Administradores</p>
            <p className="text-2xl font-bold text-purple-700">{admins.length}</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-2.5">
            <Shield className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Clientes</p>
            <p className="text-2xl font-bold text-blue-700">{clientes.length}</p>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {usuarios.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Users className="h-10 w-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">Sin usuarios registrados</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Teléfono</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trabajos</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Registro</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.map(u => (
                <Fragment key={u.id}>
                  {/* Fila normal */}
                  <tr className={`hover:bg-gray-50 transition-colors ${editando === u.id ? 'bg-[#6DC424]/5' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          u.rol === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {u.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{u.nombre}</p>
                          <p className="text-xs text-gray-400 truncate">{u.email}</p>
                        </div>
                        {!u.emailVerified && (
                          <span className="text-xs text-orange-500 shrink-0">sin verificar</span>
                        )}
                        {u.id === sesionId && (
                          <span className="text-xs text-[#6DC424] font-medium shrink-0">tú</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.telefono ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        u.rol === 'ADMIN'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {u.rol}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u._count.trabajos}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatearFecha(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {editando === u.id ? (
                        <button
                          onClick={cerrarEditar}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => abrirEditar(u)}
                          className="flex items-center gap-1.5 text-xs text-[#6DC424] hover:underline font-medium ml-auto"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Editar
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Fila de edición inline */}
                  {editando === u.id && (
                    <tr className="bg-[#6DC424]/5 border-b border-[#6DC424]/20">
                      <td colSpan={6} className="px-4 py-4">
                        {error[u.id] && (
                          <div className="mb-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                            {error[u.id]}
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                            <input
                              type="text"
                              value={form.nombre}
                              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
                            <input
                              type="tel"
                              value={form.telefono}
                              onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                              placeholder="5555-1234"
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Rol
                              {u.id === sesionId && (
                                <span className="ml-1.5 text-orange-500 font-normal">(no puedes demotarte)</span>
                              )}
                            </label>
                            <select
                              value={form.rol}
                              onChange={e => setForm(f => ({ ...f, rol: e.target.value as 'ADMIN' | 'CLIENTE' }))}
                              disabled={u.id === sesionId}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424] disabled:bg-gray-50 disabled:text-gray-400"
                            >
                              <option value="ADMIN">ADMIN</option>
                              <option value="CLIENTE">CLIENTE</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end mt-3">
                          <button
                            onClick={() => guardar(u.id)}
                            disabled={loading === u.id}
                            className="flex items-center gap-1.5 rounded-lg bg-[#0f0f0f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a1a1a] transition disabled:opacity-50"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            {loading === u.id ? 'Guardando...' : 'Guardar cambios'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
