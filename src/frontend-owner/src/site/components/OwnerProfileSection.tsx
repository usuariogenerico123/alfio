import { Check, Copy, LogOut, RefreshCw, User, Wallet } from 'lucide-react'
import { useState } from 'react'
import type { OwnerProfile } from '../../api/types'
import type { OwnerAssetBalance } from '../../pollar'
import { formatUsdc, truncateAddress } from '../utils/formatters'

interface OwnerProfileSectionProps {
  profile: OwnerProfile
  walletAddress: string
  balances: OwnerAssetBalance[]
  isLoadingBalance: boolean
  onRefreshBalance: () => void
  onLogout: () => void
}

export function OwnerProfileSection({
  profile,
  walletAddress,
  balances,
  isLoadingBalance,
  onRefreshBalance,
  onLogout,
}: OwnerProfileSectionProps) {
  const [copied, setCopied] = useState(false)

  const usdcAsset = balances.find((b) => b.code.toUpperCase() === 'USDC')
  const xlmAsset = balances.find((b) => b.code.toUpperCase() === 'XLM')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // Ignorar si el navegador bloquea el portapapeles
    }
  }

  return (
    <section
      aria-labelledby="owner-profile-heading"
      className="grid grid-cols-1 gap-6 lg:grid-cols-2"
    >
      <div className="floating-card rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2
              id="owner-profile-heading"
              className="text-base font-semibold text-neutral-900"
            >
              Perfil de la tienda
            </h2>
            <p className="text-xs text-neutral-500">
              Datos registrados vinculados a tu cuenta Pollar
            </p>
          </div>
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between gap-3 border-b border-neutral-100 pb-2.5">
            <dt className="text-neutral-500">Tienda</dt>
            <dd className="font-semibold text-neutral-900">{profile.storeName}</dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-neutral-100 pb-2.5">
            <dt className="text-neutral-500">Dueño</dt>
            <dd className="font-medium text-neutral-900">{profile.ownerName}</dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-neutral-100 pb-2.5">
            <dt className="text-neutral-500">Email</dt>
            <dd className="font-medium text-neutral-900">{profile.email}</dd>
          </div>
        </dl>

        <button
          id="btn-profile-logout"
          type="button"
          onClick={onLogout}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-900 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar sesión</span>
        </button>
      </div>

      <div className="floating-card rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 text-neutral-900">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900">
                Saldo de la tienda
              </h3>
              <p className="text-xs text-neutral-500">Billetera Pollar · Stellar</p>
            </div>
          </div>

          <button
            id="btn-owner-refresh-balance"
            type="button"
            onClick={onRefreshBalance}
            disabled={isLoadingBalance}
            aria-label="Actualizar saldo"
            className="rounded-lg border border-neutral-200 p-2 text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5">
          <p className="font-mono text-3xl font-bold tracking-tight text-neutral-900">
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

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span
            title={walletAddress}
            className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 font-mono text-xs text-neutral-700"
          >
            {truncateAddress(walletAddress, 8, 8)}
          </span>
          <button
            id="btn-owner-copy-wallet"
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 cursor-pointer"
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
    </section>
  )
}
