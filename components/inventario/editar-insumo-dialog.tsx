'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, X } from 'lucide-react'
import { ImageUpload } from '@/components/ui/image-upload'

interface Insumo {
  id: string
  nombre: string
  descripcion: string | null
  unidad: string
  stockActual: number
  stockMinimo: number
  esPublico: boolean
  precioVenta: number | null
  imagenUrl: string | null
}

export function EditarInsumoDialog({ insumo }: { insumo: Insumo }) {
  const router = useRouter()
  const [abierto, setAbierto]     = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [esPublico, setEsPublico] = useState(insumo.esPublico)
  const [imagenUrl, setImagenUrl] = useState(insumo.imagenUrl ?? '')

  function cerrar() { setAbierto(false); setError('') }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const data = {
      nombre:      (form.elements.namedItem('nombre')      as HTMLInputElement).value,
      descripcion: (form.elements.namedItem('descripcion') as HTMLInputElement).value || null,
      unidad:      (form.elements.namedItem('unidad')      as HTMLInputElement).value,
      stockMinimo: Number((form.elements.namedItem('stockMinimo') as HTMLInputElement).value),
      esPublico,
      precioVenta: esPublico
        ? Number((form.elements.namedItem('precioVenta') as HTMLInputElement).value)
        : null,
      imagenUrl: imagenUrl || null,
    }

    const res = await fetch(`/api/insumos/${insumo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Error al actualizar')
      setLoading(false)
      return
    }

    cerrar()
    router.refresh()
  }

  async function eliminar() {
    if (!confirm('¿Eliminar este insumo? Solo es posible si no tiene movimientos registrados.')) return
    const res = await fetch(`/api/insumos/${insumo.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const body = await res.json()
      alert(body.error ?? 'No se pudo eliminar')
      return
    }
    cerrar()
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
        title="Editar insumo"
      >
        <Pencil className="h-4 w-4" />
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={cerrar} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">Editar insumo</h2>
              <button onClick={cerrar} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input name="nombre" required defaultValue={insumo.nombre}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input name="descripcion" defaultValue={insumo.descripcion ?? ''}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de medida *</label>
                <input name="unidad" required defaultValue={insumo.unidad}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo (alerta)</label>
                <input name="stockMinimo" type="number" step="0.001" min="0"
                  defaultValue={Number(insumo.stockMinimo)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={esPublico}
                  onChange={e => setEsPublico(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">Visible en catálogo público</span>
              </label>

              {esPublico && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio de venta (Q) *</label>
                    <input name="precioVenta" type="number" step="0.01" min="0"
                      required={esPublico} defaultValue={insumo.precioVenta ?? ''}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Imagen del producto
                      <span className="ml-1.5 font-normal text-gray-400 text-xs">aparece en el catálogo público</span>
                    </label>
                    <ImageUpload value={imagenUrl} onChange={setImagenUrl} disabled={loading} />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={loading}
                  className="flex-1 rounded-lg bg-[#0f0f0f] py-2.5 text-sm font-semibold text-white hover:bg-[#1a1a1a] transition disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button type="button" onClick={eliminar}
                  className="rounded-lg border border-red-200 px-4 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
                >
                  Eliminar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
