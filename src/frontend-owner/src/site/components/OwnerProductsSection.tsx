import { Package, QrCode, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { OwnerProduct } from '../../api/types'
import { formatUsdc } from '../utils/formatters'

interface OwnerProductsSectionProps {
  products: OwnerProduct[]
  onDeleteProduct: (productId: string) => Promise<void>
}

export function OwnerProductsSection({
  products,
  onDeleteProduct,
}: OwnerProductsSectionProps) {
  const [confirmTarget, setConfirmTarget] = useState<OwnerProduct | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirmDelete = async () => {
    if (!confirmTarget) return
    setIsDeleting(true)
    try {
      await onDeleteProduct(confirmTarget.id)
      setConfirmTarget(null)
    } catch (err) {
      console.error('Error eliminando producto:', err)
    } finally {
      setIsDeleting(false)
    }
  }

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
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-neutral-500">
                      Stock: {product.stock}
                    </span>
                    <button
                      type="button"
                      onClick={() => setConfirmTarget(product)}
                      aria-label={`Eliminar ${product.name}`}
                      title="Eliminar producto"
                      className="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
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

      {confirmTarget && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4 backdrop-blur-[2px]"
        >
          <div className="floating-card w-full max-w-sm rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-neutral-900">
              Eliminar producto
            </h3>
            <p className="text-sm text-neutral-600">
              ¿Seguro que deseas eliminar{' '}
              <strong className="text-neutral-900">{confirmTarget.name}</strong> ({confirmTarget.qrCode})? Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setConfirmTarget(null)}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-delete-product"
                type="button"
                disabled={isDeleting}
                onClick={() => void handleConfirmDelete()}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
