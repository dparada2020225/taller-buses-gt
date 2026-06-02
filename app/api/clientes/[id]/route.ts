import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const cliente = await prisma.user.findUnique({
    where: { id: params.id, rol: 'CLIENTE' },
    select: {
      id: true,
      nombre: true,
      email: true,
      telefono: true,
      createdAt: true,
      trabajos: {
        include: {
          presupuestos: { select: { montoTotal: true, estado: true, tipo: true } },
          pagos: { select: { monto: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!cliente) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(cliente)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { nombre, telefono } = await req.json()

  const cliente = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(nombre ? { nombre } : {}),
      ...(telefono !== undefined ? { telefono: telefono || null } : {}),
    },
    select: { id: true, nombre: true, email: true, telefono: true },
  })

  return NextResponse.json(cliente)
}
