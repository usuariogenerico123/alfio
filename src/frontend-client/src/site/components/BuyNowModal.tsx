import { ArrowLeft, Camera, CheckCircle2, Clock, Keyboard, Lock, QrCode, Search, X, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { alfioApi } from '../../api/alfioApi'
import type { ProductCatalogItem, StellarOrderResponse } from '../../api/types'
import { formatUsdc } from '../utils/formatters'
import { QrScanner } from './QrScanner'

interface BuyNowModalProps {
  open: boolean
  walletAddress: string | null
  isSubmitting: boolean
  onClose: () => void
  onConfirmPurchase: (
    product: ProductCatalogItem,
    order: { orderId: string; memo: string },
  ) => Promise<void>
}

type InputMode = 'scan' | 'manual'
type OrderApprovalPhase = 'idle' | 'requesting' | 'waiting_store' | 'accepted' | 'rejected'

export function BuyNowModal({
  open,
  walletAddress,
  isSubmitting,
  onClose,
  onConfirmPurchase,
}: BuyNowModalProps) {
  const [mode, setMode] = useState<InputMode>('scan')
  const [qrInput, setQrInput] = useState('')
  const [catalog, setCatalog] = useState<ProductCatalogItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<ProductCatalogItem | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [orderPhase, setOrderPhase] = useState<OrderApprovalPhase>('idle')
  const [activeOrder, setActiveOrder] = useState<StellarOrderResponse | null>(null)
  const [orderNotice, setOrderNotice] = useState<string | null>(null)
  const unsubscribeOrderRef = useRef<(() => void) | null>(null)

  const clearOrderSubscription = () => {
    if (unsubscribeOrderRef.current) {
      unsubscribeOrderRef.current()
      unsubscribeOrderRef.current = null
    }
  }

  useEffect(() => {
    if (!open) return
    void alfioApi.getProductsCatalog().then(setCatalog).catch(() => {})
    return () => {
      clearOrderSubscription()
    }
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
    clearOrderSubscription()
    setOrderPhase('idle')
    setActiveOrder(null)
    setOrderNotice(null)
    setQrInput(found.qrCode)
    setSelectedProduct(found)
  }

  const handleRequestStoreApproval = async () => {
    if (!selectedProduct || !walletAddress) return
    clearOrderSubscription()
    setOrderPhase('requesting')
    setOrderNotice(null)

    try {
      const createdOrder = await alfioApi.createStellarOrder({
        product: selectedProduct,
        buyerWallet: walletAddress,
      })
      setActiveOrder(createdOrder)
      setOrderPhase('waiting_store')

      unsubscribeOrderRef.current = alfioApi.subscribeToOrderStatus(createdOrder.orderId, {
        onAccepted: (ev) => {
          setActiveOrder((prev) =>
            prev ? { ...prev, memo: ev.memo || prev.memo } : prev,
          )
          setOrderPhase('accepted')
          setOrderNotice('La tienda aceptó tu solicitud. Ya puedes pagar el 50% inicial.')
        },
        onRejected: (ev) => {
          setOrderPhase('rejected')
          setOrderNotice(ev.reason || 'La tienda rechazó la solicitud de compra.')
        },
        onError: () => {
          setOrderNotice('Reconectando con la tienda...')
        },
      })
    } catch (err) {
      setOrderPhase('idle')
      setOrderNotice(
        err instanceof Error ? err.message : 'No se pudo enviar la solicitud a la tienda.',
      )
    }
  }

  const cancelActiveOrderIfNeeded = () => {
    if (activeOrder && (orderPhase === 'waiting_store' || orderPhase === 'accepted')) {
      void alfioApi.cancelStellarOrder(activeOrder.orderId).catch(() => {})
    }
  }

  const handleCancelOrder = async () => {
    clearOrderSubscription()
    if (activeOrder) {
      try {
        await alfioApi.cancelStellarOrder(activeOrder.orderId)
      } catch {
        // Ignorar si la orden ya cerró en el backend
      }
    }
    setActiveOrder(null)
    setOrderPhase('idle')
    setOrderNotice('Solicitud cancelada.')
  }

  const handleClose = () => {
    cancelActiveOrderIfNeeded()
    clearOrderSubscription()
    setMode('scan')
    setQrInput('')
    setSelectedProduct(null)
    setLookupError(null)
    setOrderPhase('idle')
    setActiveOrder(null)
    setOrderNotice(null)
    onClose()
  }

  const handleResetScan = () => {
    cancelActiveOrderIfNeeded()
    clearOrderSubscription()
    setSelectedProduct(null)
    setLookupError(null)
    setOrderPhase('idle')
    setActiveOrder(null)
    setOrderNotice(null)
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

                {orderPhase === 'waiting_store' && (
                  <div className="flex items-center gap-2 rounded-xl border border-yellow-300 bg-yellow-50 px-3.5 py-2.5 text-xs font-medium text-neutral-800">
                    <Clock className="h-4 w-4 shrink-0 text-yellow-600" />
                    <span>Esperando que la tienda acepte tu solicitud...</span>
                  </div>
                )}

                {orderPhase === 'accepted' && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{orderNotice ?? 'La tienda aceptó tu solicitud. Ya puedes pagar.'}</span>
                  </div>
                )}

                {orderPhase === 'rejected' && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                    <XCircle className="h-4 w-4 shrink-0 text-red-600" />
                    <span>{orderNotice ?? 'La tienda rechazó tu solicitud.'}</span>
                  </div>
                )}

                {orderPhase === 'idle' && orderNotice && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {orderNotice}
                  </p>
                )}

                {(orderPhase === 'idle' || orderPhase === 'rejected') && (
                  <button
                    id="btn-request-store-approval"
                    type="button"
                    disabled={!walletAddress}
                    onClick={() => void handleRequestStoreApproval()}
                    className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-bold text-white shadow-xs transition-colors hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
                  >
                    {orderPhase === 'rejected'
                      ? 'Volver a solicitar a la tienda'
                      : 'Solicitar compra a la tienda'}
                  </button>
                )}

                <button
                  id="btn-confirm-credit-purchase"
                  type="button"
                  disabled={orderPhase !== 'accepted' || !activeOrder || isSubmitting}
                  onClick={() => {
                    if (!activeOrder) return
                    void onConfirmPurchase(selectedProduct, {
                      orderId: activeOrder.orderId,
                      memo: activeOrder.memo,
                    })
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-3.5 text-sm font-bold text-neutral-900 shadow-xs transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500 cursor-pointer"
                >
                  {orderPhase !== 'accepted' && <Lock className="h-4 w-4" />}
                  <span>
                    {isSubmitting
                      ? 'Procesando pago...'
                      : orderPhase === 'accepted'
                        ? `Pagar ahora (${formatUsdc(selectedProduct.downPaymentUsdc)})`
                        : orderPhase === 'waiting_store'
                          ? 'Pagar ahora (esperando aprobación...)'
                          : 'Pagar ahora (bloqueado hasta aprobación)'}
                  </span>
                </button>

                {(orderPhase === 'waiting_store' || orderPhase === 'accepted') && (
                  <button
                    id="btn-cancel-order-request"
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void handleCancelOrder()}
                    className="w-full rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50 cursor-pointer"
                  >
                    Cancelar solicitud
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
