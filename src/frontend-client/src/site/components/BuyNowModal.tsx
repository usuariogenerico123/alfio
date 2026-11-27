import { ArrowLeft, Camera, Keyboard, QrCode, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { alfioApi } from '../../api/alfioApi'
import type { ProductCatalogItem } from '../../api/types'
import { formatUsdc } from '../utils/formatters'
import { QrScanner } from './QrScanner'

interface BuyNowModalProps {
  open: boolean
  isSubmitting: boolean
  onClose: () => void
  onConfirmPurchase: (product: ProductCatalogItem) => Promise<void>
}

type InputMode = 'scan' | 'manual'

export function BuyNowModal({
  open,
  isSubmitting,
  onClose,
  onConfirmPurchase,
}: BuyNowModalProps) {
  const [mode, setMode] = useState<InputMode>('scan')
  const [qrInput, setQrInput] = useState('')
  const [catalog, setCatalog] = useState<ProductCatalogItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<ProductCatalogItem | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    void alfioApi.getProductsCatalog().then(setCatalog).catch(() => {})
  }, [open])

  if (!open) return null

  const handleLookup = async (rawCode: string) => {
    setLookupError(null)
    const code = rawCode.trim().toUpperCase()
    if (!code) {
      setLookupError('Escanea o ingresa un código QR de producto.')
      return
    }
    const found = await alfioApi.getProductByQrCode(code)
    if (!found) {
      setSelectedProduct(null)
      setLookupError(`No encontramos un producto para el código "${code}".`)
      return
    }
    setQrInput(found.qrCode)
    setSelectedProduct(found)
  }

  const handleClose = () => {
    setMode('scan')
    setQrInput('')
    setSelectedProduct(null)
    setLookupError(null)
    onClose()
  }

  const handleResetScan = () => {
    setSelectedProduct(null)
    setLookupError(null)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="buy-now-modal-title"
      className="fixed inset-0 z-40 flex items-end justify-center bg-neutral-900/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
    >
      <div className="floating-card max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl p-5 sm:rounded-2xl sm:p-6">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-yellow-500" />
            <h2 id="buy-now-modal-title" className="text-base font-bold text-neutral-900">
              {selectedProduct ? 'Especificaciones del producto' : 'Escanear QR del producto'}
            </h2>
          </div>
          <button
            id="btn-close-buy-modal"
            type="button"
            onClick={handleClose}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {!selectedProduct ? (
            <>
              <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-neutral-100 p-1">
                <button
                  id="tab-qr-camera"
                  type="button"
                  onClick={() => {
                    setMode('scan')
                    setLookupError(null)
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    mode === 'scan'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>Escanear QR</span>
                </button>
                <button
                  id="tab-qr-manual"
                  type="button"
                  onClick={() => {
                    setMode('manual')
                    setLookupError(null)
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    mode === 'manual'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Keyboard className="h-3.5 w-3.5" />
                  <span>Ingresar código</span>
                </button>
              </div>

              {mode === 'scan' ? (
                <QrScanner
                  active={open && mode === 'scan' && !selectedProduct}
                  onScanSuccess={(decoded) => {
                    void handleLookup(decoded)
                  }}
                />
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    void handleLookup(qrInput)
                  }}
                  className="flex gap-2"
                >
                  <input
                    id="input-qr-code"
                    type="text"
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    placeholder="Ej. ALFIO-ZAP-001"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:border-yellow-400 focus:bg-white focus:outline-none"
                  />
                  <button
                    id="btn-search-qr"
                    type="submit"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 cursor-pointer"
                  >
                    <Search className="h-4 w-4" />
                    <span>Buscar</span>
                  </button>
                </form>
              )}

              {lookupError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {lookupError}
                </p>
              )}

              {catalog.length > 0 && (
                <div className="border-t border-neutral-100 pt-3">
                  <p className="mb-2 text-xs text-neutral-500">
                    O simula un escaneo rápido con un producto de prueba:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {catalog.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setQrInput(item.qrCode)
                          setSelectedProduct(item)
                          setLookupError(null)
                        }}
                        className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 font-mono text-xs text-neutral-700 transition-colors hover:border-yellow-400 hover:bg-yellow-50/60 cursor-pointer"
                      >
                        {item.qrCode}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleResetScan}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-900 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Escanear otro producto</span>
              </button>

              <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-yellow-700">
                      {selectedProduct.storeName}
                    </span>
                    <span className="rounded bg-white px-2 py-0.5 font-mono text-[11px] text-neutral-500 border border-neutral-200">
                      {selectedProduct.qrCode}
                    </span>
                  </div>
                  <h3 className="mt-1 text-lg font-bold text-neutral-900">
                    {selectedProduct.name}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                    {selectedProduct.description}
                  </p>
                </div>

                {selectedProduct.specs && selectedProduct.specs.length > 0 && (
                  <div className="border-t border-neutral-200/70 pt-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      Especificaciones
                    </p>
                    <dl className="grid grid-cols-2 gap-2 text-xs">
                      {selectedProduct.specs.map((spec) => (
                        <div
                          key={spec.label}
                          className="rounded-lg border border-neutral-200/70 bg-white px-2.5 py-2"
                        >
                          <dt className="text-[11px] text-neutral-500">{spec.label}</dt>
                          <dd className="mt-0.5 font-medium text-neutral-900">
                            {spec.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                <div className="space-y-1.5 border-t border-neutral-200/70 pt-3 text-xs">
                  <div className="flex justify-between text-neutral-600">
                    <span>Precio del producto</span>
                    <span className="font-mono text-neutral-800">
                      {formatUsdc(selectedProduct.basePriceUsdc)}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Comisión alFio</span>
                    <span className="font-mono text-neutral-800">
                      {formatUsdc(selectedProduct.platformFeeUsdc)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-neutral-200/70 pt-1.5 font-semibold text-neutral-900">
                    <span>Total a financiar</span>
                    <span className="font-mono">
                      {formatUsdc(selectedProduct.totalPriceUsdc)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-yellow-200 bg-yellow-50/70 p-3 text-xs">
                  <div>
                    <span className="block text-neutral-600">Pagas hoy (50%)</span>
                    <span className="mt-0.5 block font-mono text-base font-bold text-neutral-900">
                      {formatUsdc(selectedProduct.downPaymentUsdc)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-neutral-600">
                      {selectedProduct.installmentsCount} cuotas c/{selectedProduct.intervalDays} días
                    </span>
                    <span className="mt-0.5 block font-mono text-base font-bold text-neutral-900">
                      {formatUsdc(selectedProduct.installmentAmountUsdc)}
                    </span>
                  </div>
                </div>

                <button
                  id="btn-confirm-credit-purchase"
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void onConfirmPurchase(selectedProduct)}
                  className="w-full rounded-xl bg-yellow-400 px-4 py-3.5 text-sm font-bold text-neutral-900 shadow-xs transition-colors hover:bg-yellow-300 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting
                    ? 'Procesando pago...'
                    : `Pagar ahora (${formatUsdc(selectedProduct.downPaymentUsdc)})`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
