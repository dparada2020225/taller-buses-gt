export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { VistaPresupuestoCliente } from '@/components/presupuestos/vista-presupuesto-cliente'
import { ArrowLeft } from 'lucide-react'

export default async function PresupuestoClientePage({ params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const presupuesto = await prisma.presupuesto.findUnique({
    where: { id: params.id },
    include: {
      trabajo: {
        include: {
          cliente: { select: { nombre: true, telefono: true } },
        },
      },
      secciones: {
        include: { lineas: { orderBy: { orden: 'asc' } } },
        orderBy: { orden: 'asc' },
      },
    },
  })

  if (!presupuesto) notFound()

  if (presupuesto.trabajo.clienteId !== session.user.id) {
    redirect('/mis-presupuestos')
  }

  return (
    <div className="p-6 space-y-4">
      <Link
        href="/mis-presupuesto