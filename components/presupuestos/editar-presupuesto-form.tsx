'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

interface Linea {
  id?: string
  descripcion: string
  monto: string
  subItems: string
}

interface Seccion {
  id?: string
  nombre: string
  lineas: Linea[]
  abierta: boolean
}

interface Props {
  presupuesto: {
    id: string
    notas: string | null
    trabajo: { cliente: { nombre: string }; nombreTransporte: string | null; noPlaca: string | null }
    secciones: Array<{
      id: string
      nombre: string
      lineas: Array<{ id: string; descripcion: string; monto: any; subItems: string | null }>
    }>
  }
}

export function EditarPresupuestoForm({ presupuesto }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [secciones, setSecciones] = useState<Seccion[]>(
    presupuesto.secciones.map(s => ({
      id: s.id,
      nombre: s.nombre,
      abierta: true,
      lineas: s.lineas.map(l => ({
        id: l.id,
        descripcion: l.descripcion,
        monto: l.monto ? String(Number(l.monto)) : '',
        subItems: l.subItems ?? '',
      })),
    }))
  )

  function agregarSeccion() {
    setSecciones(prev => [...prev, { nombre: '', lineas: [{ descripcion: '', monto: '', subItems: '' }], abierta: true }])
  }

  function eliminarSeccion(si: number) {
    setSecciones(prev => prev.filter((_, i) => i !== si))
  }

  function toggleSeccion(si: number) {
    setSecciones(prev => prev.map((s, i) => i === si ? { ...s, abierta: !s.abierta } : s))
  }

  function actualizarNombreSeccion(si: number, nombre: string) {
    setSecciones(prev => prev.map((s, i) => i === si ? { ...s, nombre } : s))
  }

  function agregarLinea(si: number) {
    setSecciones(prev => prev.map((s, i) =>
      i === si ? { ...s, lineas: [...s.lineas, { descripcion: '', monto: '', subItems: '' }] } : s
    ))
  }

  function eliminarLinea(si: number, li: number) {
    setSecciones(prev => prev.map((s, i) =>
      i === si ? { ...s, lineas: s.lineas.filter((_, j) => j !== li) } : s
    ))
  }

  function actualizarLinea(si: number, li: number, campo: keyof Linea, valor: string) {
    setSecciones(prev => prev.map((s, i) =>
      i === si ? { ...s, lineas: s.lineas.map((l, j) => j === li ? { ...l, [campo]: valor } : l) } : s
    ))
  }

  function totalSeccion(sec: Seccion) {
    return sec.lineas.reduce((sum, l) => sum + (parseFloat(l.monto) || 0), 0)
  }

  function totalGeneral() {
    return secciones.reduce((sum, s) => sum + totalSeccion(s), 0)
  }

  function formatQ(n: number) {
    return `Q${n.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch(`/api/presupuestos/${presupuesto.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secciones: secciones.map(s => ({
          nombre: s.nombre,
          lineas: s.lineas
            .filter(l => l.descripcion.trim())
            .map(l => ({
              descripcion: l.descripcion,
              monto: l.monto ? parseFloat(l.monto) : null,
              subItems: l.subItems || null,
            })),
        })).filter(s => s.lineas.length > 0),
      }),
    })

    if (!res.ok) {
      setError('Error al guardar los cambios')
      setLoading(false)
      return
    }

    router.push(`/presupuestos-admin/${presupuesto.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
        <p className="text-sm text-gray-500">
          Cliente: <span className="font-medium text-gray-900">{presupuesto.trabajo.cliente.nombre}</span>
          {presupuesto.trabajo.nombreTransporte && (
            <> · <span className="font-medium text-gray-900">{presupuesto.trabajo.nombreTransporte}</span></>
          )}
        </p>
      </div>

      {/* Secciones */}
      <div className="space-y-3">
        {secciones.map((sec, si) => (
          <div key={si} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
              <button type="button" onClick={() => toggleSeccion(si)} className="text-gray-400 hover:text-gray-600">
                {sec.abierta ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              <input
                type="text"
                value={sec.nombre}
                onChange={e => actualizarNombreSeccion(si, e.target.value.toUpperCase())}
                className="flex-1 bg-transparent text-sm font-bold text-gray-900 uppercase focus:outline-none"
              />
              <span className="text-sm font-semibold text-[#6DC424]">{formatQ(totalSeccion(sec))}</span>
              <button type="button" onClick={() => eliminarSeccion(si)} className="text-gray-300 hover:text-red-500 transition">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {sec.abierta && (
              <div className="p-4 space-y-2">
                {sec.lineas.map((linea, li) => (
                  <div key={li} className="space-y-1">
                    <div className="flex gap-2 items-start">
                      <span className="text-gray-400 text-sm pt-2.5 shrink-0">-</span>
                      <input
                        type="text"
                        value={linea.descripcion}
                        onChange={e => actualizarLinea(si, li, 'descripcion', e.target.value)}
                        placeholder="Descripción"
                        className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-gray-400 text-sm">Q</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={linea.monto}
                          onChange={e => actualizarLinea(si, li, 'monto', e.target.value)}
                          placeholder="0.00"
                          className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                        />
                      </div>
                      <button type="button" onClick={() => eliminarLinea(si, li)} className="text-gray-300 hover:text-red-500 transition pt-2">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={linea.subItems}
                      onChange={e => actualizarLinea(si, li, 'subItems', e.target.value)}
                      placeholder="Sub-ítems opcionales"
                      className="w-full ml-4 rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 text-xs text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#6DC424]"
                    />
                  </div>
                ))}
                <button type="button" onClick={() => agregarLinea(si)} className="flex items-center gap-1.5 text-xs text-[#6DC424] hover:text-green-700 mt-2 transition">
                  <Plus className="h-3.5 w-3.5" /> Agregar línea
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <button type="button" onClick={agregarSeccion} className="rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs text-gray-500 hover:border-[#6DC424] hover:text-[#6DC424] transition">
        + Agregar sección
      </button>

      <div className="rounded-xl border border-[#6DC424]/30 bg-[#6DC424]/5 p-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">TOTAL GENERAL</span>
        <span className="text-xl font-bold text-[#6DC424]">{formatQ(totalGeneral())}</span>
      </div>

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()} className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="rounded-lg bg-[#0f0f0f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1a1a1a] disabled:opacity-60 transition">
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
