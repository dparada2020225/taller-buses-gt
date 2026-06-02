import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { enviarPresupuestoAlCliente } from '@/lib/email'

export async function GET() {
  const session = await getSession()
  if (!session || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const presupuestos = await prisma.presupuesto.findMany({
    include: {
      trabajo: {
        include: {
          cliente: { select: { nombre: true } },
        },
      },
      secciones: {
        include: { lineas: true },
        orderBy: { orden: 'asc' },
      },
    },
    orderBy: { creadoEn: 'desc' },
  })

  return NextResponse.json(presupuestos)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { trabajoId, tipo, notas, secciones } = await req.json()

  if (!trabajoId || !secciones?.length) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  // Calcular total sumando todas las líneas con monto
  let montoTotal = 0
  for (const seccion of secciones) {
    for (const linea of seccion.lineas ?? []) {
      if (linea.monto) montoTotal += Number(linea.monto)
    }
  }

  const presupuesto = await prisma.presupuesto.create({
    data: {
      trabajoId,
      tipo: tipo ?? 'INICIAL',
      montoTotal,
      notas,
      secciones: {
        create: secciones.map((s: any, si: number) => ({
          nombre: s.nombre,
          orden: si,
          lineas: {
            create: (s.lineas ?? []).map((l: any, li: number) => ({
              descripcion: l.descripcion,
              monto: l.monto ? Number(l.monto) : null,
              subItems: l.subItems ?? null,
              orden: li,
            })),
          },
        })),
      },
    },
    include: {
      trabajo: {
        include: { cliente: { select: { nombre: true } } },
      },
      secciones: {
        include: { lineas: { orderBy: { orden: 'asc' } } },
        orderBy: { orden: 'asc' },
      },
    },
  })

  // Actualizar estado del trabajo a EN_CURSO si estaba en COTIZACION
  await prisma.trabajo.updateMany({
    where: { id: trabajoId, estado: 'COTIZACION' },
    data: { estado: 'EN_CURSO' },
  })

  // Notificar al cliente por email (no bloquea la respuesta)
  const trabajo = await prisma.trabajo.findUnique({
    where: { id: trabajoId },
    include: { cliente: { select: { nombre: true, email: true } } },
  })
  if (trabajo) {
    enviarPresupuestoAlCliente({
      clienteNombre: trabajo.cliente.nombre,
      clienteEmail: trabajo.cliente.email,
      folio: presupuesto.folio,
      montoTotal: Number(presupuesto.montoTotal),
      nombreTransporte: trabajo.nombreTransporte,
      urlPresupuesto: `${process.env.BETTER_AUTH_URL}/mis-presupuestos/${presupuesto.id}`,
    }).catch(console.error)
  }

  return NextResponse.json(presupuesto, { status: 201 })
}
