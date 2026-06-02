'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, X } from 'lucide-react'

interface Proveedor {
  id: string
  nombre: string
}

interface Insumo {
  id: string
  nombre: string
  unidad: string
}

interface Linea {
  insumoId: string
  cantidad: string
  costoUnit: string
}

export function NuevaCompraDialog() {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [proveedorId, setProveedorId] = useState('')
  const [lineas, setLineas] = useState<Linea[]>([{ insumoId: '', cantidad: '', costoUnit: '' }])
  const [cargado, setCargado] = useState(false)

  useEffect(() => {
    if (abierto && !cargado) {
      setCargado(true)
      Promise.all([
        fetch('/api/proveedores').then(r => r.json()),
        fetch('/api/insumos').then(r => r.json()),
      ]).then(([provs, ins]) => {
        if (Array.isArray(provs)) {
          setProveedores(provs)
          if (provs.length > 0) setProveedorId(provs[0].id)
        }
        if (Array.isArray(ins)) {
          setInsumos(ins)
          if (ins.length > 0) setLineas([{ insumoId: ins[0].id, cantidad: '', costoUnit: '' }])
        }
      }).catch(() => setCargado(false))
    }
  }, [abierto, cargado])

  function agregarLinea() {
    setLineas(prev => [...prev, { insumoId: insumos[0]?.id ?? '', cantidad: '', costoUnit: '' }])
  }

  function eliminarLinea(idx: number) {
    setLineas(prev => prev.filter((_, i) => i !== idx))
  }

  function updateLinea(idx: number, field: keyof Linea, value: string) {
    setLineas(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }

  function cerrar() { setAbierto(false); setError(''); setCargado(false) }

  const total = lineas.reduce((sum, l) => {
    const cant = parseFloat(l.cantidad) || 0
    const costo = parseFloat(l.costoUnit) || 0
    return sum + cant * costo
  }, 0)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const fecha = (form.elements.namedItem('fecha') as HTMLInputElement).value
    const notas = (form.elements.namedItem('notas') as HTMLInputElement).value

    const res = await fetch('/api/compras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proveedorId,
        fecha,
        notas: notas || null,
        lineas: lineas.map(l => ({
          insumoId: l.insumoId,
          cantidad: parseFloat(l.cantidad),
          costoUnit: parseFloat(l.costoUnit),
        })),
      }),
    })

    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Error al registrar la compra')
      setLoading(false)
      return
    }

    cerrar()
    router.refresh()
  }

  const hoy = new Date().toISOString().split('T')[0]

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="flex items-center gap-2 rounded-lg bg-[#0f0f0f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a1a1a] transition"
      >
        <Plus className="h-4 w-4" /> Registrar compra
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={cerrar} />
          <div className="relative z-10 w-full max-w-2xl rounded-xl bg-white shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">Registrar compra</h2>
              <button onClick={cerrar} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor *</label>
                  <select
                    value={proveedorId}
                    onChange={e => setProveedorId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                  >
                    {proveedores.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                  <input
                    name="fecha"
                    type="date"
                    defaultValue={hoy}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <input
                  name="notas"
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                  placeholder="Opcional"
                />
              </div>

              {/* Líneas */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Insumos comprados *</label>
                  <button
                    type="button"
                    onClick={agregarLinea}
                    className="flex items-center gap-1 text-xs text-[#6DC424] hover:underline font-medium"
                  >
                    <Plus className="h-3.5 w-3.5" /> Agregar línea
                  </button>
                </div>

                <div className="space-y-2">
                  {lineas.map((linea, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_100px_100px_32px] gap-2 items-center">
                      <select
                        value={linea.insumoId}
                        onChange={e => updateLinea(idx, 'insumoId', e.target.value)}
                        required
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                      >
                        {insumos.map(i => (
                          <option key={i.id} value={i.id}>{i.nombre} ({i.unidad})</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        placeholder="Cant."
                        value={linea.cantidad}
                        onChange={e => updateLinea(idx, 'cantidad', e.target.value)}
                        required
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Q unit."
                        value={linea.costoUnit}
                        onChange={e => updateLinea(idx, 'costoUnit', e.target.value)}
                        required
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                      />
                      <button
                        type="button"
                        onClick={() => eliminarLinea(idx)}
                        disabled={lineas.length === 1}
                        className="p-1 rounded text-red-400 hover:text-red-600 disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-sm font-semibold text-gray-900">
                  Total: Q {total.toFixed(2)}
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-[#0f0f0f] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1a1a1a] transition disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Registrar compra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
