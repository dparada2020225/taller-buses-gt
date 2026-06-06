'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Plus, Minus, X, CheckCircle, Package, ArrowLeft } from 'lucide-react'
import { formatearMoneda } from '@/lib/utils'

interface Producto {
  id: string
  nombre: string
  descripcion: string | null
  unidad: string
  stockActual: string | number
  precioVenta: string | number | null
  imagenUrl: string | null
}

interface ItemCarrito {
  producto: Producto
  cantidad: number
}

const METODOS = [
  { value: 'EFECTIVO',      label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia bancaria' },
]

export function CatalogoCliente({ productos }: { productos: Producto[] }) {
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [carritoAbierto, setCarritoAbierto] = useState(false)
  const [metodo, setMetodo] = useState('TRANSFERENCIA')
  const [notas, setNotas] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  const totalItems = carrito.reduce((s, i) => s + i.cantidad, 0)
  const totalMonto = carrito.reduce(
    (s, i) => s + (Number(i.producto.precioVenta) * i.cantidad),
    0
  )

  function agregar(producto: Producto) {
    setCarrito(prev => {
      const existe = prev.find(i => i.producto.id === producto.id)
      if (existe) {
        return prev.map(i =>
          i.producto.id === producto.id
            ? { ...i, cantidad: Math.min(i.cantidad + 1, Number(i.producto.stockActual)) }
            : i
        )
      }
      return [...prev, { producto, cantidad: 1 }]
    })
  }

  function cambiarCantidad(id: string, delta: number) {
    setCarrito(prev =>
      prev
        .map(i =>
          i.producto.id === id
            ? { ...i, cantidad: Math.max(0, Math.min(i.cantidad + delta, Number(i.producto.stockActual))) }
            : i
        )
        .filter(i => i.cantidad > 0)
    )
  }

  function quitarDelCarrito(id: string) {
    setCarrito(prev => prev.filter(i => i.producto.id !== id))
  }

  async function confirmarPedido() {
    setEnviando(true)
    setError('')

    const res = await fetch('/api/ventas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lineas: carrito.map(i => ({ insumoId: i.producto.id, cantidad: i.cantidad })),
        metodo,
        notas,
      }),
    })

    if (res.status === 401) {
      // No hay sesión — guardar carrito en sessionStorage y redirigir a login
      sessionStorage.setItem('carrito_pendiente', JSON.stringify(carrito))
      window.location.href = '/login?redirect=/catalogo'
      return
    }

    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Error al procesar el pedido')
      setEnviando(false)
      return
    }

    setExito(true)
    setCarrito([])
    setEnviando(false)
  }

  if (exito) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center">
          <CheckCircle className="h-14 w-14 text-[#6DC424] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">¡Pedido recibido!</h2>
          <p className="text-sm text-gray-500 mb-6">
            Tu pedido fue registrado correctamente. El equipo del taller lo revisará y confirmará el pago a la brevedad.
          </p>
          <button
            onClick={() => { setExito(false); setCarritoAbierto(false); setNotas('') }}
            className="w-full rounded-lg bg-[#0f0f0f] py-2.5 text-sm font-semibold text-white hover:bg-[#1a1a1a] transition"
          >
            Seguir comprando
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header del catálogo */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-20">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Inicio
            </Link>
            <div className="h-4 w-px bg-gray-200" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Catálogo de productos</h1>
              <p className="text-xs text-gray-400">{productos.length} producto{productos.length !== 1 ? 's' : ''} disponible{productos.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-gray-500 hover:text-gray-900 transition hidden sm:block"
            >
              Ingresar
            </Link>

            <button
              onClick={() => setCarritoAbierto(true)}
              className="relative flex items-center gap-2 rounded-lg bg-[#0f0f0f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a1a1a] transition"
            >
              <ShoppingCart className="h-4 w-4" />
              Carrito
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-[#6DC424] text-white text-xs font-bold flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Grid de productos */}
      <div className="container mx-auto px-6 py-8">
        {productos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Package className="h-14 w-14 text-gray-200 mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Sin productos disponibles</h2>
            <p className="text-sm text-gray-400">El catálogo se actualizará pronto.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {productos.map(producto => {
              const itemCarrito = carrito.find(i => i.producto.id === producto.id)
              const stockDisponible = Number(producto.stockActual)
              const agotado = stockDisponible <= 0

              return (
                <div
                  key={producto.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
                >
                  {/* Imagen */}
                  <div className="relative h-44 bg-gray-100">
                    {producto.imagenUrl ? (
                      <Image
                        src={producto.imagenUrl}
                        alt={producto.nombre}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                    {agotado && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-800">
                          Agotado
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 mb-0.5">{producto.nombre}</h3>
                    {producto.descripcion && (
                      <p className="text-xs text-gray-400 mb-2 line-clamp-2">{producto.descripcion}</p>
                    )}
                    <p className="text-xs text-gray-400 mb-3">
                      Stock: {stockDisponible} {producto.unidad}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-base font-bold text-gray-900">
                        {formatearMoneda(Number(producto.precioVenta))}
                        <span className="text-xs font-normal text-gray-400"> / {producto.unidad}</span>
                      </span>

                      {itemCarrito ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => cambiarCantidad(producto.id, -1)}
                            className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
                          >
                            <Minus className="h-3.5 w-3.5 text-gray-600" />
                          </button>
                          <span className="text-sm font-semibold w-5 text-center">
                            {itemCarrito.cantidad}
                          </span>
                          <button
                            onClick={() => cambiarCantidad(producto.id, 1)}
                            disabled={itemCarrito.cantidad >= stockDisponible}
                            className="h-7 w-7 rounded-lg bg-[#6DC424] flex items-center justify-center hover:bg-[#5daa1e] transition disabled:opacity-40"
                          >
                            <Plus className="h-3.5 w-3.5 text-white" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => agregar(producto)}
                          disabled={agotado}
                          className="flex items-center gap-1.5 rounded-lg bg-[#0f0f0f] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1a1a1a] transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Plus className="h-3.5 w-3.5" /> Agregar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Panel del carrito (side drawer) */}
      {carritoAbierto && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setCarritoAbierto(false)} />
          <div className="w-full max-w-sm bg-white shadow-2xl flex flex-col">
            {/* Header carrito */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-gray-700" />
                <h2 className="text-base font-semibold text-gray-900">Tu pedido</h2>
              </div>
              <button onClick={() => setCarritoAbierto(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {carrito.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center text-gray-400">
                  <ShoppingCart className="h-10 w-10 text-gray-200 mb-3" />
                  <p className="text-sm">El carrito está vacío</p>
                </div>
              ) : (
                carrito.map(item => (
                  <div key={item.producto.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.producto.nombre}</p>
                      <p className="text-xs text-gray-400">
                        {formatearMoneda(Number(item.producto.precioVenta))} / {item.producto.unidad}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => cambiarCantidad(item.producto.id, -1)}
                        className="h-6 w-6 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-semibold w-5 text-center">{item.cantidad}</span>
                      <button
                        onClick={() => cambiarCantidad(item.producto.id, 1)}
                        disabled={item.cantidad >= Number(item.producto.stockActual)}
                        className="h-6 w-6 rounded bg-[#6DC424] flex items-center justify-center hover:bg-[#5daa1e] disabled:opacity-40"
                      >
                        <Plus className="h-3 w-3 text-white" />
                      </button>
                      <button
                        onClick={() => quitarDelCarrito(item.producto.id)}
                        className="ml-1 text-gray-300 hover:text-red-400 transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-20 text-right shrink-0">
                      {formatearMoneda(Number(item.producto.precioVenta) * item.cantidad)}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Checkout */}
            {carrito.length > 0 && (
              <div className="border-t border-gray-100 p-5 space-y-4">
                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Método de pago</label>
                  <select
                    value={metodo}
                    onChange={e => setMetodo(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424]"
                  >
                    {METODOS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notas (opcional)</label>
                  <textarea
                    value={notas}
                    onChange={e => setNotas(e.target.value)}
                    rows={2}
                    placeholder="Dirección de entrega, instrucciones..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6DC424] resize-none"
                  />
                </div>

                <div className="flex items-center justify-between text-sm font-semibold text-gray-900 py-1">
                  <span>Total</span>
                  <span className="text-base">{formatearMoneda(totalMonto)}</span>
                </div>

                <p className="text-xs text-gray-400">
                  El pago se confirma manualmente. Necesitas tener una cuenta para continuar.
                </p>

                <button
                  onClick={confirmarPedido}
                  disabled={enviando}
                  className="w-full rounded-lg bg-[#6DC424] py-2.5 text-sm font-semibold text-white hover:bg-[#5daa1e] transition disabled:opacity-50"
                >
                  {enviando ? 'Procesando...' : 'Confirmar pedido'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
