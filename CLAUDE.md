# Taller Buses GT — Sistema de Gestión

## Contexto del negocio
Taller guatemalteco especializado en reconstrucción de buses escolares estadounidenses
para convertirlos en transporte extraurbano local. El sistema gestiona el ciclo completo:
desde que un cliente contacta hasta que el bus transformado es entregado.

## Roles
- **Admin**: acceso total — presupuestos, inventario privado, trabajos, clientes, compras, pagos
- **Cliente**: ve su historial, presupuestos, extras aprobados, pagos realizados y saldo pendiente.
  Los registra el admin. Pueden registrarse con Google solo para compras del catálogo público.

Sin roles de operario por ahora.

## Flujo principal de un trabajo
1. Cliente contacta → admin lo registra en el sistema
2. Admin crea presupuesto inicial
3. Cliente aprueba o rechaza
4. Si aprueba → trabajo pasa a "En curso"
5. Admin registra consumos de insumos (solo visible para admin)
6. Admin registra pagos parciales (visible para admin y cliente)
7. Si hay extras → se crean como presupuesto adicional (cliente los ve y los aprueba)
8. Trabajo completado → queda en historial del cliente

## Módulos

### Inventario
- **Stock privado** (solo admin): todo — tornillos, lija, pintura, luces, persianas, etc.
  Historial de consumo, alertas de reabastecimiento, reportes de gasto.
- **Stock público** (catálogo): solo productos vendibles — luces, persianas, accesorios.
  Con precio, foto (Cloudinary) y disponibilidad. No aparecen insumos internos.

### Presupuestos
- Solo admins los crean
- El inicial define el precio del trabajo completo
- Los extras son adiciones posteriores, el cliente los ve en su historial
- Los consumos de insumos internos nunca los ve el cliente

### Pagos parciales
- Se registran dentro del trabajo (fecha, monto, método, notas)
- Cliente ve: total presupuestado, pagos realizados, saldo pendiente
- Admin ve lo anterior más margen vs consumo de insumos

### Compras (empresa → proveedor)
- El admin registra compras de insumos
- Cada compra actualiza el stock privado
- Historial con fecha, proveedor, costo, cantidad

### Ventas directas (catálogo público)
- Clientes con Google OAuth pueden comprar productos del stock público
- Pago por transferencia o efectivo (sin pasarela por ahora)
- El admin confirma el pago manualmente

### Auditoría
- Log de acciones importantes: crear presupuesto, modificar stock, registrar pago, cerrar trabajo, etc.
- Quién hizo qué y cuándo

## Stack
- **Framework**: Next.js 14 (App Router) — front y back en el mismo repo
- **Base de datos**: PostgreSQL (Railway)
- **ORM**: Prisma
- **Auth**: better-auth (Google OAuth + email/password)
- **UI**: Tailwind CSS + shadcn/ui
- **Imágenes**: Cloudinary (solo URL en BD, nunca binarios)
- **Emails**: Resend
- **Deploy**: Railway
- **Local**: Docker Compose

## Estructura de carpetas objetivo
/app
  /api              ← Route Handlers (backend)
  /(public)         ← Home y catálogo público
  /(auth)           ← Login / registro
  /(dashboard)      ← Panel admin
  /(cliente)        ← Portal del cliente
/prisma
  schema.prisma
/components
/lib

## Convenciones
- TypeScript estricto en todo el proyecto
- Nombres de variables y comentarios en español (es el negocio del cliente)
- Rutas de API en inglés (convención REST)
- Los montos siempre en quetzales (GTQ), tipo Decimal en Prisma, nunca Float
- Las fechas siempre en UTC, se formatean al mostrar
- Nunca guardar binarios de imagen en la BD, solo URLs de Cloudinary

## Lo que NO hace el sistema (por ahora)
- Facturación fiscal (SAT / FEL)
- Pasarela de pago en línea
- Roles de operario
- App móvil nativa
