import { BellRing, Check, Clock, Play } from 'lucide-react'
import type { IncomingOrderEvent } from '../../api/types'
import { formatUsdc, truncateAddress } from '../utils/formatters'

export type OrderAlertPhase = 'idle' | 'incoming' | 'waiting_payment'

interface LiveOrderAlertSectionProps {
  phase: OrderAlertPhase
  activeOrder: IncomingOrderEvent | null
  isAccepting: boolean
  isMockSse: boolean
  onAcceptOrder: (order: IncomingOrderEvent) => void
  onSimulateIncomingOrder: () => void
  onSimulatePaymentConfirmed: () => void
}

export function LiveOrderAlertSection({
  phase,
  activeOrder,
  isAccepting,
  isMockSse,
  onAcceptOrder,
  onSimulateIncomingOrder,
  onSimulatePaymentConfirmed,
}: LiveOrderAlertSectionProps) {
  return (
    <section
      aria-labelledby="live-order-alert-heading"
      className="floating-card rounded-2xl p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400 text-neutral-900">
            <BellRing className="h-4 w-4" />
          </div>
          <div>
            <h2
              id="live-order-alert-heading"
              className="text-base font-semibold text-neutral-900"
            >
              Alertas de orden de compra (SSE)
            </h2>
            <p className="text-xs text-neutral-500">
              Recibe órdenes en vivo cuando un cliente escanea un producto
            </p>
          </div>
        </div>

        {isMockSse && phase === 'idle' && (
          <button
            id="btn-simulate-sse-order"
            type="button"
            onClick={onSimulateIncomingOrder}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors hover:border-yellow-400 hover:bg-yellow-50 hover:text-neutral-900 cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 text-yellow-600" />
            <span>Simular alerta SSE</span>
          </button>
        )}
      </div>

      {phase === 'idle' && (
        <div className="mt-4 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/70 px-4 py-6 text-center">
          <p className="text-sm font-medium text-neutral-700">
            Escuchando nuevas órdenes de compra...
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Cuando un cliente seleccione un producto, aparecerá aquí con su código y características para que lo aceptes.
          </p>
        </div>
      )}

      {activeOrder && (phase === 'incoming' || phase === 'waiting_payment') && (
        <div className="mt-4 rounded-xl border border-yellow-300 bg-yellow-50/40 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-yellow-400 px-2 py-0.5 font-mono text-xs font-bold text-neutral-900">
                  {activeOrder.productCode}
                </span>
                <span className="font-mono text-xs text-neutral-500">
                  Orden #{activeOrder.orderId}
                </span>
              </div>
              <h3 className="mt-2 text-base font-bold text-neutral-900">
                {activeOrder.productName}
              </h3>
              <p className="mt-0.5 text-xs text-neutral-600">
                {activeOrder.description}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xs text-neutral-500">Cliente</p>
              <p className="text-sm font-semibold text-neutral-900">
                {activeOrder.buyerName}
              </p>
              <p className="font-mono text-[11px] text-neutral-500">
                {truncateAddress(activeOrder.buyerWallet)}
              </p>
            </div>
          </div>

          {activeOrder.specs.length > 0 && (
            <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {activeOrder.specs.map((spec) => (
                <div
                  key={spec.label}
                  className="rounded-lg border border-neutral-200/80 bg-white px-3 py-2 text-xs"
                >
                  <dt className="text-[11px] text-neutral-500">{spec.label}</dt>
                  <dd className="mt-0.5 font-semibold text-neutral-900">
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-4 flex flex-col gap-3 border-t border-yellow-200/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
              <span>
                Total:{' '}
                <strong className="font-mono text-neutral-900">
                  {formatUsdc(activeOrder.totalPriceUsdc)}
                </strong>
              </span>
              <span>
                Entrada 50%:{' '}
                <strong className="font-mono text-neutral-900">
                  {formatUsdc(activeOrder.downPaymentUsdc)}
                </strong>
              </span>
              <span className="text-neutral-600">
                {activeOrder.installmentsCount} cuotas de{' '}
                <strong className="font-mono text-neutral-900">
                  {formatUsdc(activeOrder.installmentAmountUsdc)}
                </strong>
              </span>
            </div>

            {phase === 'incoming' ? (
              <button
                id="btn-accept-order"
                type="button"
                disabled={isAccepting}
                onClick={() => onAcceptOrder(activeOrder)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-neutral-900 shadow-xs transition-colors hover:bg-yellow-300 disabled:opacity-50 cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>{isAccepting ? 'Aceptando...' : 'Aceptar'}</span>
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-yellow-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800">
                  <Clock className="h-3.5 w-3.5 text-yellow-600" />
                  Esperando pago del cliente (SSE)...
                </span>
                {isMockSse && (
                  <button
                    id="btn-simulate-sse-payment"
                    type="button"
                    onClick={onSimulatePaymentConfirmed}
                    className="rounded-lg bg-neutral-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-neutral-800 cursor-pointer"
                  >
                    Simular pago recibido
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
