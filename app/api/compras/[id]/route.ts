import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const compra = await prisma.compra.findUnique({
    where: { id: params.id },
    include: {
      proveedor: true,
      lineas: { include: { insumo: { select: { nombre: true, unidad: true } } } },
    },
  })

  if (!compra) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(compra)
}
