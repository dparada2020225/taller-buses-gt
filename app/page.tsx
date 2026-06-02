import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'

export default async function Home() {
  const session = await getSession()

  if (!session) redirect('/login')
  if (session.user.rol === 'ADMIN') redirect('/dashboard')
  redirect('/inicio')
}
