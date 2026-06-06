'use client'

import { useState, useRef } from 'react'
import { X, ImageIcon, Loader2 } from 'lucide-react'

interface Props {
  value: string
  onChange: (url: string) => void
  disabled?: boolean
}

const CLOUD_NAME    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

export function ImageUpload({ value, onChange, disabled }: Props) {
  const inputRef                  = useRef<HTMLInputElement>(null)
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

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      setError('Cloudinary no está configurado (falta NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET)')
      return
    }

    setUploading(true)
    setError('')

    try {
      // Subir directo a Cloudinary con unsigned preset — sin pasar por el servidor
      const formData = new FormData()
      formData.append('file',           file)
      formData.append('upload_preset',  UPLOAD_PRESET)

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      )

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error?.message ?? 'Error al subir la imagen')
      }

      const data = await res.json()
      setPreview(data.secure_url)
      onChange(data.secure_url)
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
        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Vista previa" className="w-full h-full object-cover" />
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
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          className={`
            flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed transition cursor-pointer
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

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
