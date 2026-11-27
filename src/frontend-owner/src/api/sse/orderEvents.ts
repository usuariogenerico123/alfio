import type {
  IncomingOrderEvent,
  PaymentConfirmedEvent,
} from '../types'
import { buildSseUrl, isRemoteApiConfigured, SSE_ROUTES } from './sseConfig'

export type SseConnectionState = 'connected' | 'connecting' | 'mock' | 'error'

type OrderListener = (order: IncomingOrderEvent) => void
type PaymentListener = (payment: PaymentConfirmedEvent) => void

// Canal local para pruebas cuando el backend SSE aún no está conectado
const mockOrderListeners = new Set<OrderListener>()
const mockPaymentListeners = new Map<string, Set<PaymentListener>>()

/**
 * Suscribe al flujo SSE de alertas de órdenes de compra entrantes.
 */
export function subscribeToOrderAlerts(handlers: {
  onOrder: OrderListener
  onStatusChange?: (status: SseConnectionState) => void
}): () => void {
  if (!isRemoteApiConfigured) {
    mockOrderListeners.add(handlers.onOrder)
    handlers.onStatusChange?.('mock')
    return () => {
      mockOrderListeners.delete(handlers.onOrder)
    }
  }

  handlers.onStatusChange?.('connecting')
  const source = new EventSource(buildSseUrl(SSE_ROUTES.orderAlerts))

  source.onopen = () => {
    handlers.onStatusChange?.('connected')
  }

  const handlePayload = (rawData: string) => {
    try {
      const parsed = JSON.parse(rawData) as IncomingOrderEvent
      handlers.onOrder(parsed)
    } catch {
      // Ignorar eventos malformados
    }
  }

  source.onmessage = (event) => handlePayload(event.data)
  source.addEventListener('order_created', (event) => {
    handlePayload((event as MessageEvent<string>).data)
  })

  source.onerror = () => {
    handlers.onStatusChange?.('error')
  }

  return () => {
    source.close()
  }
}

/**
 * Suscribe al segundo flujo SSE que espera la confirmación de pago de una orden aceptada.
 */
export function subscribeToOrderPayment(
  orderId: string,
  handlers: {
    onPaymentConfirmed: PaymentListener
    onError?: () => void
  },
): () => void {
  if (!isRemoteApiConfigured) {
    const listeners = mockPaymentListeners.get(orderId) ?? new Set<PaymentListener>()
    listeners.add(handlers.onPaymentConfirmed)
    mockPaymentListeners.set(orderId, listeners)

    return () => {
      const set = mockPaymentListeners.get(orderId)
      if (!set) return
      set.delete(handlers.onPaymentConfirmed)
      if (set.size === 0) mockPaymentListeners.delete(orderId)
    }
  }

  const url = buildSseUrl(SSE_ROUTES.paymentConfirmations(orderId))
  const source = new EventSource(url)

  const handlePayload = (rawData: string) => {
    try {
      const parsed = JSON.parse(rawData) as PaymentConfirmedEvent
      handlers.onPaymentConfirmed(parsed)
      source.close()
    } catch {
      // Ignorar eventos malformados
    }
  }

  source.onmessage = (event) => handlePayload(event.data)
  source.addEventListener('order_paid', (event) => {
    handlePayload((event as MessageEvent<string>).data)
  })

  source.onerror = () => {
    handlers.onError?.()
  }

  return () => {
    source.close()
  }
}

/**
 * Helper de prueba local: emite una alerta de orden simulada por el canal SSE mock.
 */
export function emitMockOrderAlert(order: IncomingOrderEvent): void {
  mockOrderListeners.forEach((listener) => listener(order))
}

/**
 * Helper de prueba local: emite la confirmación de pago por la segunda ruta SSE mock.
 */
export function emitMockPaymentConfirmed(payment: PaymentConfirmedEvent): void {
  const listeners = mockPaymentListeners.get(payment.orderId)
  if (!listeners) return
  listeners.forEach((listener) => listener(payment))
}
