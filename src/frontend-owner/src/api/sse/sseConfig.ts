import {
  IS_REMOTE_API_CONFIGURED,
  RUTA_SSE_ORDENES,
  RUTA_SSE_PAGOS,
} from '../paths.js'

/**
 * Rutas SSE configurables para el backend en Go/Gin (declaradas en api/paths.js).
 */
export const SSE_ROUTES = {
  /** Stream donde llegan las alertas de nuevas órdenes de compra */
  orderAlerts: RUTA_SSE_ORDENES,

  /** Stream donde llega la confirmación de pago de una orden aceptada */
  paymentConfirmations: (orderId: string) => RUTA_SSE_PAGOS(orderId),
} as const

export function buildSseUrl(url: string): string {
  return url
}

export const isRemoteApiConfigured = IS_REMOTE_API_CONFIGURED
