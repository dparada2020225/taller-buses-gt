import { prisma } from '@/lib/prisma'
import { CatalogoCliente } from '@/components/catalogo/catalogo-cliente'

export const dynamic = 'force-dynamic'

export default async function CatalogoPage() {
  const productos = await prisma.insumo.findMany({
    where: { esPublico: true, precioVenta: { not: null } },
    orderBy: { nombre: 'asc' },
  })

  return <CatalogoCliente productos={productos} />
}
