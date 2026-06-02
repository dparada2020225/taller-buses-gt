import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const insumo = await prisma.insumo.findUnique({
    where: { id: params.id },
    include: {
      consumos: {
        include: { trabajo: { select: { id: true, descripcion: true, nombreTransporte: true } } },
        orderBy: { fecha: 'desc' },
        take: 20,
      },
      lineasCompra: {
        include: { compra: { select: { id: true, fecha: true, proveedor: { select: { nombre: true } } } } },
        orderBy: { compra: { fecha: 'desc' } },
        take: 20,
      },
    },
  })

  if (!insumo) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(insumo)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const { nombre, descripcion, unidad, stockActual, stockMinimo, esPublico, precioVenta, imagenUrl } = body

  const insumo = await prisma.insumo.update({
    where: { id: params.id },
    data: {
      ...(nombre !== undefined ? { nombre } : {}),
      ...(descripcion !== undefined ? { descripcion } : {}),
      ...(unidad !== undefined ? { unidad } : {}),
      ...(stockActual !== undefined ? { stockActual } : {}),
      ...(stockMinimo !== undefined ? { stockMinimo } : {}),
      ...(esPublico !== undefined ? { esPublico } : {}),
      ...(precioVenta !== undefined ? { precioVenta } : {}),
      ...(imagenUrl !== undefined ? { imagenUrl } : {}),
    },
  })

  await prisma.auditoria.create({
    data: {
      usuarioId: session.user.id,
      accion: 'EDITAR_INSUMO',
      entidad: 'Insumo',
      entidadId: insumo.id,
      detalle: body,
    },
  })

  return NextResponse.json(insumo)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Verificar que no tenga consumos ni lineas de compra asociadas
  const [consumos, lineasCompra] = await Promise.all([
    prisma.consumo.count({ where: { insumoId: params.id } }),
    prisma.lineaCompra.count({ where: { insumoId: params.id } }),
  ])

  if (consumos > 0 || lineasCompra > 0) {
    return NextResponse.json(
      { error: 'No se puede eliminar: tiene movimientos registrados' },
      { status: 409 }
    )
  }

  await prisma.insumo.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
