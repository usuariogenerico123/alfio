import { CheckCircle2, X } from 'lucide-react'
import type { PaymentConfirmedEvent } from '../../api/types'
import { formatUsdc } from '../utils/formatters'

interface PaymentPaidModalProps {
  payment: PaymentConfirmedEvent | null
  onClose: () => void
}

export function PaymentPaidModal({ payment, onClose }: PaymentPaidModalProps) {
  if (!payment) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-paid-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4 backdrop-blur-[2px]"
    >
      <div className="floating-card w-full max-w-md rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-400 text-neutral-900">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <button
            id="btn-close-paid-modal"
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2
          id="payment-paid-modal-title"
          className="mt-4 text-xl font-bold text-neutral-900"
        >
          Pagado
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          El pago inicial fue confirmado en Stellar y el producto se añadió a{' '}
          <strong className="text-neutral-900">Productos vendidos</strong>.
        </p>

        <div className="mt-4 space-y-2 rounded-xl border border-neutral-100 bg-neutral-50 p-4 text-xs">
          <div className="flex justify-between">
            <span className="text-neutral-500">Producto</span>
            <span className="font-semibold text-neutral-900">{payment.productName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Código</span>
            <span className="font-mono text-neutral-800">{payment.productCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Cliente</span>
            <span className="font-medium text-neutral-900">{payment.buyerName}</span>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-2">
            <span className="text-neutral-600">Entrada recibida (50%)</span>
            <span className="font-mono font-bold text-neutral-900">
              {formatUsdc(payment.amountPaidUsdc)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Hash TX</span>
            <span className="font-mono text-neutral-600">{payment.txHash}</span>
          </div>
        </div>

        <button
          id="btn-confirm-paid-modal"
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-neutral-900 transition-colors hover:bg-yellow-300 cursor-pointer"
        >
          Entendido
        </button>
      </div>
    </div>
  )
}
