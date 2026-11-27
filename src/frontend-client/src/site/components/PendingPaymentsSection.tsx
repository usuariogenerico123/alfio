import { CalendarClock, CheckCircle2 } from 'lucide-react'
import type { PendingInstallment } from '../../api/types'
import { formatDueDate, formatUsdc } from '../utils/formatters'

interface PendingPaymentsSectionProps {
  installments: PendingInstallment[]
  payingId: string | null
  onPayInstallment: (installment: PendingInstallment) => void
}

export function PendingPaymentsSection({
  installments,
  payingId,
  onPayInstallment,
}: PendingPaymentsSectionProps) {
  const totalPending = installments.reduce((acc, item) => acc + item.amountUsdc, 0)

  return (
    <section
      aria-labelledby="pending-payments-heading"
      className="floating-card rounded-2xl p-5 sm:p-6"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2
            id="pending-payments-heading"
            className="text-base font-semibold text-neutral-900"
          >
            Productos a pagar
          </h2>
          <p className="text-xs text-neutral-500">
            Cuotas pendientes programadas cada 15 días
          </p>
        </div>

        <span className="rounded-lg border border-yellow-200 bg-yellow-50 px-2.5 py-1 font-mono text-xs font-semibold text-yellow-800">
          Total: {formatUsdc(totalPending)}
        </span>
      </div>

      {installments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-8 text-center">
          <CheckCircle2 className="h-6 w-6 text-yellow-500" />
          <p className="mt-2 text-sm font-medium text-neutral-800">
            Estás al día con tus cuotas
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            No tienes pagos pendientes por el momento.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {installments.map((item) => {
            const isPaying = payingId === item.id
            return (
              <li
                key={item.id}
                className="flex flex-col gap-3 py-3.5 first:pt-1 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-neutral-900">
                      {item.productName}
                    </p>
                    <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-neutral-600">
                      Cuota {item.installmentNumber}/{item.totalInstallments}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
                    <span>{item.storeName}</span>
                    <span className="inline-flex items-center gap-1 text-neutral-700">
                      <CalendarClock className="h-3.5 w-3.5 text-yellow-500" />
                      Vence: {formatDueDate(item.dueDate)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className="font-mono text-sm font-semibold text-neutral-900">
                    {formatUsdc(item.amountUsdc)}
                  </span>
                  <button
                    id={`btn-pay-${item.id}`}
                    type="button"
                    disabled={Boolean(payingId)}
                    onClick={() => onPayInstallment(item)}
                    className="rounded-lg bg-yellow-400 px-3.5 py-2 text-xs font-bold text-neutral-900 shadow-xs transition-colors hover:bg-yellow-300 disabled:opacity-50 cursor-pointer"
                  >
                    {isPaying ? 'Pagando...' : 'Pagar cuota'}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
