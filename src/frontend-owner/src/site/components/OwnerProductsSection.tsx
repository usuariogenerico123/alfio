import { Package, QrCode } from 'lucide-react'
import type { OwnerProduct } from '../../api/types'
import { formatUsdc } from '../utils/formatters'

interface OwnerProductsSectionProps {
  products: OwnerProduct[]
}

export function OwnerProductsSection({ products }: OwnerProductsSectionProps) {
  return (
    <section
      aria-labelledby="owner-products-heading"
      className="floating-card rounded-2xl p-5 sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2
            id="owner-products-heading"
            className="text-base font-semibold text-neutral-900"
          >
            Sus productos
          </h2>
          <p className="text-xs text-neutral-500">
            Catálogo registrado con código QR y comisión incluida
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
            Aún no hay productos registrados
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="flex flex-col justify-between rounded-xl border border-neutral-100 bg-neutral-50/70 p-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-0.5 font-mono text-[11px] font-medium text-neutral-700">
                    <QrCode className="h-3 w-3 text-yellow-600" />
                    {product.qrCode}
                  </span>
                  <span className="font-mono text-xs text-neutral-500">
                    Stock: {product.stock}
                  </span>
                </div>

                <h3 className="mt-2.5 text-sm font-semibold text-neutral-900">
                  {product.name}
                </h3>
                <p className="mt-1 text-xs text-neutral-500">
                  {product.description}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {product.specs.map((spec) => (
                    <span
                      key={spec.label}
                      className="rounded-md bg-white px-2 py-0.5 text-[11px] text-neutral-600 border border-neutral-200/70"
                    >
                      {spec.label}: <strong className="font-medium text-neutral-800">{spec.value}</strong>
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-end justify-between border-t border-neutral-200/70 pt-3">
                <div className="text-[11px] text-neutral-500">
                  Base {formatUsdc(product.basePriceUsdc)} + fee {formatUsdc(product.platformFeeUsdc)}
                </div>
                <span className="font-mono text-sm font-bold text-neutral-900">
                  {formatUsdc(product.totalPriceUsdc)}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
