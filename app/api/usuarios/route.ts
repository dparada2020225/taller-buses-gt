import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { nombre, email, telefono, password, rol } = await req.json()

  if (!nombre || !email || !password || !rol) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }
  if (!['ADMIN', 'CLIENTE'].includes(rol)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
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

  if (!resultado?.user?.id) {
    return NextResponse.json({ error: 'Error al crear el usuario' }, { status: 500 })
  }

  // Asignar rol, teléfono y marcar email como verificado
  const usuario = await prisma.user.update({
    where: { id: resultado.user.id },
    data: {
      rol,
      emailVerified: true,
      ...(telefono ? { telefono: telefono.trim() } : {}),
    },
    select: { id: true, nombre: true, email: true, telefono: true, rol: true },
  })

  await prisma.auditoria.create({
    data: {
      usuarioId: session.user.id,
      accion: 'CREAR_USUARIO',
      entidad: 'User',
      entidadId: usuario.id,
      detalle: { nombre, email: emailNorm, rol },
    },
  })

  return NextResponse.json(usuario, { status: 201 })
}
