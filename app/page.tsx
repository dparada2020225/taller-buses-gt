import { redirect } from 'next/navigation'

export default function Home() {
  // TODO: verificar sesión y redirigir a dashboard o login
  redirect('/login')
}
