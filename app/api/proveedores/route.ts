import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const proveedores = await prisma.proveedor.findMany({ orderBy: { nombre: 'asc' } })
  return NextResponse.json(proveedores)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { nombre, contacto, telefono, email, notas } = await req.json()
  if (!nombre) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

  const proveedor = await prisma.proveedor.create({
    data: { nombre, contacto, telefono, email, notas },
  })

  return NextResponse.json(proveedor, { status: 201 })
}
