import { Package } from 'lucide-react'
import type { PurchasedProduct } from '../../api/types'
import { formatDueDate, formatUsdc } from '../utils/formatters'

interface PurchasedProductsSectionProps {
  products: PurchasedProduct[]
}

export function PurchasedProductsSection({
  products,
}: PurchasedProductsSectionProps) {
  return (
    <section
      aria-labelledby="purchased-products-heading"
      className="floating-card rounded-2xl p-5 sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2
            id="purchased-products-heading"
            className="text-base font-semibold text-neutral-900"
          >
            Productos comprados
          </h2>
          <p className="text-xs text-neutral-500">
            Historial de compras realizadas con alFio
          </p>
        </div>
        <span className="font-mono text-xs text-neutral-500">
          {products.length} {products.length === 1 ? 'producto' : 'productos'}
        </span>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-8 text-center">
          <Package className="h-6 w-6 text-neutral-400" />
          <p className="mt-2 text-sm font-medium text-neutral-700">
            Aún no tienes productos comprados
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Usa el botón Comprar ahora para escanear un código QR.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => {
            const progressPct = Math.round(
              (product.paidInstallments / product.totalInstallments) * 100,
            )
            const isCompleted = product.status === 'completed'

            return (
              <article
                key={product.id}
                className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">
                      {product.productName}
                    </h3>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {product.storeName} · {formatDueDate(product.purchasedAt)}
                    </p>
                  </div>

                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                      isCompleted
                        ? 'bg-neutral-200/80 text-neutral-700'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {isCompleted ? 'Completado' : 'En cuotas'}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-neutral-500">
                    Entrada 50%:{' '}
                    <strong className="font-mono text-neutral-800">
                      {formatUsdc(product.downPaymentPaidUsdc)}
                    </strong>
                  </span>
                  <span className="font-mono font-semibold text-neutral-900">
                    Total: {formatUsdc(product.totalAmountUsdc)}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-neutral-500">
                    <span>Progreso de cuotas</span>
                    <span className="font-mono text-neutral-700">
                      {product.paidInstallments}/{product.totalInstallments} pagadas
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
