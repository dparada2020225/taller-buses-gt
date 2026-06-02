# Taller Buses GT — Sistema de Gestión

Sistema interno de gestión de trabajos, inventario y clientes para **Reconstructora Antigua Jr.**

---

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (incluye Docker Compose)
- Git

No necesitas Node.js, npm ni PostgreSQL instalados localmente. Todo corre dentro de Docker.

---

## Levantar el proyecto

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd taller-buses-gt

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Levantar todo (primera vez tarda ~2 min mientras instala dependencias)
docker compose up -d --build

# 4. Abrir en el navegador
# http://localhost:3000
```

Al iniciar, el contenedor automáticamente:
- Genera el cliente de Prisma
- Aplica el schema a la base de datos
- Inicia Next.js en modo desarrollo con hot reload

### Levantar sin reconstruir (uso diario)

```bash
docker compose up -d
```

### Apagar

```bash
docker compose down
```

> Los datos de PostgreSQL persisten en un volumen Docker aunque bajes los contenedores.
> Para borrar también los datos: `docker compose down -v`

---

## Primer acceso

1. Ve a **http://localhost:3000/registro**
2. Crea tu cuenta — el **primer usuario registrado queda como ADMIN** automáticamente
3. Serás redirigido al panel de administración en **http://localhost:3000/dashboard**

A partir del segundo registro, los usuarios quedan como CLIENTE y solo el admin puede asignarles trabajos.

---

## Comandos útiles

### Ver logs en tiempo real

```bash
docker compose logs -f app
```

### Ver logs de la base de datos

```bash
docker compose logs -f postgres
```

### Abrir Prisma Studio (explorador visual de la BD)

```bash
docker compose exec app npx prisma studio --hostname 0.0.0.0
# Luego abrir http://localhost:5555
# Cerrar con Ctrl+C (el servidor sigue corriendo)
```

### Correr migraciones (cuando cambia prisma/schema.prisma)

```bash
# Desarrollo rápido (no genera archivos de migración)
docker compose exec app npm run db:push

# Antes de deploy a Railway (genera archivos de migración versionados)
docker compose exec app npm run db:migrate
```

### Abrir una shell dentro del contenedor

```bash
docker compose exec app sh
```

---

## Variables de entorno

Copia `.env.example` a `.env` y completa los valores necesarios.

| Variable | Descripción | Requerida para |
|---|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL | Siempre |
| `BETTER_AUTH_SECRET` | Secreto para firmar sesiones (mín. 32 chars) | Siempre |
| `BETTER_AUTH_URL` | URL base de la app | Siempre |
| `GOOGLE_CLIENT_ID` | OAuth de Google | Login con Google |
| `GOOGLE_CLIENT_SECRET` | OAuth de Google | Login con Google |
| `CLOUDINARY_*` | Subida de imágenes | Catálogo público |
| `RESEND_API_KEY` | Envío de emails | Emails transaccionales |

> En desarrollo local `DATABASE_URL` usa `postgres` como host (nombre del servicio Docker), no `localhost`.

---

## Estructura del proyecto

```
/app
  /api                  ← Route Handlers (backend REST)
    /auth               ← better-auth + registro custom
    /clientes           ← CRUD clientes
  /(public)             ← Home y catálogo público (sin auth)
  /(auth)               ← Login y registro
  /(dashboard)          ← Panel admin (rol ADMIN)
  /(cliente)            ← Portal cliente (rol CLIENTE)

/components
  /auth                 ← LoginForm, RegistroForm
  /clientes             ← ClientesTabla, NuevoClienteDialog
  /dashboard            ← Sidebar, Topbar

/lib
  auth.ts               ← Configuración de better-auth (server)
  auth-client.ts        ← Cliente de better-auth (browser)
  prisma.ts             ← Singleton de PrismaClient
  session.ts            ← Helper para obtener sesión en Server Components
  utils.ts              ← cn(), formatearMoneda(), formatearFecha()

/prisma
  schema.prisma         ← Schema de base de datos
  seed.ts               ← Script para crear usuario admin inicial
```

---

## Roles

| Rol | Acceso |
|---|---|
| `ADMIN` | Todo: presupuestos, inventario, trabajos, clientes, compras, pagos |
| `CLIENTE` | Solo su historial, presupuestos propios, pagos y saldo |

---

## Flujo de un trabajo

```
Cliente contacta
  → Admin lo registra en el sistema
  → Admin crea presupuesto inicial
  → Cliente aprueba o rechaza
  → Si aprueba → trabajo pasa a "En curso"
  → Admin registra consumos de insumos (solo visible para admin)
  → Admin registra pagos parciales
  → Si hay extras → presupuesto adicional (cliente lo ve y aprueba)
  → Trabajo completado → queda en historial del cliente
```

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14 (App Router) |
| Base de datos | PostgreSQL 16 |
| ORM | Prisma |
| Auth | better-auth |
| UI | Tailwind CSS + shadcn/ui |
| Imágenes | Cloudinary |
| Emails | Resend |
| Deploy | Railway |
| Dev | Docker Compose |

---

## Deploy a Railway

1. Crear proyecto en [Railway](https://railway.app)
2. Agregar servicio PostgreSQL
3. Conectar el repositorio de GitHub
4. Configurar las variables de entorno del `.env.example`
5. Cambiar `DATABASE_URL` para apuntar al PostgreSQL de Railway
6. Railway detecta Next.js automáticamente y hace el build

Antes del primer deploy correr las migraciones versionadas:
```bash
docker compose exec app npm run db:migrate
```
