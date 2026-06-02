import { PrismaClient } from '@prisma/client'
import { auth } from '../lib/auth'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@tallerbusesgt.com'
  const password = 'Admin1234!'

  // Verificar si ya existe
  const existe = await prisma.user.findUnique({ where: { email } })
  if (existe) {
    console.log('✓ El usuario admin ya existe, nada que hacer.')
    return
  }

  // Crear via better-auth para que la contraseña quede correctamente hasheada
  const ctx = await auth.api.signUpEmail({
    body: {
      name: 'Administrador',
      email,
      password,
    },
  })

  if (!ctx?.user) {
    throw new Error('No se pudo crear el usuario')
  }

  // Asignar rol ADMIN
  await prisma.user.update({
    where: { email },
    data: { rol: 'ADMIN', emailVerified: true },
  })

  console.log('✓ Usuario admin creado:')
  console.log('  Email:    ', email)
  console.log('  Password: ', password)
  console.log('')
  console.log('  ⚠️  Cambia la contraseña después de tu primer login.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
