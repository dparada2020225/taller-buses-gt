/**
 * Utilidades de email — Taller Buses GT
 * Usa Resend cuando RESEND_API_KEY está configurado.
 * En desarrollo sin clave simplemente loguea y no falla.
 */

interface EmailPresupuesto {
  clienteNombre: string
  clienteEmail: string
  folio: number
  montoTotal: number
  nombreTransporte: string | null
  urlPresupuesto: string
}

function formatQ(n: number) {
  return `Q${n.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`
}

export async function enviarPresupuestoAlCliente(data: EmailPresupuesto) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[email] Presupuesto #${data.folio} para ${data.clienteEmail} — Resend no configurado, omitiendo.`)
    return
  }

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'noreply@tallerbusesgt.com',
    to: data.clienteEmail,
    subject: `Presupuesto #${data.folio} — Reconstructora Antigua Jr.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#0f0f0f;padding:24px;text-align:center">
          <h1 style="color:#6DC424;margin:0;font-size:22px">Reconstructora Antigua Jr.</h1>
          <p style="color:#ffffff80;margin:4px 0 0;font-size:12px">EL TRABAJO BIEN HECHO</p>
        </div>
        <div style="padding:24px;background:#fff">
          <p>Hola <strong>${data.clienteNombre}</strong>,</p>
          <p>Hemos preparado un nuevo presupuesto para tu trabajo${data.nombreTransporte ? ` — <strong>${data.nombreTransporte}</strong>` : ''}.</p>
          <div style="background:#f9f9f9;border:1px solid #eee;border-radius:8px;padding:16px;margin:16px 0">
            <p style="margin:0;font-size:13px;color:#666">Presupuesto #${data.folio}</p>
            <p style="margin:4px 0 0;font-size:24px;font-weight:bold;color:#0f0f0f">${formatQ(data.montoTotal)}</p>
          </div>
          <p>Por favor revisa el presupuesto y confirma si lo apruebas o rechazas:</p>
          <a href="${data.urlPresupuesto}" style="display:inline-block;background:#6DC424;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
            Ver presupuesto
          </a>
          <p style="color:#999;font-size:12px;margin-top:24px">
            Si no puedes hacer clic en el botón, copia este enlace: ${data.urlPresupuesto}
          </p>
        </div>
      </div>
    `,
  })
}

export async function enviarNotificacionAprobacion(data: {
  adminEmail: string
  clienteNombre: string
  folio: number
  estado: 'APROBADO' | 'RECHAZADO'
  urlPresupuesto: string
}) {
  if (!process.env.RESEND_API_KEY) return

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  const accion = data.estado === 'APROBADO' ? 'aprobó' : 'rechazó'
  const color = data.estado === 'APROBADO' ? '#6DC424' : '#ef4444'

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'noreply@tallerbusesgt.com',
    to: data.adminEmail,
    subject: `${data.clienteNombre} ${accion} el presupuesto #${data.folio}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#0f0f0f;padding:24px;text-align:center">
          <h1 style="color:#6DC424;margin:0;font-size:22px">Reconstructora Antigua Jr.</h1>
        </div>
        <div style="padding:24px;background:#fff">
          <p>El cliente <strong>${data.clienteNombre}</strong> ${accion} el presupuesto <strong>#${data.folio}</strong>.</p>
          <a href="${data.urlPresupuesto}" style="display:inline-block;background:${color};color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
            Ver presupuesto
          </a>
        </div>
      </div>
    `,
  })
}
