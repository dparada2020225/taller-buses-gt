import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const proveedorId = searchParams.get('proveedor')

  const compras = await prisma.compra.findMany({
    where: proveedorId ? { proveedorId } : {},
    include: {
      proveedor: { select: { id: true, nombre: true } },
      lineas: {
        include: { insumo: { select: { nombre: true, unidad: true } } },
      },
    },
    orderBy: { fecha: 'desc' },
  })

  return NextResponse.json(compras)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { proveedorId, fecha, notas, lineas } = await req.json()

  if (!proveedorId || !lineas || lineas.length === 0) {
    return NextResponse.json({ error: 'Proveedor y al menos una línea son requeridos' }, { status: 400 })
  }

  // Calcular total
  const total = lineas.reduce(
    (sum: number, l: { cantidad: number; costoUnit: number }) => sum + l.cantidad * l.costoUnit,
    0
  )

  // Crear compra y actualizar stock en transacción
  const compra = await prisma.$transaction(async (tx) => {
    const nuevaCompra = await tx.compra.create({
      data: {
        proveedorId,
        fecha: fecha ? new Date(fecha) : new Date(),
        notas: notas ?? null,
        total,
        lineas: {
          create: lineas.map((l: { insumoId: string; cantidad: number; costoUnit: number }) => ({
            insumoId: l.insumoId,
            cantidad: l.cantidad,
            costoUnit: l.costoUnit,
          })),
        },
      },
      include: {
        proveedor: { select: { nombre: true } },
        lineas: { include: { insumo: { select: { nombre: true, unidad: true } } } },
      },
    })

    // Actualizar stock de cada insumo
    for (const linea of lineas) {
      await tx.insumo.update({
        where: { id: linea.insumoId },
        data: { stockActual: { increment: Number(linea.cantidad) } },
      })
    }

    await tx.auditoria.create({
      data: {
        usuarioId: session.user.id,
        accion: 'REGISTRAR_COMPRA',
        entidad: 'Compra',
        entidadId: nuevaCompra.id,
        detalle: { proveedorId, total, lineas: lineas.length },
      },
    })

    return nuevaCompra
  })

  return NextResponse.json(compra, { status: 201 })
}
