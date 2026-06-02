'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Printer, Pencil, Trash2, Clock } from 'lucide-react'

interface Linea {
  id: string
  descripcion: string
  monto: string | number | null
  subItems: string | null
}

interface Seccion {
  id: string
  nombre: string
  lineas: Linea[]
}

interface Auditoria {
  id: string
  accion: string
  detalle: any
  createdAt: string | Date
  usuario?: { nombre: string } | null
}

interface Presupuesto {
  id: string
  folio: number
  montoTotal: string | number
  creadoEn: string | Date
  notas: string | null
  trabajo: {
    nombreTransporte: string | null
    noPlaca: string | null
    cliente: { nombre: string; telefono: string | null }
  }
  secciones: Seccion[]
  auditoria?: Auditoria[]
}

function formatQ(n: number | string | null | undefined) {
  if (n === null || n === undefined) return '?'
  const num = Number(n)
  return `Q${num.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function totalSeccion(lineas: Linea[]) {
  return lineas.reduce((sum, l) => sum + (l.monto ? Number(l.monto) : 0), 0)
}

function formatFecha(fecha: string | Date) {
  return new Intl.DateTimeFormat('es-GT', {
    timeZone: 'America/Guatemala',
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(fecha))
}

function formatFechaHora(fecha: string | Date) {
  return new Intl.DateTimeFormat('es-GT', {
    timeZone: 'America/Guatemala',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(fecha))
}

const ACCION_LABEL: Record<string, string> = {
  EDITAR_PRESUPUESTO: 'Editó el presupuesto',
  ELIMINAR_PRESUPUESTO: 'Eliminó el presupuesto',
}

const totalRowStyle: React.CSSProperties = {
  backgroundColor: '#6DC424',
  color: 'white',
  display: 'flex',
  justifyContent: 'space-between',
  padding: '4px 8px',
  fontWeight: 'bold',
  fontSize: '12px',
  printColorAdjust: 'exact',
  WebkitPrintColorAdjust: 'exact',
} as React.CSSProperties

export function VistaPresupuesto({ presupuesto, auditoria = [] }: { presupuesto: Presupuesto; auditoria?: Auditoria[] }) {
  const router = useRouter()
  const [eliminando, setEliminando] = useState(false)
  const [confirmar, setConfirmar] = useState(false)
  const { trabajo, secciones } = presupuesto

  async function handleEliminar() {
    setEliminando(true)
    const res = await fetch(`/api/presupuestos/${presupuesto.id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/presupuestos-admin')
      router.refresh()
    } else {
      setEliminando(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Botones de acción */}
      <div className="flex gap-2 justify-end no-print">
        <Link
          href={`/presupuestos-admin/${presupuesto.id}/editar`}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          <Pencil className="h-4 w-4" />
          Editar
        </Link>

        {!confirmar ? (
          <button
            onClick={() => setConfirmar(true)}
            className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">¿Confirmar?</span>
            <button
              onClick={handleEliminar}
              disabled={eliminando}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition"
            >
              {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
            <button
              onClick={() => setConfirmar(false)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
          </div>
        )}

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg bg-[#0f0f0f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a1a1a] transition"
        >
          <Printer className="h-4 w-4" />
          Descargar PDF
        </button>
      </div>

      {/* Documento */}
      <div
        id="presupuesto-doc"
        className="bg-white mx-auto"
        style={{ maxWidth: '800px', fontFamily: 'Arial, sans-serif', fontSize: '12px' }}
      >
        {/* Encabezado */}
        <div className="px-10 pt-8 pb-4">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <Image src="/images/logo fondo blanco.jpeg" alt="Reconstructora Antigua Jr." width={380} height={100} priority />
          </div>

          <div style={{ borderTop: '2px solid #6DC424', marginBottom: '12px' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <p><strong>Presupuesto #{String(presupuesto.folio).padStart(4, '0')}</strong></p>
              <p><strong>Lugar y fecha:</strong></p>
              <p>Ciudad Vieja Sacatepéquez, {formatFecha(presupuesto.creadoEn)}.</p>
              <p style={{ marginTop: '8px' }}><strong>Cliente:</strong></p>
              <p>{trabajo.cliente.nombre}</p>
              <p style={{ marginTop: '8px' }}><strong>No. Placa / transporte:</strong></p>
              <p>{trabajo.nombreTransporte ?? '—'}{trabajo.noPlaca ? ` / ${trabajo.noPlaca}` : ''}</p>
            </div>
            <div style={{ textAlign: 'right', fontSize: '11px' }}>
              <p>reconstructora.antigua@gmail.com</p>
              <p><strong>Reconstructora Antigua Jr.</strong></p>
              <p>Tel: {trabajo.cliente.telefono ?? '5331-2311'}</p>
            </div>
          </div>

          <div style={{ borderTop: '2px solid #6DC424', marginTop: '12px' }} />
        </div>

        {/* Secciones */}
        <div className="px-10 pb-8 space-y-6">
          {secciones.map((sec) => {
            const total = totalSeccion(sec.lineas)
            return (
              <div key={sec.id}>
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '13px' }}>{sec.nombre}</strong>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {sec.lineas.map((linea) => (
                      <tr key={linea.id}>
                        <td style={{ paddingBottom: '2px', verticalAlign: 'top' }}>
                          <span>- {linea.descripcion}</span>
                          {linea.subItems && (
                            <div style={{ paddingLeft: '16px', color: '#555', fontSize: '11px', marginTop: '2px' }}>
                              {linea.subItems.split('*').filter(Boolean).map((sub, i) => (
                                <span key={i} style={{ marginRight: '12px' }}>* {sub.trim()}</span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap', paddingLeft: '8px', verticalAlign: 'top' }}>
                          {linea.monto ? formatQ(linea.monto) : '?'}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={2} style={{ paddingTop: '4px' }}>
                        <div style={totalRowStyle}>
                          <span>TOTAL</span>
                          <span>{formatQ(total)}</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )
          })}

          {/* Resumiendo */}
          {secciones.length > 1 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '13px' }}>RESUMIENDO</strong>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {secciones.map((sec) => (
                    <tr key={sec.id}>
                      <td style={{ paddingBottom: '2px' }}>- TOTAL {sec.nombre}</td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap', paddingLeft: '8px' }}>
                        {formatQ(totalSeccion(sec.lineas))}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={2} style={{ paddingTop: '4px' }}>
                      <div style={totalRowStyle}>
                        <span>TOTAL</span>
                        <span>{formatQ(presupuesto.montoTotal)}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Nota y firma */}
          <div style={{ marginTop: '24px', borderTop: '1px solid #eee', paddingTop: '12px', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', marginBottom: '8px' }}>
              <strong>NOTA:</strong> Los trabajos realizados que no se encuentren en esta hoja se tomarán como EXTRA.
            </p>
            <p style={{ fontWeight: 'bold' }}>Nelson Parada</p>
          </div>
        </div>
      </div>

      {/* Historial de cambios */}
      {auditoria.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm no-print">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
            <Clock className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">Historial de cambios</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {auditoria.map((entrada) => (
              <div key={entrada.id} className="px-5 py-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-800">
                    <span className="font-medium">{entrada.usuario?.nombre ?? 'Sistema'}</span>
                    {' — '}
                    {ACCION_LABEL[entrada.accion] ?? entrada.accion}
                  </p>
                  {entrada.detalle && typeof entrada.detalle === 'object' && (
                    <div className="mt-1 space-y-0.5">
                      {Object.entries(entrada.detalle as Record<string, any>).map(([k, v]) => (
                        <p key={k} className="text-xs text-gray-400">
                          {k}:{' '}
                          {typeof v === 'object' && v !== null && 'antes' in v
                            ? <><span className="line-through">{String(v.antes)}</span> → <span className="text-gray-600">{String(v.despues)}</span></>
                            : String(v)
                          }
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-400 shrink-0">{formatFechaHora(entrada.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
