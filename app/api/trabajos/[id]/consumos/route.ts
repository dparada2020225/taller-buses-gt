import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const consumos = await prisma.consumo.findMany({
    where: { trabajoId: params.id },
    include: { insumo: { select: { id: true, nombre: true, unidad: true } } },
    orderBy: { fecha: 'desc' },
  })

  return NextResponse.json(consumos)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { insumoId, cantidad, costoUnit, notas } = await req.json()

  if (!insumoId || !cantidad || !costoUnit) {
    return NextResponse.json({ error: 'insumoId, cantidad y costoUnit son requeridos' }, { status: 400 })
  }

  // Verificar stock suficiente
  const insumo = await prisma.insumo.findUnique({ where: { id: insumoId } })
  if (!insumo) return NextResponse.json({ error: 'Insumo no encontrado' }, { status: 404 })

  if (Number(insumo.stockActual) < Number(cantidad)) {
    return NextResponse.json(
      { error: `Stock insuficiente. Disponible: ${insumo.stockActual} ${insumo.unidad}` },
      { status: 409 }
    )
  }

  // Crear consumo y actualizar stock en transacción
  const [consumo] = await prisma.$transaction([
    prisma.consumo.create({
      data: {
        trabajoId: params.id,
        insumoId,
        cantidad,
        costoUnit,
        notas: notas ?? null,
        fecha: new Date(),
      },
      include: { insumo: { select: { nombre: true, unidad: true } } },
    }),
    prisma.insumo.update({
      where: { id: insumoId },
      data: { stockActual: { decrement: Number(cantidad) } },
    }),
    prisma.auditoria.create({
      data: {
        usuarioId: session.user.id,
        accion: 'REGISTRAR_CONSUMO',
        entidad: 'Consumo',
        detalle: { trabajoId: params.id, insumoId, cantidad, costoUnit },
      },
    }),
  ])

  return NextResponse.json(consumo, { status: 201 })
}
