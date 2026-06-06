import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const metodo = searchParams.get('metodo')
  const desde  = searchParams.get('desde')
  const hasta  = searchParams.get('hasta')
  const q      = searchParams.get('q') ?? ''

  const pagos = await prisma.pago.findMany({
    where: {
      ...(metodo ? { metodo: metodo as 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE' } : {}),
      ...(desde || hasta
        ? {
            fecha: {
              ...(desde ? { gte: new Date(desde) } : {}),
              ...(hasta ? { lte: new Date(`${hasta}T23:59:59`) } : {}),
            },
          }
        : {}),
      ...(q
        ? {
            trabajo: {
              cliente: { nombre: { contains: q, mode: 'insensitive' } },
            },
          }
        : {}),
    },
    include: {
      trabajo: {
        select: {
          id: true,
          descripcion: true,
          nombreTransporte: true,
          cliente: { select: { nombre: true } },
        },
      },
    },
    orderBy: { fecha: 'desc' },
  })

  return NextResponse.json(pagos)
}
