import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { monto, metodo, fecha, notas } = await req.json()

  if (!monto || !metodo || !fecha) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const pago = await prisma.pago.create({
    data: {
      trabajoId: params.id,
      monto: Number(monto),
      metodo,
      fecha: new Date(fecha),
      notas: notas || null,
    },
  })

  await prisma.auditoria.create({
    data: {
      usuarioId: session.user.id,
      accion: 'REGISTRAR_PAGO',
      entidad: 'Pago',
      entidadId: pago.id,
      detalle: { trabajoId: params.id, monto: Number(monto), metodo },
    },
  })

  return NextResponse.json(pago, { status: 201 })
}
