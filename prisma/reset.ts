/**
 * Reset completo de la base de datos — Taller Buses GT
 *
 * Elimina todos los datos en orden correcto (respetando FKs).
 * Luego corre seed base + seed de inventario automáticamente.
 *
 * Uso: docker compose exec app npx tsx prisma/reset.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('\n🗑️  Vaciando base de datos...\n')

  // Orden: primero las tablas hija, luego las padre
  await prisma.auditoria.deleteMany()
  console.log('  ✓  auditoria')

  await prisma.lineaVenta.deleteMany()
  await prisma.venta.deleteMany()
  console.log('  ✓  ventas')

  await prisma.lineaCompra.deleteMany()
  await prisma.compra.deleteMany()
  console.log('  ✓  compras')

  await prisma.consumo.deleteMany()
  console.log('  ✓  consumos')

  await prisma.pago.deleteMany()
  console.log('  ✓  pagos')

  await prisma.lineaPresupuesto.deleteMany()
  await prisma.seccionPresupuesto.deleteMany()
  await prisma.presupuesto.deleteMany()
  console.log('  ✓  presupuestos')

  await prisma.trabajo.deleteMany()
  console.log('  ✓  trabajos')

  await prisma.insumo.deleteMany()
  console.log('  ✓  insumos')

  await prisma.proveedor.deleteMany()
  console.log('  ✓  proveedores')

  // Auth — sesiones y cuentas antes que usuarios
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.verification.deleteMany()
  await prisma.user.deleteMany()
  console.log('  ✓  usuarios / sesiones')

  console.log('\n✅  Base de datos vacía.\n')
  console.log('Ahora corre:')
  console.log('  docker compose exec app npx tsx prisma/seed.ts')
  console.log('  docker compose exec app npx tsx prisma/seed-inventario.ts\n')
}

main()
  .catch(e => { console.error('❌ Error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
