'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

interface Cliente {
  id: string
  nombre: string
  telefono: string | null
}

interface TrabajoExistente {
  id: string
  clienteId: string
  descripcion: string
  nombreTransporte: string | null
  noPlaca: string | null
}

interface Linea {
  descripcion: string
  monto: string
  subItems: string
}

interface Seccion {
  nombre: string
  lineas: Linea[]
  abierta: boolean
}

const SECCIONES_PREDEFINIDAS = [
  'ADENTRO', 'AFUERA', 'ACCESORIOS', 'TROMPA',
  'TREN DELANTERO', 'AUDIO', 'MECÁNICA',
]

interface Props {
  clientes: Cliente[]
  clienteIdInicial?: string
  trabajoExistente?: TrabajoExistente | null
}

export function NuevoPresupuestoForm({ clientes, clienteIdInicial = '', trabajoExistente = null }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Si hay un trabajo existente es un presupuesto EXTRA — no creamos trabajo nuevo
  const esExtra = !!trabajoExistente

  // Datos del trabajo (solo se usan si NO es extra)
  const [clienteId, setClienteId] = useState(clienteIdInicial)
  const [descripcion, setDescripcion] = useState('')
  const [nombreTransporte, setNombreTransporte] = useState('')
  const [noPlaca, setNoPlaca] = useState('')

  // Secciones
  const [secciones, setSecciones] = useState<Seccion[]>([
    { nombre: 'ADENTRO', lineas: [{ descripcion: '', monto: '', subItems: '' }], abierta: true },
  ])

  function agregarSeccion(nombre = '') {
    setSecciones(prev => [
      ...prev,
      { nombre, lineas: [{ descripcion: '', monto: '', subItems: '' }], abierta: true },
    ])
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
      i === si
        ? { ...s, lineas: s.lineas.map((l, j) => j === li ? { ...l, [campo]: valor } : l) }
        : s
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

  const seccionesPayload = secciones
    .map(s => ({
      nombre: s.nombre,
      lineas: s.lineas
        .filter(l => l.descripcion.trim())
        .map(l => ({
          descripcion: l.descripcion,
          monto: l.monto ? parseFloat(l.monto) : null,
          subItems: l.subItems || null,
        })),
    }))
    .filter(s => s.lineas.length > 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!esExtra && !clienteId) { setError('Selecciona un cliente'); return }
    if (!esExtra && !descripcion) { setError('Escribe una descripción del trabajo'); return }
    if (seccionesPayload.length === 0) { setError('Agrega al menos una sección con contenido'); return }

    setLoading(true)
    setError('')

    let trabajoId: string

    if (esExtra) {
      // Usar el trabajo existente directamente
      trabajoId = trabajoExistente!.id
    } else {
      // 1. Crear trabajo nuevo
      const trabajoRes = await fetch('/api/trabajos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId, descripcion, nombreTransporte, noPlaca }),
      })
      if (!trabajoRes.ok) {
        setError('Error al crear el trabajo')
        setLoading(false)
        return
      }
      const trabajo = await trabajoRes.json()
      trabajoId = trabajo.id
    }

    // 2. Crear presupuesto (INICIAL o EXTRA según contexto)
    const presRes = await fetch('/api/presupuestos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trabajoId,
        tipo: esExtra ? 'EXTRA' : 'INICIAL',
        secciones: seccionesPayload,
      }),
    })

    if (!presRes.ok) {
      const body = await presRes.json()
      setError(body.error ?? 'Error al crear el presupuesto')
      setLoading(false)
      return
    }

    const presupuesto = await presRes.json()
    router.push(`/presupuestos-admin/${presupuesto.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Datos del trabajo — solo si es presupuesto INICIAL */}
      {esExtra ? (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-3">
          <p className="text-sm font-medium text-blue-800">
            Presupuesto extra para: <span className="font-bold">{trabajoExistente!.nombreTransporte ?? trabajoExistente!.descripcion}</span>
          </p>
          <p className="text-xs text-blue-600 mt-0.5">{trabajoExistente!.descripcion}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Datos del trabajo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <select
                value={clienteId}
                onChange={e => setClienteId(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424] focus:border-transparent"
              >
                <option value="">Seleccionar cliente...</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.telefono ? `· ${c.telefono}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del trabajo</label>
              <input
                type="text"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                required
                placeholder="Ej: Reconstrucción completa exterior e interior"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del transporte</label>
              <input
                type="text"
                value={nombreTransporte}
                onChange={e => setNombreTransporte(e.target.value)}
                placeholder="Ej: Princesa Fernanda"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No. Placa</label>
              <input
                type="text"
                value={noPlaca}
                onChange={e => setNoPlaca(e.target.value)}
                placeholder="Ej: P-123ABC"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424] focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Secciones */}
      <div className="space-y-3">
        {secciones.map((sec, si) => (
          <div key={si} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Header sección */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
              <button type="button" onClick={() => toggleSeccion(si)} className="text-gray-400 hover:text-gray-600">
                {sec.abierta ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              <input
                type="text"
                value={sec.nombre}
                onChange={e => actualizarNombreSeccion(si, e.target.value.toUpperCase())}
                className="flex-1 bg-transparent text-sm font-bold text-gray-900 uppercase focus:outline-none"
                placeholder="NOMBRE DE SECCIÓN"
              />
              <span className="text-sm font-semibold text-[#6DC424]">
                {formatQ(totalSeccion(sec))}
              </span>
              <button
                type="button"
                onClick={() => eliminarSeccion(si)}
                className="text-gray-300 hover:text-red-500 transition"
              >
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
                        placeholder="Descripción del ítem"
                        className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424] focus:border-transparent"
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
                          className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#6DC424] focus:border-transparent"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => eliminarLinea(si, li)}
                        className="text-gray-300 hover:text-red-500 transition pt-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {/* Sub-ítems */}
                    <input
                      type="text"
                      value={linea.subItems}
                      onChange={e => actualizarLinea(si, li, 'subItems', e.target.value)}
                      placeholder="Sub-ítems opcionales (ej: * Franja * Aletas * Faldas)"
                      className="w-full ml-4 rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 text-xs text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#6DC424]"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => agregarLinea(si)}
                  className="flex items-center gap-1.5 text-xs text-[#6DC424] hover:text-green-700 mt-2 transition"
                >
                  <Plus className="h-3.5 w-3.5" /> Agregar línea
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Botones agregar sección */}
      <div className="flex flex-wrap gap-2">
        {SECCIONES_PREDEFINIDAS.filter(n => !secciones.find(s => s.nombre === n)).map(n => (
          <button
            key={n}
            type="button"
            onClick={() => agregarSeccion(n)}
            className="rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs text-gray-500 hover:border-[#6DC424] hover:text-[#6DC424] transition"
          >
            + {n}
          </button>
        ))}
        <button
          type="button"
          onClick={() => agregarSeccion('')}
          className="rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs text-gray-500 hover:border-[#6DC424] hover:text-[#6DC424] transition"
        >
          + Sección personalizada
        </button>
      </div>

      {/* Total general */}
      <div className="rounded-xl border border-[#6DC424]/30 bg-[#6DC424]/5 p-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">TOTAL GENERAL</span>
        <span className="text-xl font-bold text-[#6DC424]">{formatQ(totalGeneral())}</span>
      </div>

      {/* Acciones */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[#0f0f0f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1a1a1a] disabled:opacity-60 transition"
        >
          {loading ? 'Guardando...' : esExtra ? 'Crear presupuesto extra' : 'Crear presupuesto'}
        </button>
      </div>
    </form>
  )
}
