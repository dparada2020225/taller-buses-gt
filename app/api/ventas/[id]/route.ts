import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

// PATCH /api/ventas/[id] — admin confirma o cancela; cliente cancela la suya si está PENDIENTE
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { estado } = await req.json()

  const venta = await prisma.venta.findUnique({
    where: { id: params.id },
    include: { lineas: true },
  })
  if (!venta) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  // Cliente solo puede cancelar la suya y solo si está PENDIENTE
  if (session.user.rol === 'CLIENTE') {
    if (venta.clienteId !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    if (estado !== 'CANCELADA' || venta.estado !== 'PENDIENTE') {
      return NextResponse.json({ error: 'Acción no permitida' }, { status: 403 })
    }
  }

  // Si admin confirma → descontar stock
  if (session.user.rol === 'ADMIN' && estado === 'CONFIRMADA' && venta.estado === 'PENDIENTE') {
    await Promise.all(
      venta.lineas.map(l =>
        prisma.insumo.update({
          where: { id: l.insumoId },
          data: { stockActual: { decrement: Number(l.cantidad) } },
        })
      )
    )
  }

  const actualizada = await prisma.venta.update({
    where: { id: params.id },
    data: { estado },
  })

  await prisma.auditoria.create({
    data: {
      usuarioId: session.user.id,
      accion: `${estado === 'CONFIRMADA' ? 'CONFIRMAR' : 'CANCELAR'}_VENTA`,
      entidad: 'Venta',
      entidadId: params.id,
      detalle: { estadoAnterior: venta.estado, estadoNuevo: estado },
    },
  })

  return NextResponse.json(actualizada)
}

// GET /api/ventas/[id] — detalle de una venta
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const venta = await prisma.venta.findUnique({
    where: { id: params.id },
    include: {
      cliente: { select: { nombre: true, email: true } },
      lineas: {
        include: { insumo: { select: { nombre: true, unidad: true, imagenUrl: true } } },
      },
    },
  })

  if (!venta) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  if (session.user.rol === 'CLIENTE' && venta.clienteId !== session.user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  return NextResponse.json(venta)
}
