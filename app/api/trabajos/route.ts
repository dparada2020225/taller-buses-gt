import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const trabajos = await prisma.trabajo.findMany({
    include: {
      cliente: { select: { id: true, nombre: true, email: true, telefono: true } },
      _count: { select: { presupuestos: true, pagos: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(trabajos)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { clienteId, descripcion, nombreTransporte, noPlaca, notas } = await req.json()

  if (!clienteId || !descripcion) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const trabajo = await prisma.trabajo.create({
    data: { clienteId, descripcion, nombreTransporte, noPlaca, notas },
    include: { cliente: { select: { nombre: true } } },
  })

  return NextResponse.json(trabajo, { status: 201 })
}
