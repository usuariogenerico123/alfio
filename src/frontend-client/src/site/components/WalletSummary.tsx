import { Check, Copy, QrCode, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import type { WalletAssetBalance } from '../../pollar'
import { formatUsdc, truncateAddress } from '../utils/formatters'

interface WalletSummaryProps {
  walletAddress: string
  balances: WalletAssetBalance[]
  isLoadingBalance: boolean
  onRefreshBalance: () => void
  onBuyNow: () => void
}

export function WalletSummary({
  walletAddress,
  balances,
  isLoadingBalance,
  onRefreshBalance,
  onBuyNow,
}: WalletSummaryProps) {
  const [copied, setCopied] = useState(false)

  const usdcAsset = balances.find((b) => b.code.toUpperCase() === 'USDC')
  const xlmAsset = balances.find((b) => b.code.toUpperCase() === 'XLM')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // Fallback silencioso si el navegador bloquea el portapapeles
    }
  }

  return (
    <section
      aria-labelledby="wallet-summary-heading"
      className="floating-card rounded-2xl p-5 sm:p-6"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h1
              id="wallet-summary-heading"
              className="text-xs font-semibold uppercase tracking-wider text-neutral-500"
            >
              Tu billetera Stellar
            </h1>
            <button
              id="btn-refresh-balance"
              type="button"
              onClick={onRefreshBalance}
              disabled={isLoadingBalance}
              aria-label="Actualizar saldo"
              className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div>
            <p className="font-mono text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
              {isLoadingBalance
                ? 'Cargando...'
                : usdcAsset
                  ? formatUsdc(usdcAsset.balance)
                  : '0.00 USDC'}
            </p>
            {xlmAsset && (
              <p className="mt-1 font-mono text-xs text-neutral-500">
                Saldo nativo: {Number(xlmAsset.balance).toFixed(2)} XLM
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              title={walletAddress}
              className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 font-mono text-xs text-neutral-700"
            >
              {truncateAddress(walletAddress, 8, 8)}
            </span>
            <button
              id="btn-copy-wallet"
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-900 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-yellow-600" />
                  <span className="text-yellow-700">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="sm:shrink-0">
          <button
            id="btn-buy-now"
            type="button"
            onClick={onBuyNow}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-3.5 text-sm font-bold text-neutral-900 shadow-xs transition-colors hover:bg-yellow-300 sm:w-auto cursor-pointer"
          >
            <QrCode className="h-4 w-4" />
            <span>Comprar ahora</span>
          </button>
        </div>
      </div>
    </section>
  )
}
