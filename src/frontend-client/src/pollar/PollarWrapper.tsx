import '@pollar/react/styles.css'
import { PollarProvider, usePollar } from '@pollar/react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { POLLAR_CONFIG } from './config'

export interface WalletAssetBalance {
  code: string
  balance: string
  available: string
}

export interface AlfioWalletContextValue {
  isAuthenticated: boolean
  isDemoMode: boolean
  hasPollarApiKey: boolean
  hasWallet: boolean
  isCreatingWallet: boolean
  network: string
  walletAddress: string | null
  balances: WalletAssetBalance[]
  isLoadingBalance: boolean
  openLogin: () => void
  enterDemoSession: () => void
  createWallet: () => Promise<void>
  logout: () => void
  refreshBalance: () => Promise<void>
  payUsdc: (params: {
    destination: string
    amount: string
    memo?: string
  }) => Promise<{ ok: boolean; hash?: string; error?: string }>
}

const AlfioWalletContext = createContext<AlfioWalletContextValue | null>(null)

const DEMO_WALLET_ADDRESS = 'GDALFIO7DEMO2STELLAR4TESTNET8WALLET3USER9XYZ2ABC4DEF6'
const DEMO_INITIAL_BALANCES: WalletAssetBalance[] = [
  { code: 'USDC', balance: '320.00', available: '320.00' },
  { code: 'XLM', balance: '100.00', available: '95.00' },
]

function PollarBridge({ children }: { children: ReactNode }) {
  const pollar = usePollar()
  const [demoActive, setDemoActive] = useState(false)
  const [demoBalances, setDemoBalances] = useState<WalletAssetBalance[]>(DEMO_INITIAL_BALANCES)

  useEffect(() => {
    if (pollar.isAuthenticated && pollar.wallet?.address) {
      void pollar.refreshWalletBalance()
    }
  }, [pollar.isAuthenticated, pollar.wallet?.address])

  const openLogin = useCallback(() => {
    pollar.openLoginModal()
  }, [pollar])

  const enterDemoSession = useCallback(() => {
    setDemoActive(true)
  }, [])

  const logout = useCallback(() => {
    if (demoActive) {
      setDemoActive(false)
      setDemoBalances(DEMO_INITIAL_BALANCES)
      return
    }
    pollar.logout()
  }, [demoActive, pollar])

  const refreshBalance = useCallback(async () => {
    if (demoActive) return
    if (pollar.isAuthenticated) {
      await pollar.refreshWalletBalance()
    }
  }, [demoActive, pollar])

  const payUsdc = useCallback(
    async ({
      destination,
      amount,
      memo,
    }: {
      destination: string
      amount: string
      memo?: string
    }): Promise<{ ok: boolean; hash?: string; error?: string }> => {
      if (demoActive) {
        const numericAmount = Number(amount)
        setDemoBalances((prev) =>
          prev.map((asset) => {
            if (asset.code !== 'USDC') return asset
            const nextVal = Math.max(0, Number(asset.balance) - numericAmount).toFixed(2)
            return { ...asset, balance: nextVal, available: nextVal }
          }),
        )
        const fakeHash = `demo_${Date.now().toString(16)}`
        return { ok: true, hash: fakeHash }
      }

      try {
        const outcome = await pollar.sendPayment({
          chain: 'STELLAR',
          destination,
          amount,
          asset: {
            type: 'credit_alphanum4',
            code: POLLAR_CONFIG.defaultAssetCode,
            issuer: POLLAR_CONFIG.defaultAssetIssuer,
          },
          options: memo ? { memo: { type: 'text', value: memo } } : undefined,
        })
        if (outcome && 'hash' in outcome && typeof outcome.hash === 'string') {
          await pollar.refreshWalletBalance()
          return { ok: true, hash: outcome.hash }
        }
        return { ok: true }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo completar el pago'
        return { ok: false, error: message }
      }
    },
    [demoActive, pollar],
  )

  const balances: WalletAssetBalance[] = useMemo(() => {
    if (demoActive) return demoBalances
    if (pollar.walletBalance.step === 'loaded') {
      return pollar.walletBalance.data.balances.map((item) => ({
        code: item.code,
        balance: item.balance ?? '0.00',
        available: item.available ?? item.balance ?? '0.00',
      }))
    }
    return []
  }, [demoActive, demoBalances, pollar.walletBalance])

  const resolvedAddress =
    demoActive
      ? DEMO_WALLET_ADDRESS
      : (pollar.wallet?.address ?? pollar.wallets?.[0]?.address ?? null)

  const [isCreatingWallet, setIsCreatingWallet] = useState(false)

  const createWallet = useCallback(async () => {
    if (demoActive || isCreatingWallet) return
    setIsCreatingWallet(true)
    try {
      await pollar.createWallet()
      await pollar.refreshWalletBalance()
    } finally {
      setIsCreatingWallet(false)
    }
  }, [demoActive, isCreatingWallet, pollar])

  const value: AlfioWalletContextValue = useMemo(
    () => ({
      isAuthenticated: demoActive || pollar.isAuthenticated,
      isDemoMode: demoActive,
      hasPollarApiKey: POLLAR_CONFIG.hasValidApiKey,
      hasWallet: demoActive || pollar.hasWallet || Boolean(resolvedAddress),
      isCreatingWallet,
      network: pollar.network || POLLAR_CONFIG.stellarNetwork,
      walletAddress: resolvedAddress,
      balances,
      isLoadingBalance: !demoActive && pollar.walletBalance.step === 'loading',
      openLogin,
      enterDemoSession,
      createWallet,
      logout,
      refreshBalance,
      payUsdc,
    }),
    [
      demoActive,
      pollar.isAuthenticated,
      pollar.hasWallet,
      pollar.network,
      pollar.walletBalance.step,
      resolvedAddress,
      isCreatingWallet,
      balances,
      openLogin,
      enterDemoSession,
      createWallet,
      logout,
      refreshBalance,
      payUsdc,
    ],
  )

  return (
    <AlfioWalletContext.Provider value={value}>
      {children}
    </AlfioWalletContext.Provider>
  )
}

export function PollarWrapper({ children }: { children: ReactNode }) {
  return (
    <PollarProvider
      client={{
        apiKey: POLLAR_CONFIG.apiKey,
        stellarNetwork: POLLAR_CONFIG.stellarNetwork,
      }}
    >
      <PollarBridge>{children}</PollarBridge>
    </PollarProvider>
  )
}

export function useAlfioWalletContext(): AlfioWalletContextValue {
  const ctx = useContext(AlfioWalletContext)
  if (!ctx) {
    throw new Error('useAlfioWallet debe usarse dentro de <PollarWrapper>')
  }
  return ctx
}
