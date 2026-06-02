import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const trabajo = await prisma.trabajo.findUnique({
    where: { id: params.id },
    include: {
      cliente: { select: { id: true, nombre: true, email: true, telefono: true } },
      presupuestos: {
        orderBy: { creadoEn: 'desc' },
        select: { id: true, folio: true, tipo: true, estado: true, montoTotal: true, creadoEn: true },
      },
      pagos: { orderBy: { fecha: 'desc' } },
      consumos: {
        include: { insumo: { select: { nombre: true, unidad: true } } },
        orderBy: { fecha: 'desc' },
      },
    },
  })

  if (!trabajo) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(trabajo)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { estado, descripcion, nombreTransporte, noPlaca, notas } = await req.json()

  const trabajo = await prisma.trabajo.update({
    where: { id: params.id },
    data: {
      ...(estado ? { estado } : {}),
      ...(descripcion ? { descripcion } : {}),
      ...(nombreTransporte !== undefined ? { nombreTransporte } : {}),
      ...(noPlaca !== undefined ? { noPlaca } : {}),
      ...(notas !== undefined ? { notas } : {}),
    },
    include: {
      cliente: { select: { nombre: true } },
    },
  })

  await prisma.auditoria.create({
    data: {
      usuarioId: session.user.id,
      accion: 'CAMBIAR_ESTADO_TRABAJO',
      entidad: 'Trabajo',
      entidadId: params.id,
      detalle: { estado },
    },
  })

  return NextResponse.json(trabajo)
}
