import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const usuario = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, nombre: true, email: true, telefono: true, rol: true, createdAt: true, emailVerified: true },
  })

  if (!usuario) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(usuario)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const { nombre, telefono, rol } = body

  // Validaciones
  if (nombre !== undefined && nombre.trim().length < 2) {
    return NextResponse.json({ error: 'El nombre debe tener al menos 2 caracteres' }, { status: 400 })
  }
  if (rol && !['ADMIN', 'CLIENTE'].includes(rol)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
  }

  const usuarioActual = await prisma.user.findUnique({
    where: { id: params.id },
    select: { nombre: true, telefono: true, rol: true },
  })
  if (!usuarioActual) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const cambios: Record<string, unknown> = {}
  if (nombre !== undefined && nombre !== usuarioActual.nombre)
    cambios.nombre = { antes: usuarioActual.nombre, despues: nombre }
  if (telefono !== undefined && telefono !== usuarioActual.telefono)
    cambios.telefono = { antes: usuarioActual.telefono, despues: telefono }
  if (rol && rol !== usuarioActual.rol)
    cambios.rol = { antes: usuarioActual.rol, despues: rol }

  const actualizado = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(nombre    !== undefined ? { nombre: nombre.trim() }      : {}),
      ...(telefono  !== undefined ? { telefono: telefono || null }  : {}),
      ...(rol                     ? { rol }                         : {}),
    },
    select: { id: true, nombre: true, email: true, telefono: true, rol: true },
  })

  if (Object.keys(cambios).length > 0) {
    await prisma.auditoria.create({
      data: {
        usuarioId: session.user.id,
        accion: rol && cambios.rol ? 'CAMBIAR_ROL_USUARIO' : 'EDITAR_USUARIO',
        entidad: 'User',
        entidadId: params.id,
        detalle: cambios,
      },
    })
  }

  return NextResponse.json(actualizado)
}
