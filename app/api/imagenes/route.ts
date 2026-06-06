/**
 * POST /api/imagenes
 * Genera una firma para subir directamente a Cloudinary desde el cliente.
 * El binario NUNCA pasa por el servidor — solo la firma.
 */
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST() {
  const session = await getSession()
  if (!session || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const timestamp = Math.round(Date.now() / 1000)
  const folder    = 'taller-buses-gt/productos'

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder, overwrite: true },
    process.env.CLOUDINARY_API_SECRET!
  )

  return NextResponse.json({
    timestamp,
    signature,
    folder,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    apiKey:    process.env.CLOUDINARY_API_KEY,
  })
}

/**
 * DELETE /api/imagenes?publicId=xxx
 * Elimina una imagen de Cloudinary cuando se reemplaza o se borra el insumo.
 */
export async function DELETE(req: Request) {
  const session = await getSession()
  if (!session || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const publicId = searchParams.get('publicId')
  if (!publicId) return NextResponse.json({ error: 'publicId requerido' }, { status: 400 })

  await cloudinary.uploader.destroy(publicId)
  return NextResponse.json({ ok: true })
}
