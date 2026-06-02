/**
 * Seed de inventario — Taller Buses GT
 *
 * Extiende el seed base con:
 *   - Insumos variados (algunos bajo stock mínimo para ver alertas)
 *   - 2 proveedores adicionales
 *   - 3 compras con líneas (actualiza stock automáticamente)
 *   - Consumos registrados en los trabajos existentes
 *
 * Prerrequisito: correr primero el seed base (prisma/seed.ts)
 * Uso: docker compose exec app npx tsx prisma/seed-inventario.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('\n🌱  Seed de inventario...\n')

  // ── Insumos ───────────────────────────────────────────────────────────────
  console.log('Insumos:')
  const insumosData = [
    // Pinturas y químicos
    { nombre: 'Pintura sintética blanca',      unidad: 'galón',  stockActual: 6,   stockMinimo: 10,  esPublico: false, precioVenta: null },  // ALERTA
    { nombre: 'Pintura poliuretano negro',     unidad: 'galón',  stockActual: 8,   stockMinimo: 5,   esPublico: false, precioVenta: null },
    { nombre: 'Pintura cromada aerosol',       unidad: 'lata',   stockActual: 25,  stockMinimo: 10,  esPublico: false, precioVenta: null },
    { nombre: 'Thinner laca',                  unidad: 'galón',  stockActual: 12,  stockMinimo: 8,   esPublico: false, precioVenta: null },
    { nombre: 'Sellador epóxico',              unidad: 'galón',  stockActual: 3,   stockMinimo: 4,   esPublico: false, precioVenta: null },  // ALERTA
    // Abrasivos
    { nombre: 'Lija #80',                     unidad: 'pliego', stockActual: 150, stockMinimo: 50,  esPublico: false, precioVenta: null },
    { nombre: 'Lija #120',                    unidad: 'pliego', stockActual: 40,  stockMinimo: 50,  esPublico: false, precioVenta: null },  // ALERTA
    { nombre: 'Lija #220',                    unidad: 'pliego', stockActual: 200, stockMinimo: 50,  esPublico: false, precioVenta: null },
    { nombre: 'Disco de corte 4.5"',          unidad: 'unidad', stockActual: 30,  stockMinimo: 15,  esPublico: false, precioVenta: null },
    { nombre: 'Disco de pulir',               unidad: 'unidad', stockActual: 8,   stockMinimo: 10,  esPublico: false, precioVenta: null },  // ALERTA
    // Soldadura
    { nombre: 'Soldadura E6011 3/32"',        unidad: 'libra',  stockActual: 80,  stockMinimo: 20,  esPublico: false, precioVenta: null },
    { nombre: 'Soldadura E7018 1/8"',         unidad: 'libra',  stockActual: 45,  stockMinimo: 20,  esPublico: false, precioVenta: null },
    { nombre: 'Gas argón (cilindro)',          unidad: 'unidad', stockActual: 2,   stockMinimo: 1,   esPublico: false, precioVenta: null },
    // Acabados interiores
    { nombre: 'Neolay (hule piso) metro',     unidad: 'metro',  stockActual: 120, stockMinimo: 30,  esPublico: false, precioVenta: null },
    { nombre: 'Espuma para asiento 2"',       unidad: 'metro',  stockActual: 45,  stockMinimo: 20,  esPublico: false, precioVenta: null },
    { nombre: 'Tela tapizado gris',           unidad: 'metro',  stockActual: 60,  stockMinimo: 20,  esPublico: false, precioVenta: null },
    { nombre: 'Tornillos 1/4" x 1" (bolsa)', unidad: 'bolsa',  stockActual: 25,  stockMinimo: 10,  esPublico: false, precioVenta: null },
    { nombre: 'Tornillos 5/16" x 1.5"',      unidad: 'bolsa',  stockActual: 18,  stockMinimo: 10,  esPublico: false, precioVenta: null },
    // Eléctrico
    { nombre: 'Cable eléctrico 12 AWG',       unidad: 'metro',  stockActual: 200, stockMinimo: 50,  esPublico: false, precioVenta: null },
    { nombre: 'Cable eléctrico 10 AWG',       unidad: 'metro',  stockActual: 80,  stockMinimo: 30,  esPublico: false, precioVenta: null },
    { nombre: 'Fusibles (caja 30 uds)',       unidad: 'caja',   stockActual: 5,   stockMinimo: 3,   esPublico: false, precioVenta: null },
    // Productos públicos (catálogo)
    { nombre: 'Luz LED doble',                unidad: 'unidad', stockActual: 45,  stockMinimo: 20,  esPublico: true,  precioVenta: 85 },
    { nombre: 'Luz LED triple',               unidad: 'unidad', stockActual: 12,  stockMinimo: 8,   esPublico: true,  precioVenta: 120 },
    { nombre: 'Persiana cromada 12 luces',    unidad: 'unidad', stockActual: 3,   stockMinimo: 2,   esPublico: true,  precioVenta: 17000 },
    { nombre: 'Persiana cromada 8 luces',     unidad: 'unidad', stockActual: 5,   stockMinimo: 2,   esPublico: true,  precioVenta: 12000 },
    { nombre: 'Retrovisor cromado c/luz',     unidad: 'par',    stockActual: 4,   stockMinimo: 2,   esPublico: true,  precioVenta: 2750 },
    { nombre: 'Bocina de aire Harley',        unidad: 'unidad', stockActual: 2,   stockMinimo: 1,   esPublico: true,  precioVenta: 3500 },
    { nombre: 'Aro de aluminio 22.5"',        unidad: 'unidad', stockActual: 8,   stockMinimo: 4,   esPublico: true,  precioVenta: 2625 },
  ]

  const insumoMap: Record<string, string> = {}

  for (const ins of insumosData) {
    const existe = await prisma.insumo.findFirst({ where: { nombre: ins.nombre } })
    if (existe) {
      insumoMap[ins.nombre] = existe.id
      console.log(`  ↩  ${ins.nombre}`)
    } else {
      const creado = await prisma.insumo.create({ data: ins })
      insumoMap[ins.nombre] = creado.id
      console.log(`  ✓  ${ins.nombre}`)
    }
  }

  // ── Proveedores ───────────────────────────────────────────────────────────
  console.log('\nProveedores:')
  const proveedoresData = [
    { nombre: 'Distribuidora Cromados GT',   contacto: 'Pedro López',    telefono: '2222-3333', email: 'pedrolopez@cromados.gt' },
    { nombre: 'Pinturas y Químicos SA',      contacto: 'Rosa Gómez',     telefono: '2344-5566', email: 'ventas@pinturasgt.com' },
    { nombre: 'Ferretería El Maestro',       contacto: 'Juan Monterroso', telefono: '5511-2244', email: null },
    { nombre: 'Eléctricos del Norte',        contacto: 'Carlos Vásquez', telefono: '4455-6677', email: 'carlos@electrisnorte.gt' },
  ]

  const provMap: Record<string, string> = {}
  for (const prov of proveedoresData) {
    const existe = await prisma.proveedor.findFirst({ where: { nombre: prov.nombre } })
    if (existe) {
      provMap[prov.nombre] = existe.id
      console.log(`  ↩  ${prov.nombre}`)
    } else {
      const creado = await prisma.proveedor.create({ data: prov })
      provMap[prov.nombre] = creado.id
      console.log(`  ✓  ${prov.nombre}`)
    }
  }

  // ── Compras ───────────────────────────────────────────────────────────────
  console.log('\nCompras:')

  const comprasExistentes = await prisma.compra.count()
  if (comprasExistentes > 0) {
    console.log('  ↩  Ya hay compras registradas, omitiendo.')
  } else {
    // Compra 1 — Pinturas
    const c1 = await prisma.compra.create({
      data: {
        proveedorId: provMap['Pinturas y Químicos SA'],
        fecha: new Date('2026-04-10'),
        notas: 'Reabastecimiento mensual de pinturas',
        total: 0, // se calcula abajo
        lineas: {
          create: [
            { insumoId: insumoMap['Pintura sintética blanca'],  cantidad: 20, costoUnit: 195 },
            { insumoId: insumoMap['Pintura poliuretano negro'],  cantidad: 10, costoUnit: 285 },
            { insumoId: insumoMap['Thinner laca'],               cantidad: 15, costoUnit: 120 },
            { insumoId: insumoMap['Sellador epóxico'],           cantidad: 6,  costoUnit: 320 },
          ],
        },
      },
    })
    const total1 = 20*195 + 10*285 + 15*120 + 6*320
    await prisma.compra.update({ where: { id: c1.id }, data: { total: total1 } })
    console.log(`  ✓  Pinturas y Químicos SA — Q${total1.toLocaleString()}`)

    // Compra 2 — Ferretería
    const c2 = await prisma.compra.create({
      data: {
        proveedorId: provMap['Ferretería El Maestro'],
        fecha: new Date('2026-04-22'),
        notas: null,
        total: 0,
        lineas: {
          create: [
            { insumoId: insumoMap['Lija #80'],              cantidad: 200, costoUnit: 4.5 },
            { insumoId: insumoMap['Lija #120'],             cantidad: 100, costoUnit: 5 },
            { insumoId: insumoMap['Disco de corte 4.5"'],  cantidad: 50,  costoUnit: 18 },
            { insumoId: insumoMap['Soldadura E6011 3/32"'],cantidad: 100, costoUnit: 28 },
            { insumoId: insumoMap['Tornillos 1/4" x 1" (bolsa)'], cantidad: 30, costoUnit: 35 },
          ],
        },
      },
    })
    const total2 = 200*4.5 + 100*5 + 50*18 + 100*28 + 30*35
    await prisma.compra.update({ where: { id: c2.id }, data: { total: total2 } })
    console.log(`  ✓  Ferretería El Maestro — Q${total2.toLocaleString()}`)

    // Compra 3 — Eléctricos
    const c3 = await prisma.compra.create({
      data: {
        proveedorId: provMap['Eléctricos del Norte'],
        fecha: new Date('2026-05-05'),
        notas: 'Para trabajo Princesa Fernanda',
        total: 0,
        lineas: {
          create: [
            { insumoId: insumoMap['Cable eléctrico 12 AWG'], cantidad: 150, costoUnit: 6.5 },
            { insumoId: insumoMap['Cable eléctrico 10 AWG'], cantidad: 50,  costoUnit: 9 },
            { insumoId: insumoMap['Fusibles (caja 30 uds)'], cantidad: 5,   costoUnit: 85 },
            { insumoId: insumoMap['Luz LED doble'],          cantidad: 20,  costoUnit: 55 },
          ],
        },
      },
    })
    const total3 = 150*6.5 + 50*9 + 5*85 + 20*55
    await prisma.compra.update({ where: { id: c3.id }, data: { total: total3 } })
    console.log(`  ✓  Eléctricos del Norte — Q${total3.toLocaleString()}`)

    // Actualizar stock (simular que las compras ya entraron al inventario)
    // Las compras aquí son históricas — el stock ya está inicializado arriba con valores actuales
    // En producción el API lo hace automáticamente
    console.log('  ℹ  Stock inicializado directamente en insumos (seed histórico)')
  }

  // ── Consumos en trabajos ──────────────────────────────────────────────────
  console.log('\nConsumos:')

  const trabajo1 = await prisma.trabajo.findFirst({
    where: { nombreTransporte: 'Princesa Fernanda' },
  })
  const trabajo2 = await prisma.trabajo.findFirst({
    where: { nombreTransporte: 'El Torito' },
  })

  const consumosExistentes = await prisma.consumo.count()
  if (consumosExistentes > 0) {
    console.log('  ↩  Ya hay consumos, omitiendo.')
  } else {
    if (trabajo1) {
      const consumosPF = [
        { insumoId: insumoMap['Pintura sintética blanca'],   cantidad: 8,  costoUnit: 195, fecha: new Date('2026-05-03'), notas: 'Interior bus' },
        { insumoId: insumoMap['Pintura poliuretano negro'],  cantidad: 4,  costoUnit: 285, fecha: new Date('2026-05-03'), notas: 'Exterior' },
        { insumoId: insumoMap['Lija #80'],                   cantidad: 40, costoUnit: 4.5, fecha: new Date('2026-05-05'), notas: 'Preparación superficie' },
        { insumoId: insumoMap['Lija #220'],                  cantidad: 30, costoUnit: 5.5, fecha: new Date('2026-05-05'), notas: null },
        { insumoId: insumoMap['Soldadura E6011 3/32"'],      cantidad: 15, costoUnit: 28,  fecha: new Date('2026-05-08'), notas: 'Soldadura gradas' },
        { insumoId: insumoMap['Neolay (hule piso) metro'],   cantidad: 18, costoUnit: 75,  fecha: new Date('2026-05-10'), notas: 'Piso nuevo' },
        { insumoId: insumoMap['Cable eléctrico 12 AWG'],     cantidad: 60, costoUnit: 6.5, fecha: new Date('2026-05-12'), notas: 'Sistema eléctrico' },
        { insumoId: insumoMap['Luz LED doble'],               cantidad: 8,  costoUnit: 55,  fecha: new Date('2026-05-12'), notas: 'Luces interiores' },
        { insumoId: insumoMap['Thinner laca'],                cantidad: 3,  costoUnit: 120, fecha: new Date('2026-05-14'), notas: null },
      ]
      for (const c of consumosPF) {
        await prisma.consumo.create({ data: { trabajoId: trabajo1.id, ...c } })
        // Descontar stock
        await prisma.insumo.update({
          where: { id: c.insumoId },
          data: { stockActual: { decrement: c.cantidad } },
        })
      }
      console.log(`  ✓  ${consumosPF.length} consumos en "Princesa Fernanda"`)
    }

    if (trabajo2) {
      const consumosET = [
        { insumoId: insumoMap['Soldadura E7018 1/8"'],   cantidad: 10, costoUnit: 32,  fecha: new Date('2026-05-20'), notas: 'Trompa' },
        { insumoId: insumoMap['Disco de corte 4.5"'],    cantidad: 5,  costoUnit: 18,  fecha: new Date('2026-05-20'), notas: null },
        { insumoId: insumoMap['Pintura cromada aerosol'], cantidad: 6,  costoUnit: 45,  fecha: new Date('2026-05-22'), notas: 'Detalles cromados' },
      ]
      for (const c of consumosET) {
        await prisma.consumo.create({ data: { trabajoId: trabajo2.id, ...c } })
        await prisma.insumo.update({
          where: { id: c.insumoId },
          data: { stockActual: { decrement: c.cantidad } },
        })
      }
      console.log(`  ✓  ${consumosET.length} consumos en "El Torito"`)
    }
  }

  // ── Resumen ───────────────────────────────────────────────────────────────
  const totalInsumos = await prisma.insumo.count()
  const alertas = await prisma.insumo.findMany({
    where: {},
    select: { nombre: true, stockActual: true, stockMinimo: true },
  })
  const bajosStock = alertas.filter(i => Number(i.stockActual) <= Number(i.stockMinimo))

  console.log('\n✅  Seed de inventario completado.')
  console.log(`\n📦  ${totalInsumos} insumos en total`)
  console.log(`⚠️   ${bajosStock.length} insumos bajo stock mínimo:`)
  bajosStock.forEach(i => console.log(`     • ${i.nombre}: ${Number(i.stockActual)} / mín ${Number(i.stockMinimo)}`))
  console.log()
}

main()
  .catch(e => { console.error('❌ Error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
