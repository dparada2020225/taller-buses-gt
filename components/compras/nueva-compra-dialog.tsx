'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, X } from 'lucide-react'

interface Proveedor { id: string; nombre: string }
interface Insumo    { id: string; nombre: string; unidad: string }
interface Linea     {
  insumoId: string
  esNuevo: boolean
  nuevoNombre: string
  nuevaUnidad: string
  cantidad: string
  costoUnit: string
}

const UNIDADES = ['unidad', 'litro', 'galón', 'metro', 'libra', 'kilo', 'pliego', 'rollo', 'par', 'juego']

export function NuevaCompraDialog() {
  const router = useRouter()
  const [abierto, setAbierto]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [insumos, setInsumos]   = useState<Insumo[]>([])
  const [cargado, setCargado]   = useState(false)

  // Proveedor: existente o crear nuevo
  const [modoProveedor, setModoProveedor]       = useState<'existente' | 'nuevo'>('existente')
  const [proveedorId, setProveedorId]           = useState('')
  const [nuevoProveedor, setNuevoProveedor]     = useState('')

  const [lineas, setLineas] = useState<Linea[]>([
    { insumoId: '', esNuevo: false, nuevoNombre: '', nuevaUnidad: 'unidad', cantidad: '', costoUnit: '' },
  ])

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
          else setModoProveedor('nuevo')
        }
        if (Array.isArray(ins)) {
          setInsumos(ins)
          setLineas([{ insumoId: ins[0]?.id ?? '', esNuevo: false, nuevoNombre: '', nuevaUnidad: 'unidad', cantidad: '', costoUnit: '' }])
        }
      }).catch(() => setCargado(false))
    }
  }, [abierto, cargado])

  function cerrar() {
    setAbierto(false)
    setError('')
    setCargado(false)
    setModoProveedor('existente')
    setNuevoProveedor('')
    setLineas([{ insumoId: '', esNuevo: false, nuevoNombre: '', nuevaUnidad: 'unidad', cantidad: '', costoUnit: '' }])
  }

  function agregarLinea() {
    setLineas(prev => [
      ...prev,
      { insumoId: insumos[0]?.id ?? '', esNuevo: false, nuevoNombre: '', nuevaUnidad: 'unidad', cantidad: '', costoUnit: '' },
    ])
  }

  function eliminarLinea(idx: number) {
    setLineas(prev => prev.filter((_, i) => i !== idx))
  }

  function updateLinea(idx: number, field: keyof Linea, value: string | boolean) {
    setLineas(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }

  const total = lineas.reduce((sum, l) =>
    sum + (parseFloat(l.cantidad) || 0) * (parseFloat(l.costoUnit) || 0), 0)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form  = e.currentTarget
    const fecha = (form.elements.namedItem('fecha') as HTMLInputElement).value
    const notas = (form.elements.namedItem('notas') as HTMLInputElement).value

    try {
      // 1. Crear proveedor si es nuevo
      let pidFinal = proveedorId
      if (modoProveedor === 'nuevo') {
        if (!nuevoProveedor.trim()) {
          setError('Ingresa el nombre del proveedor')
          setLoading(false)
          return
        }
        const res = await fetch('/api/proveedores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: nuevoProveedor.trim() }),
        })
        if (!res.ok) throw new Error('Error al crear el proveedor')
        const prov = await res.json()
        pidFinal = prov.id
        setProveedores(prev => [...prev, prov])
        setProveedorId(prov.id)
        setModoProveedor('existente')
        setNuevoProveedor('')
      }

      // 2. Crear insumos nuevos en paralelo
      const lineasFinales = await Promise.all(
        lineas.map(async (l) => {
          if (l.esNuevo) {
            if (!l.nuevoNombre.trim()) throw new Error('Escribe el nombre del insumo nuevo')
            const res = await fetch('/api/insumos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                nombre: l.nuevoNombre.trim(),
                unidad: l.nuevaUnidad,
                stockActual: 0,
                stockMinimo: 0,
              }),
            })
            if (!res.ok) throw new Error(`Error al crear insumo "${l.nuevoNombre}"`)
            const ins = await res.json()
            setInsumos(prev => [...prev, ins])
            return { insumoId: ins.id, cantidad: parseFloat(l.cantidad), costoUnit: parseFloat(l.costoUnit) }
          }
          return { insumoId: l.insumoId, cantidad: parseFloat(l.cantidad), costoUnit: parseFloat(l.costoUnit) }
        })
      )

      // 3. Registrar la compra
      const res = await fetch('/api/compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proveedorId: pidFinal, fecha, notas: notas || null, lineas: lineasFinales }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Error al registrar la compra')
      }

      cerrar()
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setLoading(false)
    }
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

              {/* Proveedor */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">Proveedor *</label>
                  <button
                    type="button"
                    onClick={() => setModoProveedor(m => m === 'existente' ? 'nuevo' : 'existente')}
                    className="text-xs text-[#6DC424] hover:underline font-medium"
                  >
                    {modoProveedor === 'existente' ? '+ Proveedor nuevo' : '← Usar existente'}
                  </button>
                </div>

                {modoProveedor === 'existente' ? (
                  <select
                    value={proveedorId}
                    onChange={e => setProveedorId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                  >
                    {proveedores.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                    {proveedores.length === 0 && (
                      <option value="" disabled>Sin proveedores — usa "Proveedor nuevo"</option>
                    )}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={nuevoProveedor}
                    onChange={e => setNuevoProveedor(e.target.value)}
                    placeholder="Nombre del proveedor"
                    autoFocus
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                  />
                )}
              </div>

              {/* Fecha y notas */}
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <input
                    name="notas"
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              {/* Líneas de insumos */}
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

                <div className="space-y-3">
                  {lineas.map((linea, idx) => (
                    <div key={idx} className="rounded-lg border border-gray-200 p-3 space-y-2.5">
                      {/* Toggle existente / nuevo */}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateLinea(idx, 'esNuevo', false)}
                            className={`rounded-full px-3 py-0.5 text-xs font-medium transition ${
                              !linea.esNuevo ? 'bg-[#0f0f0f] text-white' : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            Existente
                          </button>
                          <button
                            type="button"
                            onClick={() => updateLinea(idx, 'esNuevo', true)}
                            className={`rounded-full px-3 py-0.5 text-xs font-medium transition ${
                              linea.esNuevo ? 'bg-[#0f0f0f] text-white' : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            + Nuevo insumo
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarLinea(idx)}
                          disabled={lineas.length === 1}
                          className="p-1 text-red-400 hover:text-red-600 disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Campos de la línea */}
                      <div className={`grid gap-2 ${linea.esNuevo ? 'grid-cols-[1fr_120px_90px_90px]' : 'grid-cols-[1fr_90px_90px]'}`}>
                        {linea.esNuevo ? (
                          <>
                            <input
                              type="text"
                              placeholder="Nombre del insumo"
                              value={linea.nuevoNombre}
                              onChange={e => updateLinea(idx, 'nuevoNombre', e.target.value)}
                              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                            />
                            <select
                              value={linea.nuevaUnidad}
                              onChange={e => updateLinea(idx, 'nuevaUnidad', e.target.value)}
                              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                            >
                              {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </>
                        ) : (
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
                        )}

                        <input
                          type="number" step="0.001" min="0.001"
                          placeholder="Cant."
                          value={linea.cantidad}
                          onChange={e => updateLinea(idx, 'cantidad', e.target.value)}
                          required
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                        />
                        <input
                          type="number" step="0.01" min="0"
                          placeholder="Q unit."
                          value={linea.costoUnit}
                          onChange={e => updateLinea(idx, 'costoUnit', e.target.value)}
                          required
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                        />
                      </div>

                      {linea.cantidad && linea.costoUnit && (
                        <p className="text-xs text-gray-400 text-right">
                          Subtotal: Q {((parseFloat(linea.cantidad) || 0) * (parseFloat(linea.costoUnit) || 0)).toFixed(2)}
                        </p>
                      )}
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
