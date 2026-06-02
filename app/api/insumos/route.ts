import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const busqueda = searchParams.get('q') ?? ''
  const soloPublicos = searchParams.get('publicos') === '1'
  const soloAlertas = searchParams.get('alertas') === '1'

  // Prisma no soporta comparar dos columnas en where, así que filtramos alertas en JS
  const insumos = await prisma.insumo.findMany({
    where: {
      ...(busqueda ? { nombre: { contains: busqueda, mode: 'insensitive' } } : {}),
      ...(soloPublicos ? { esPublico: true } : {}),
    },
    orderBy: { nombre: 'asc' },
  })

  const resultado = soloAlertas
    ? insumos.filter(i => Number(i.stockActual) <= Number(i.stockMinimo))
    : insumos

  return NextResponse.json(resultado)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const { nombre, descripcion, unidad, stockActual, stockMinimo, esPublico, precioVenta, imagenUrl } = body

  if (!nombre || !unidad) {
    return NextResponse.json({ error: 'Nombre y unidad son requeridos' }, { status: 400 })
  }

  const insumo = await prisma.insumo.create({
    data: {
      nombre,
      descripcion: descripcion ?? null,
      unidad,
      stockActual: stockActual ?? 0,
      stockMinimo: stockMinimo ?? 0,
      esPublico: esPublico ?? false,
      precioVenta: esPublico && precioVenta ? precioVenta : null,
      imagenUrl: imagenUrl ?? null,
    },
  })

  await prisma.auditoria.create({
    data: {
      usuarioId: session.user.id,
      accion: 'CREAR_INSUMO',
      entidad: 'Insumo',
      entidadId: insumo.id,
      detalle: { nombre, unidad, stockActual },
    },
  })

  return NextResponse.json(insumo, { status: 201 })
}
