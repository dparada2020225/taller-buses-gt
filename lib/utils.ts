import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea un monto en quetzales guatemaltecos.
 * Siempre muestra 2 decimales y el símbolo Q.
 */
export function formatearMoneda(monto: number | string): string {
  const numero = typeof monto === 'string' ? parseFloat(monto) : monto
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2,
  }).format(numero)
}

/**
 * Formatea una fecha UTC para mostrar en Guatemala (zona horaria América/Guatemala).
 */
export function formatearFecha(fecha: Date | string): string {
  return new Intl.DateTimeFormat('es-GT', {
    timeZone: 'America/Guatemala',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(fecha))
}

export function formatearFechaHora(fecha: Date | string): string {
  return new Intl.DateTimeFormat('es-GT', {
    timeZone: 'America/Guatemala',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(fecha))
}
