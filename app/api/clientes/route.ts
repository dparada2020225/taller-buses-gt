import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { auth } from '@/lib/auth'

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

  const { nombre, email, telefono, password } = await req.json()

  if (!nombre || !email || !password) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const emailNorm = email.toLowerCase().trim()

  const existe = await prisma.user.findUnique({ where: { email: emailNorm } })
  if (existe) {
    return NextResponse.json({ error: 'Ya existe un usuario con ese correo' }, { status: 409 })
  }

  // Crear via better-auth para que la contraseña quede hasheada
  const resultado = await auth.api.signUpEmail({
    body: { name: nombre, email: emailNorm, password },
  })

  const userId = resultado?.user?.id
  const usuario = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : await prisma.user.findUnique({ where: { email: emailNorm } })

  if (!usuario) {
    return NextResponse.json({ error: 'Error al crear el usuario' }, { status: 500 })
  }

  await prisma.user.update({
    where: { id: usuario.id },
    data: {
      rol: 'CLIENTE',
      emailVerified: true,
      ...(telefono ? { telefono } : {}),
    },
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
