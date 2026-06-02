'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Printer, CheckCircle, XCircle } from 'lucide-react'

interface Linea { id: string; descripcion: string; monto: any; subItems: string | null }
interface Seccion { id: string; nombre: string; lineas: Linea[] }

interface Presupuesto {
  id: string
  estado: string
  montoTotal: any
  creadoEn: string | Date
  trabajo: {
    nombreTransporte: string | null
    noPlaca: string | null
    cliente: { nombre: string; telefono: string | null }
  }
  secciones: Seccion[]
}

function formatQ(n: any) {
  if (n === null || n === undefined) return '?'
  return `Q${Number(n).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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

export function VistaPresupuestoCliente({ presupuesto }: { presupuesto: Presupuesto }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'APROBADO' | 'RECHAZADO' | null>(null)
  const [estado, setEstado] = useState(presupuesto.estado)
  const { trabajo, secciones } = presupuesto

  async function responder(nuevoEstado: 'APROBADO' | 'RECHAZADO') {
    setLoading(nuevoEstado)
    const res = await fetch(`/api/presupuestos/${presupuesto.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado }),
    })
    if (res.ok) {
      setEstado(nuevoEstado)
      router.refresh()
    }
    setLoading(null)
  }

  const pendiente = estado === 'PENDIENTE'

  return (
    <div className="space-y-4">
      {/* Acciones */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-2">
          {estado === 'PENDIENTE' && (
            <span className="rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700">
              Pendiente de tu aprobación
            </span>
          )}
          {estado === 'APROBADO' && (
            <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              ✓ Aprobado
            </span>
          )}
          {estado === 'RECHAZADO' && (
            <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
              Rechazado
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {pendiente && (
            <>
              <button
                onClick={() => responder('RECHAZADO')}
                disabled={!!loading}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition"
              >
                <XCircle className="h-4 w-4" />
                {loading === 'RECHAZADO' ? 'Guardando...' : 'Rechazar'}
              </button>
              <button
                onClick={() => responder('APROBADO')}
                disabled={!!loading}
                className="flex items-center gap-1.5 rounded-lg bg-[#6DC424] px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50 transition"
              >
                <CheckCircle className="h-4 w-4" />
                {loading === 'APROBADO' ? 'Guardando...' : 'Aprobar'}
              </button>
            </>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            <Printer className="h-4 w-4" />
            Descargar PDF
          </button>
        </div>
      </div>

      {/* Documento */}
      <div id="presupuesto-doc" className="bg-white mx-auto" style={{ maxWidth: '800px', fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>
        <div className="px-10 pt-8 pb-4">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <Image src="/images/logo fondo blanco.jpeg" alt="Reconstructora Antigua Jr." width={380} height={100} priority />
          </div>
          <div style={{ borderTop: '2px solid #6DC424', marginBottom: '12px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
            <div>
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

        <div className="px-10 pb-8 space-y-6">
          {secciones.map((sec) => (
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
                        <span>{formatQ(totalSeccion(sec.lineas))}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}

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
                      <td style={{ textAlign: 'right', paddingLeft: '8px' }}>{formatQ(totalSeccion(sec.lineas))}</td>
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

          <div style={{ marginTop: '24px', borderTop: '1px solid #eee', paddingTop: '12px', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', marginBottom: '8px' }}>
              <strong>NOTA:</strong> Los trabajos realizados que no se encuentren en esta hoja se tomarán como EXTRA.
            </p>
            <p style={{ fontWeight: 'bold' }}>Nelson Parada</p>
          </div>
        </div>
      </div>
    </div>
  )
}
