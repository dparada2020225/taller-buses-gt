import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

// GET  /api/ventas  — admin: todas las ventas; cliente: solo las suyas
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const estado = searchParams.get('estado')

  const ventas = await prisma.venta.findMany({
    where: {
      ...(session.user.rol === 'CLIENTE' ? { clienteId: session.user.id } : {}),
      ...(estado ? { estado: estado as 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' } : {}),
    },
    include: {
      cliente: { select: { nombre: true, email: true } },
      lineas: {
        include: { insumo: { select: { nombre: true, unidad: true, imagenUrl: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(ventas)
}

// POST /api/ventas  — cliente crea una nueva venta (orden de compra)
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { lineas, metodo, notas } = body as {
    lineas: { insumoId: string; cantidad: number }[]
    metodo: 'EFECTIVO' | 'TRANSFERENCIA'
    notas?: string
  }

  if (!lineas?.length) {
    return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 })
  }

  // Validar stock y calcular total
  const insumoIds = lineas.map(l => l.insumoId)
  const insumos = await prisma.insumo.findMany({
    where: { id: { in: insumoIds }, esPublico: true },
  })

  if (insumos.length !== insumoIds.length) {
    return NextResponse.json({ error: 'Producto no disponible en catálogo' }, { status: 400 })
  }

  let total = 0
  const lineasValidas = []

  for (const l of lineas) {
    const insumo = insumos.find(i => i.id === l.insumoId)
    if (!insumo || !insumo.precioVenta) {
      return NextResponse.json({ error: `Producto sin precio: ${insumo?.nombre}` }, { status: 400 })
    }
    if (Number(insumo.stockActual) < l.cantidad) {
      return NextResponse.json(
        { error: `Stock insuficiente para ${insumo.nombre}: disponible ${Number(insumo.stockActual)} ${insumo.unidad}` },
        { status: 400 }
      )
    }
    const precioUnit = Number(insumo.precioVenta)
    total += precioUnit * l.cantidad
    lineasValidas.push({ insumoId: l.insumoId, cantidad: l.cantidad, precioUnit })
  }

  const venta = await prisma.venta.create({
    data: {
      clienteId: session.user.id,
      estado: 'PENDIENTE',
      total,
      metodo: metodo ?? null,
      notas: notas ?? null,
      lineas: {
        create: lineasValidas.map(l => ({
          insumoId:  l.insumoId,
          cantidad:  l.cantidad,
          precioUnit: l.precioUnit,
        })),
      },
    },
    include: {
      lineas: { include: { insumo: { select: { nombre: true } } } },
    },
  })

  await prisma.auditoria.create({
    data: {
      usuarioId: session.user.id,
      accion: 'CREAR_VENTA',
      entidad: 'Venta',
      entidadId: venta.id,
      detalle: { total, items: lineasValidas.length, metodo },
    },
  })

  return NextResponse.json(venta, { status: 201 })
}
