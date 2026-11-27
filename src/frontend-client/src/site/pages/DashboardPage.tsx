import { useCallback, useEffect, useState } from 'react'
import { alfioApi } from '../../api/alfioApi'
import type {
  PendingInstallment,
  ProductCatalogItem,
  PurchasedProduct,
} from '../../api/types'
import { useAlfioWallet } from '../../pollar'
import { BuyNowModal } from '../components/BuyNowModal'
import { Header } from '../components/Header'
import { PendingPaymentsSection } from '../components/PendingPaymentsSection'
import { PurchasedProductsSection } from '../components/PurchasedProductsSection'
import { WalletSummary } from '../components/WalletSummary'

export function DashboardPage() {
  const wallet = useAlfioWallet()
  const [purchasedProducts, setPurchasedProducts] = useState<PurchasedProduct[]>([])
  const [pendingInstallments, setPendingInstallments] = useState<PendingInstallment[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [buyModalOpen, setBuyModalOpen] = useState(false)
  const [isSubmittingPurchase, setIsSubmittingPurchase] = useState(false)
  const [payingInstallmentId, setPayingInstallmentId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const loadPortfolio = useCallback(async () => {
    setIsLoadingData(true)
    try {
      const data = await alfioApi.getUserPortfolio(wallet.walletAddress ?? 'guest')
      setPurchasedProducts(data.purchasedProducts)
      setPendingInstallments(data.pendingInstallments)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error cargando datos'
      setFeedback({ type: 'err', text: message })
    } finally {
      setIsLoadingData(false)
    }
  }, [wallet.walletAddress])

  useEffect(() => {
    void loadPortfolio()
  }, [loadPortfolio])

  const handleConfirmPurchase = async (product: ProductCatalogItem) => {
    if (!wallet.walletAddress) return
    setIsSubmittingPurchase(true)
    setFeedback(null)

    try {
      const payment = await wallet.payUsdc({
        destination: product.storeWallet,
        amount: product.downPaymentUsdc.toFixed(2),
        memo: `ALFIO-50-${product.id.toUpperCase()}`,
      })

      if (!payment.ok) {
        setFeedback({
          type: 'err',
          text: payment.error ?? 'No se pudo realizar el pago del 50% inicial.',
        })
        return
      }

      await alfioApi.createCreditPurchase({
        walletAddress: wallet.walletAddress,
        productId: product.id,
        downPaymentTxHash: payment.hash,
      })

      await loadPortfolio()
      setBuyModalOpen(false)
      setFeedback({
        type: 'ok',
        text: `Compra confirmada: ${product.name}. Se generaron tus 4 cuotas cada 15 días.`,
      })
    } finally {
      setIsSubmittingPurchase(false)
    }
  }

  const handlePayInstallment = async (installment: PendingInstallment) => {
    if (!wallet.walletAddress) return
    setPayingInstallmentId(installment.id)
    setFeedback(null)

    try {
      const payment = await wallet.payUsdc({
        destination: installment.destinationWallet,
        amount: installment.amountUsdc.toFixed(2),
        memo: installment.memo,
      })

      if (!payment.ok) {
        setFeedback({
          type: 'err',
          text: payment.error ?? 'No se pudo completar el pago de la cuota.',
        })
        return
      }

      await alfioApi.payInstallment({
        walletAddress: wallet.walletAddress,
        installmentId: installment.id,
        txHash: payment.hash,
      })

      await loadPortfolio()
      setFeedback({
        type: 'ok',
        text: `Cuota ${installment.installmentNumber}/${installment.totalInstallments} de ${installment.productName} pagada.`,
      })
    } finally {
      setPayingInstallmentId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-neutral-900">
      <Header
        network={wallet.network}
        isDemoMode={wallet.isDemoMode}
        onLogout={wallet.logout}
      />

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        {feedback && (
          <div
            role="status"
            className={`rounded-xl border px-4 py-3 text-sm shadow-xs ${
              feedback.type === 'ok'
                ? 'border-yellow-300 bg-yellow-50 text-neutral-900'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {feedback.text}
          </div>
        )}

        {wallet.walletAddress ? (
          <WalletSummary
            walletAddress={wallet.walletAddress}
            balances={wallet.balances}
            isLoadingBalance={wallet.isLoadingBalance}
            onRefreshBalance={() => void wallet.refreshBalance()}
            onBuyNow={() => setBuyModalOpen(true)}
          />
        ) : (
          <section className="floating-card flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h1 className="text-base font-semibold text-neutral-900">
                Activa tu billetera Stellar
              </h1>
              <p className="mt-1 text-xs text-neutral-500">
                Tu sesión de Pollar está activa, pero aún falta inicializar tu dirección Stellar.
              </p>
            </div>
            <button
              id="btn-create-stellar-wallet"
              type="button"
              disabled={wallet.isCreatingWallet}
              onClick={() => void wallet.createWallet()}
              className="rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-neutral-900 shadow-xs transition-colors hover:bg-yellow-300 disabled:opacity-50 cursor-pointer"
            >
              {wallet.isCreatingWallet ? 'Creando billetera...' : 'Crear billetera Stellar'}
            </button>
          </section>
        )}

        {isLoadingData ? (
          <div className="floating-card rounded-2xl p-6 text-sm text-neutral-500">
            Cargando tus productos y cuotas...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <PendingPaymentsSection
              installments={pendingInstallments}
              payingId={payingInstallmentId}
              onPayInstallment={(item) => void handlePayInstallment(item)}
            />
            <PurchasedProductsSection products={purchasedProducts} />
          </div>
        )}
      </main>

      <BuyNowModal
        open={buyModalOpen}
        isSubmitting={isSubmittingPurchase}
        onClose={() => setBuyModalOpen(false)}
        onConfirmPurchase={handleConfirmPurchase}
      />
    </div>
  )
}
