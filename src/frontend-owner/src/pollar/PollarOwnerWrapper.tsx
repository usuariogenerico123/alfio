import '@pollar/react/styles.css'
import { PollarProvider, usePollar } from '@pollar/react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { POLLAR_OWNER_CONFIG } from './config'

export interface OwnerAssetBalance {
  code: string
  balance: string
  available: string
}

export interface OwnerWalletContextValue {
  isAuthenticated: boolean
  isDemoMode: boolean
  hasPollarApiKey: boolean
  network: string
  walletAddress: string | null
  balances: OwnerAssetBalance[]
  isLoadingBalance: boolean
  openLogin: () => void
  enterDemoSession: () => void
  logout: () => void
  refreshBalance: () => Promise<void>
}

const OwnerWalletContext = createContext<OwnerWalletContextValue | null>(null)

const DEMO_OWNER_WALLET = 'GBOWNER7TIENDA4PASOFIRME2STELLAR8TESTNET3ALFIO9XYZ2ABC'
const DEMO_OWNER_BALANCES: OwnerAssetBalance[] = [
  { code: 'USDC', balance: '1485.50', available: '1485.50' },
  { code: 'XLM', balance: '120.00', available: '115.00' },
]

function PollarOwnerBridge({ children }: { children: ReactNode }) {
  const pollar = usePollar()
  const [demoActive, setDemoActive] = useState(false)

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

  const balances: OwnerAssetBalance[] = useMemo(() => {
    if (demoActive) return DEMO_OWNER_BALANCES
    if (pollar.walletBalance.step === 'loaded') {
      return pollar.walletBalance.data.balances.map((item) => ({
        code: item.code,
        balance: item.balance ?? '0.00',
        available: item.available ?? item.balance ?? '0.00',
      }))
    }
    return []
  }, [demoActive, pollar.walletBalance])

  const value: OwnerWalletContextValue = useMemo(
    () => ({
      isAuthenticated: demoActive || pollar.isAuthenticated,
      isDemoMode: demoActive,
      hasPollarApiKey: POLLAR_OWNER_CONFIG.hasValidApiKey,
      network: pollar.network || POLLAR_OWNER_CONFIG.stellarNetwork,
      walletAddress: demoActive ? DEMO_OWNER_WALLET : (pollar.wallet?.address ?? null),
      balances,
      isLoadingBalance: !demoActive && pollar.walletBalance.step === 'loading',
      openLogin,
      enterDemoSession,
      logout,
      refreshBalance,
    }),
    [
      demoActive,
      pollar.isAuthenticated,
      pollar.network,
      pollar.wallet?.address,
      pollar.walletBalance.step,
      balances,
      openLogin,
      enterDemoSession,
      logout,
      refreshBalance,
    ],
  )

  return (
    <OwnerWalletContext.Provider value={value}>
      {children}
    </OwnerWalletContext.Provider>
  )
}

export function PollarOwnerWrapper({ children }: { children: ReactNode }) {
  return (
    <PollarProvider
      client={{
        apiKey: POLLAR_OWNER_CONFIG.apiKey,
        stellarNetwork: POLLAR_OWNER_CONFIG.stellarNetwork,
      }}
    >
      <PollarOwnerBridge>{children}</PollarOwnerBridge>
    </PollarProvider>
  )
}

export function useOwnerWalletContext(): OwnerWalletContextValue {
  const ctx = useContext(OwnerWalletContext)
  if (!ctx) {
    throw new Error('useOwnerWallet debe usarse dentro de <PollarOwnerWrapper>')
  }
  return ctx
}
