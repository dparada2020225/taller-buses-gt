'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react'

interface Props {
  value: string        // URL actual
  onChange: (url: string) => void
  disabled?: boolean
}

export function ImageUpload({ value, onChange, disabled }: Props) {
  const inputRef              = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState('')
  const [preview, setPreview]     = useState(value)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar 5 MB')
      return
    }

    setUploading(true)
    setError('')

    try {
      // 1. Obtener firma del servidor
      const sigRes = await fetch('/api/imagenes', { method: 'POST' })
      if (!sigRes.ok) throw new Error('Error al firmar la subida')
      const { timestamp, signature, folder, cloudName, apiKey } = await sigRes.json()

      // 2. Subir directamente a Cloudinary (sin pasar por Railway)
      const formData = new FormData()
      formData.append('file',      file)
      formData.append('timestamp', String(timestamp))
      formData.append('signature', signature)
      formData.append('folder',    folder)
      formData.append('api_key',   apiKey)

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      )
      if (!uploadRes.ok) throw new Error('Error al subir la imagen')

      const data = await uploadRes.json()
      const url: string = data.secure_url

      setPreview(url)
      onChange(url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function quitar() {
    setPreview('')
    onChange('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      {preview ? (
        /* Vista previa con botón de quitar */
        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200 group">
          <Image
            src={preview}
            alt="Vista previa"
            fill
            className="object-cover"
          />
          {!disabled && (
            <button
              type="button"
              onClick={quitar}
              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        /* Zona de drag & drop */
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed transition cursor-pointer
            ${disabled || uploading
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-[#6DC424] hover:bg-[#6DC424]/5'
            }
          `}
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 text-[#6DC424] animate-spin mb-2" />
              <p className="text-xs text-gray-400">Subiendo imagen...</p>
            </>
          ) : (
            <>
              <ImageIcon className="h-6 w-6 text-gray-300 mb-2" />
              <p className="text-xs text-gray-500 font-medium">
                Arrastra una imagen o <span className="text-[#6DC424]">haz clic aquí</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, WebP · máx. 5 MB</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
            disabled={disabled || uploading}
          />
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
