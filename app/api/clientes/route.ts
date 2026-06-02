import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { headers } from 'next/headers'

export async function GET() {
  const session = await getSession()
  if (!session || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const clientes = await prisma.user.findMany({
    where: { rol: 'CLIENTE' },
    select: {
      id: true,
      nombre: true,
      email: true,
      telefono: true,
      createdAt: true,
      _count: { select: { trabajos: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(clientes)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const { nombre, email, telefono, password } = body

  if (!nombre || !email || !password) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  // Verificar que el email no exista
  const existe = await prisma.user.findUnique({ where: { email } })
  if (existe) {
    return NextResponse.json({ error: 'Ya existe un usuario con ese correo' }, { status: 409 })
  }

  // Crear usuario vía better-auth para que la contraseña quede hasheada
  const { error } = await fetch(`${process.env.BETTER_AUTH_URL}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: nombre, email, password }),
  }).then((r) => r.json())

  if (error) {
    return NextResponse.json({ error: 'Error al crear el usuario' }, { status: 500 })
  }

  // Agregar teléfono si viene
  const usuario = await prisma.user.findUnique({ where: { email } })
  if (usuario && telefono) {
    await prisma.user.update({ where: { id: usuario.id }, data: { telefono } })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
