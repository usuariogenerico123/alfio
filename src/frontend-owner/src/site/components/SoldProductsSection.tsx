import { ShoppingBag } from 'lucide-react'
import type { SoldProduct } from '../../api/types'
import { formatShortDate, formatUsdc } from '../utils/formatters'

interface SoldProductsSectionProps {
  soldProducts: SoldProduct[]
}

export function SoldProductsSection({ soldProducts }: SoldProductsSectionProps) {
  return (
    <section
      aria-labelledby="sold-products-heading"
      className="floating-card rounded-2xl p-5 sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2
            id="sold-products-heading"
            className="text-base font-semibold text-neutral-900"
          >
            Productos vendidos
          </h2>
          <p className="text-xs text-neutral-500">
            Ventas confirmadas a crédito y estado de cuotas
          </p>
        </div>
        <span className="font-mono text-xs text-neutral-500">
          {soldProducts.length} {soldProducts.length === 1 ? 'venta' : 'ventas'}
        </span>
      </div>

      {soldProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-8 text-center">
          <ShoppingBag className="h-6 w-6 text-neutral-400" />
          <p className="mt-2 text-sm font-medium text-neutral-700">
            Todavía no hay ventas registradas
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {soldProducts.map((item) => {
            const isCompleted = item.status === 'completed'
            const progressPct = Math.round(
              (item.paidInstallments / item.totalInstallments) * 100,
            )

            return (
              <article
                key={item.id}
                className="rounded-xl border border-neutral-100 bg-neutral-50/70 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-neutral-900">
                        {item.productName}
                      </h3>
                      <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-neutral-500 border border-neutral-200">
                        {item.productCode}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {item.buyerName} · {formatShortDate(item.soldAt)}
                    </p>
                  </div>

                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                      isCompleted
                        ? 'bg-neutral-200/80 text-neutral-700'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {isCompleted ? 'Pagado total' : 'En cuotas'}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-neutral-500">
                    Entrada 50%:{' '}
                    <strong className="font-mono text-neutral-800">
                      {formatUsdc(item.downPaymentUsdc)}
                    </strong>
                  </span>
                  <span className="font-mono font-semibold text-neutral-900">
                    Total: {formatUsdc(item.totalAmountUsdc)}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-neutral-500">
                    <span>Cuotas cobradas</span>
                    <span className="font-mono text-neutral-700">
                      {item.paidInstallments}/{item.totalInstallments}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
                    <div
                      className="h-full rounded-full bg-yellow-400"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
