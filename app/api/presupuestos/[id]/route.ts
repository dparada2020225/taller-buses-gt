import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const presupuesto = await prisma.presupuesto.findUnique({
    where: { id: params.id },
    include: {
      trabajo: {
        include: {
          cliente: { select: { nombre: true, email: true, telefono: true } },
        },
      },
      secciones: {
        include: { lineas: { orderBy: { orden: 'asc' } } },
        orderBy: { orden: 'asc' },
      },
    },
  })

  if (!presupuesto) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  if (session.user.rol === 'CLIENTE' && presupuesto.trabajo.clienteId !== session.user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  return NextResponse.json(presupuesto)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { estado, secciones, notas } = body

  const presupuestoActual = await prisma.presupuesto.findUnique({
    where: { id: params.id },
    include: {
      trabajo: true,
      secciones: { include: { lineas: true } },
    },
  })
  if (!presupuestoActual) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  // Cliente solo puede aprobar/rechazar
  if (session.user.rol === 'CLIENTE') {
    if (!['APROBADO', 'RECHAZADO'].includes(estado)) {
      return NextResponse.json({ error: 'Acción no permitida' }, { status: 403 })
    }
    if (presupuestoActual.trabajo.clienteId !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
  }

  // Construir detalle del cambio para auditoría
  const cambios: Record<string, unknown> = {}
  if (estado && estado !== presupuestoActual.estado) cambios.estado = { antes: presupuestoActual.estado, despues: estado }
  if (notas !== undefined && notas !== presupuestoActual.notas) cambios.notas = { antes: presupuestoActual.notas, despues: notas }

  // Si vienen secciones nuevas, reconstruir
  let montoTotal = presupuestoActual.montoTotal
  if (secciones && session.user.rol === 'ADMIN') {
    cambios.secciones = 'contenido actualizado'

    // Calcular nuevo total
    let nuevoTotal = 0
    for (const sec of secciones) {
      for (const linea of sec.lineas ?? []) {
        if (linea.monto) nuevoTotal += Number(linea.monto)
      }
    }
    montoTotal = nuevoTotal

    // Borrar secciones viejas y crear nuevas
    await prisma.seccionPresupuesto.deleteMany({ where: { presupuestoId: params.id } })
    for (let si = 0; si < secciones.length; si++) {
      const sec = secciones[si]
      await prisma.seccionPresupuesto.create({
        data: {
          presupuestoId: params.id,
          nombre: sec.nombre,
          orden: si,
          lineas: {
            create: (sec.lineas ?? []).map((l: any, li: number) => ({
              descripcion: l.descripcion,
              monto: l.monto ? Number(l.monto) : null,
              subItems: l.subItems ?? null,
              orden: li,
            })),
          },
        },
      })
    }
  }

  const actualizado = await prisma.presupuesto.update({
    where: { id: params.id },
    data: {
      ...(estado ? { estado, ...(estado === 'APROBADO' ? { aprobadoEn: new Date() } : {}) } : {}),
      ...(notas !== undefined ? { notas } : {}),
      montoTotal,
    },
  })

  // Registrar en auditoría
  if (Object.keys(cambios).length > 0) {
    await prisma.auditoria.create({
      data: {
        usuarioId: session.user.id,
        accion: 'EDITAR_PRESUPUESTO',
        entidad: 'Presupuesto',
        entidadId: params.id,
        detalle: cambios,
      },
    })
  }

  return NextResponse.json(actualizado)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const presupuesto = await prisma.presupuesto.findUnique({
    where: { id: params.id },
    include: { trabajo: { include: { cliente: { select: { nombre: true } } } } },
  })
  if (!presupuesto) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  // Guardar en auditoría ANTES de eliminar
  await prisma.auditoria.create({
    data: {
      usuarioId: session.user.id,
      accion: 'ELIMINAR_PRESUPUESTO',
      entidad: 'Presupuesto',
      entidadId: params.id,
      detalle: {
        cliente: presupuesto.trabajo.cliente.nombre,
        montoTotal: Number(presupuesto.montoTotal),
        estado: presupuesto.estado,
        creadoEn: presupuesto.creadoEn,
      },
    },
  })

  await prisma.presupuesto.delete({ where: { id: params.id } })

  return NextResponse.json({ ok: true })
}
