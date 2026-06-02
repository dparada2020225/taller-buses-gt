import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { nombre, email, password } = await req.json()

  if (!nombre || !email || !password) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
  }

  const emailNorm = email.toLowerCase().trim()

  const existe = await prisma.user.findUnique({ where: { email: emailNorm } })
  if (existe) {
    return NextResponse.json({ error: 'Ya existe una cuenta con ese correo' }, { status: 409 })
  }

  // Contar antes para saber si será el primer usuario
  const totalAntes = await prisma.user.count()
  const seraAdmin = totalAntes === 0

  // Crear via better-auth
  const resultado = await auth.api.signUpEmail({
    body: { name: nombre, email: emailNorm, password },
  })

  // Buscar el usuario creado — por ID si viene, si no por email
  const userId = resultado?.user?.id
  const usuario = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : await prisma.user.findUnique({ where: { email: emailNorm } })

  if (!usuario) {
    return NextResponse.json({ error: 'Error al crear la cuenta' }, { status: 500 })
  }

  // Asignar rol y verificar email
  await prisma.user.update({
    where: { id: usuario.id },
    data: {
      rol: seraAdmin ? 'ADMIN' : 'CLIENTE',
      emailVerified: true,
    },
  })

  return NextResponse.json({ ok: true, rol: seraAdmin ? 'ADMIN' : 'CLIENTE' }, { status: 201 })
}
