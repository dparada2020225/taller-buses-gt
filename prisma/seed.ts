/**
 * Seed de desarrollo — Taller Buses GT
 *
 * Crea:
 *   - 1 admin
 *   - 2 clientes
 *   - 2 trabajos con presupuestos completos (secciones + líneas)
 *   - Pagos parciales
 *
 * Uso:  docker compose exec app npx tsx prisma/seed.ts
 * Es idempotente: puede correrse varias veces sin duplicar datos.
 */

import { PrismaClient, Rol } from '@prisma/client'
import { auth } from '../lib/auth'

const prisma = new PrismaClient()

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function crearUsuario(nombre: string, email: string, password: string, rol: Rol) {
  const existe = await prisma.user.findUnique({ where: { email } })
  if (existe) {
    console.log(`  ↩  ${email} ya existe`)
    return existe
  }

  const resultado = await auth.api.signUpEmail({ body: { name: nombre, email, password } })
  if (!resultado?.user?.id) throw new Error(`No se pudo crear ${email}`)

  const usuario = await prisma.user.update({
    where: { id: resultado.user.id },
    data: { rol, emailVerified: true },
  })

  console.log(`  ✓  ${rol} creado: ${email}`)
  return usuario
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱  Iniciando seed...\n')

  // ── Usuarios ──────────────────────────────────────────────────────────────
  console.log('Usuarios:')
  const admin = await crearUsuario('Nelson Parada', 'admin@tallerbusesgt.com', 'Admin1234!', 'ADMIN')
  const cliente1 = await crearUsuario('Elías Sip', 'elias.sip@gmail.com', 'Cliente123!', 'CLIENTE')
  const cliente2 = await crearUsuario('Marcos Ajú', 'marcos.aju@gmail.com', 'Cliente123!', 'CLIENTE')

  await prisma.user.updateMany({
    where: { id: { in: [cliente1.id, cliente2.id] } },
    data: {},
  })
  // Teléfonos
  await prisma.user.update({ where: { id: cliente1.id }, data: { telefono: '5331-2311' } })
  await prisma.user.update({ where: { id: cliente2.id }, data: { telefono: '4567-8901' } })

  // ── Trabajo 1 — Elías Sip (Princesa Fernanda) ─────────────────────────────
  console.log('\nTrabajos:')
  let trabajo1 = await prisma.trabajo.findFirst({ where: { clienteId: cliente1.id } })
  if (!trabajo1) {
    trabajo1 = await prisma.trabajo.create({
      data: {
        clienteId: cliente1.id,
        descripcion: 'Reconversión completa bus escolar',
        nombreTransporte: 'Princesa Fernanda',
        noPlaca: 'GT-123ABC',
        estado: 'EN_CURSO',
      },
    })
    console.log('  ✓  Trabajo "Princesa Fernanda" creado')

    // Presupuesto inicial
    await prisma.presupuesto.create({
      data: {
        trabajoId: trabajo1.id,
        tipo: 'INICIAL',
        estado: 'APROBADO',
        montoTotal: 105000,
        aprobadoEn: new Date(),
        secciones: {
          create: [
            {
              nombre: 'ADENTRO',
              orden: 0,
              lineas: {
                create: [
                  { descripcion: 'Pintura por dentro (sintético)', monto: 4500, orden: 0 },
                  { descripcion: 'Paqueteras cromadas nuevas', monto: 8500, orden: 1 },
                  { descripcion: 'Pasamanos modernos (curvos)', monto: 2000, orden: 2 },
                  { descripcion: 'Juego de sillas nuevas (gris con negro)', monto: 17000, orden: 3 },
                  { descripcion: 'Neolay nuevo (hule piso)', monto: 4500, orden: 4 },
                  { descripcion: 'Silla piloto (de aire)', monto: 1200, orden: 5 },
                  { descripcion: 'Gradas cromadas y reparación estribo', monto: 1850, orden: 6 },
                ],
              },
            },
            {
              nombre: 'AFUERA',
              orden: 1,
              lineas: {
                create: [
                  { descripcion: 'Pintura por fuera (poliuretano)', monto: 9000, orden: 0 },
                  {
                    descripcion: 'Adornos cromados',
                    monto: 7500,
                    orden: 1,
                    subItems: '* Franja * Aletas * Faldas * Vicera tecolotes * Juego de abanicos',
                  },
                  { descripcion: 'Parrilla cromada con lámina gruesa', monto: 13000, orden: 2 },
                  { descripcion: 'Abollones (todos los golpes)', monto: 2500, orden: 3 },
                  { descripcion: 'Vidrios delanteros curvos (windshield)', monto: 2500, orden: 4 },
                  { descripcion: 'Combo de luces', monto: 6500, orden: 5, subItems: '* 5 luces interiores * 8 luces de tecolotes * 2 luces placa' },
                  { descripcion: 'Sistema eléctrico más accesorios', monto: 7000, orden: 6 },
                ],
              },
            },
            {
              nombre: 'ACCESORIOS',
              orden: 2,
              lineas: {
                create: [
                  { descripcion: '4 aros de aluminio nuevos', monto: 10500, orden: 0 },
                  { descripcion: 'Retrovisores grandes cromados c/luz', monto: 5500, orden: 1 },
                  { descripcion: '6 llantas nuevas 22.5x11 (inglesas)', monto: 10000, orden: 2 },
                  { descripcion: 'Bocina de aire (HARLEY DAVIDSON)', monto: 7000, orden: 3 },
                ],
              },
            },
          ],
        },
      },
    })
    console.log('  ✓  Presupuesto Princesa Fernanda creado (APROBADO)')

    // Pagos parciales
    await prisma.pago.createMany({
      data: [
        { trabajoId: trabajo1.id, monto: 30000, metodo: 'TRANSFERENCIA', fecha: new Date('2026-05-01'), notas: 'Anticipo inicial' },
        { trabajoId: trabajo1.id, monto: 20000, metodo: 'EFECTIVO', fecha: new Date('2026-05-15'), notas: 'Segundo abono' },
      ],
    })
    console.log('  ✓  Pagos parciales creados (Q50,000 de Q105,000)')
  } else {
    console.log('  ↩  Trabajo "Princesa Fernanda" ya existe')
  }

  // ── Trabajo 2 — Marcos Ajú (El Torito) ───────────────────────────────────
  let trabajo2 = await prisma.trabajo.findFirst({ where: { clienteId: cliente2.id } })
  if (!trabajo2) {
    trabajo2 = await prisma.trabajo.create({
      data: {
        clienteId: cliente2.id,
        descripcion: 'Reconversión bus extraurbano',
        nombreTransporte: 'El Torito',
        noPlaca: 'GT-456DEF',
        estado: 'COTIZACION',
      },
    })
    console.log('  ✓  Trabajo "El Torito" creado')

    await prisma.presupuesto.create({
      data: {
        trabajoId: trabajo2.id,
        tipo: 'INICIAL',
        estado: 'PENDIENTE',
        montoTotal: 68500,
        secciones: {
          create: [
            {
              nombre: 'TROMPA',
              orden: 0,
              lineas: {
                create: [
                  { descripcion: 'Persiana cromada', monto: 17000, orden: 0 },
                  { descripcion: 'Bumper delantero', monto: 8500, orden: 1 },
                  { descripcion: 'Silvines cascadia', monto: 6500, orden: 2 },
                  { descripcion: 'Entradas de aire', monto: 3800, orden: 3 },
                  { descripcion: 'Mano de obra instalación', monto: 5000, orden: 4 },
                ],
              },
            },
            {
              nombre: 'MECÁNICA',
              orden: 1,
              lineas: {
                create: [
                  { descripcion: 'Motor', monto: null, orden: 0 },
                  { descripcion: 'Panal de radiador (nuevo)', monto: 6000, orden: 1 },
                  { descripcion: 'Bajar caja', monto: 1500, orden: 2 },
                  { descripcion: 'Canasta nueva', monto: 5500, orden: 3 },
                  { descripcion: 'Aceite de caja', monto: 850, orden: 4 },
                  { descripcion: 'Volante', monto: null, orden: 5 },
                ],
              },
            },
            {
              nombre: 'AUDIO',
              orden: 2,
              lineas: {
                create: [
                  { descripcion: 'Radio PIONEER (no pantalla)', monto: 1800, orden: 0 },
                  { descripcion: 'Televisor 32"', monto: 2500, orden: 1 },
                  { descripcion: '4 bocinas PIONEER 6x9', monto: 1900, orden: 2 },
                  { descripcion: '1 amplificador para buffer', monto: 2800, orden: 3 },
                  { descripcion: 'Mano de obra', monto: 1500, orden: 4 },
                ],
              },
            },
          ],
        },
      },
    })
    console.log('  ✓  Presupuesto El Torito creado (PENDIENTE de aprobación)')
  } else {
    console.log('  ↩  Trabajo "El Torito" ya existe')
  }

  // ── Insumos de ejemplo ────────────────────────────────────────────────────
  console.log('\nInsumos:')
  const insumosEjemplo = [
    { nombre: 'Pintura sintética blanca', unidad: 'galón', stockActual: 24, stockMinimo: 10, esPublico: false },
    { nombre: 'Pintura poliuretano negro', unidad: 'galón', stockActual: 8, stockMinimo: 5, esPublico: false },
    { nombre: 'Lija #80', unidad: 'pliego', stockActual: 150, stockMinimo: 50, esPublico: false },
    { nombre: 'Lija #220', unidad: 'pliego', stockActual: 200, stockMinimo: 50, esPublico: false },
    {
      nombre: 'Luz LED doble',
      unidad: 'unidad',
      stockActual: 45,
      stockMinimo: 20,
      esPublico: true,
      precioVenta: 85,
    },
    {
      nombre: 'Persiana cromada 12 luces',
      unidad: 'unidad',
      stockActual: 3,
      stockMinimo: 2,
      esPublico: true,
      precioVenta: 17000,
    },
    { nombre: 'Neolay (hule piso) metro', unidad: 'metro', stockActual: 120, stockMinimo: 30, esPublico: false },
    { nombre: 'Soldadura E6011', unidad: 'libra', stockActual: 80, stockMinimo: 20, esPublico: false },
  ]

  for (const insumo of insumosEjemplo) {
    const existe = await prisma.insumo.findFirst({ where: { nombre: insumo.nombre } })
    if (!existe) {
      await prisma.insumo.create({ data: { ...insumo, stockActual: insumo.stockActual, stockMinimo: insumo.stockMinimo } })
      console.log(`  ✓  ${insumo.nombre}`)
    } else {
      console.log(`  ↩  ${insumo.nombre} ya existe`)
    }
  }

  // ── Proveedor de ejemplo ──────────────────────────────────────────────────
  console.log('\nProveedores:')
  const provExiste = await prisma.proveedor.findFirst({ where: { nombre: 'Distribuidora Cromados GT' } })
  if (!provExiste) {
    await prisma.proveedor.create({
      data: {
        nombre: 'Distribuidora Cromados GT',
        contacto: 'Pedro López',
        telefono: '2222-3333',
        email: 'pedrolopez@cromados.gt',
      },
    })
    console.log('  ✓  Distribuidora Cromados GT')
  } else {
    console.log('  ↩  Proveedor ya existe')
  }

  console.log('\n✅  Seed completado.\n')
  console.log('Credenciales de acceso:')
  console.log('  Admin  →  admin@tallerbusesgt.com  /  Admin1234!')
  console.log('  Cliente 1  →  elias.sip@gmail.com  /  Cliente123!')
  console.log('  Cliente 2  →  marcos.aju@gmail.com  /  Cliente123!\n')
}

main()
  .catch((e) => { console.error('❌ Error en seed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
