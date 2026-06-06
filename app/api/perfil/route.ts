import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

// GET /api/perfil — datos del usuario actual
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const usuario = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, nombre: true, email: true, telefono: true, rol: true, imagen: true, createdAt: true },
  })

  return NextResponse.json(usuario)
}

// PATCH /api/perfil — actualizar nombre y teléfono
export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { nombre, telefono } = await req.json()

  if (nombre !== undefined && nombre.trim().length < 2) {
    return NextResponse.json({ error: 'El nombre debe tener al menos 2 caracteres' }, { status: 400 })
  }

  const actualizado = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(nombre    !== undefined ? { nombre: nombre.trim() }    : {}),
      ...(telefono  !== undefined ? { telefono: telefono || null } : {}),
    },
    select: { id: true, nombre: true, email: true, telefono: true, rol: true },
  })

  return NextResponse.json(actualizado)
}
