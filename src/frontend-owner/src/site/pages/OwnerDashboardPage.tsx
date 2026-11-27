import { useCallback, useEffect, useState } from 'react'
import { isRemoteApiConfigured } from '../../api/client'
import { ownerApi } from '../../api/ownerApi'
import {
  emitMockOrderAlert,
  emitMockPaymentConfirmed,
  subscribeToOrderAlerts,
  subscribeToOrderPayment,
} from '../../api/sse/orderEvents'
import type { SseConnectionState } from '../../api/sse/orderEvents'
import type {
  CreateProductRequest,
  IncomingOrderEvent,
  OwnerDashboardData,
  OwnerProfile,
  PaymentConfirmedEvent,
} from '../../api/types'
import { useOwnerWallet } from '../../pollar'
import { AddProductSection } from '../components/AddProductSection'
import { ClientsSection } from '../components/ClientsSection'
import { Header } from '../components/Header'
import type { OwnerNavSection } from '../components/Header'
import { LiveOrderAlertSection } from '../components/LiveOrderAlertSection'
import type { OrderAlertPhase } from '../components/LiveOrderAlertSection'
import { OverviewMetricsSection } from '../components/OverviewMetricsSection'
import { OwnerProductsSection } from '../components/OwnerProductsSection'
import { OwnerProfileSection } from '../components/OwnerProfileSection'
import { PaymentPaidModal } from '../components/PaymentPaidModal'
import { SoldProductsSection } from '../components/SoldProductsSection'

export function OwnerDashboardPage() {
  const wallet = useOwnerWallet()
  const [activeSection, setActiveSection] = useState<OwnerNavSection>('overview')
  const [dashboard, setDashboard] = useState<OwnerDashboardData | null>(null)
  const [profile, setProfile] = useState<OwnerProfile | null>(null)
  const [sseStatus, setSseStatus] = useState<SseConnectionState>('connecting')
  const [alertPhase, setAlertPhase] = useState<OrderAlertPhase>('idle')
  const [activeOrder, setActiveOrder] = useState<IncomingOrderEvent | null>(null)
  const [isAccepting, setIsAccepting] = useState(false)
  const [paidEvent, setPaidEvent] = useState<PaymentConfirmedEvent | null>(null)

  const loadDashboard = useCallback(async () => {
    const [data, ownerProfile] = await Promise.all([
      ownerApi.getDashboardData(),
      // Consulta el perfil de la tienda usando la billetera G... devuelta por Pollar
      ownerApi.getOwnerProfile(wallet.walletAddress ?? undefined),
    ])
    setDashboard(data)
    setProfile(ownerProfile)
  }, [wallet.walletAddress])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    const unsubscribe = subscribeToOrderAlerts({
      onStatusChange: setSseStatus,
      onOrder: (order) => {
        setActiveOrder(order)
        setAlertPhase('incoming')
      },
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (alertPhase !== 'waiting_payment' || !activeOrder) return

    const unsubscribe = subscribeToOrderPayment(activeOrder.orderId, {
      onPaymentConfirmed: (payment) => {
        void ownerApi.recordConfirmedSale(payment).then((updated) => {
          setDashboard(updated)
          setPaidEvent(payment)
          setAlertPhase('idle')
          setActiveOrder(null)
        })
      },
    })

    return unsubscribe
  }, [alertPhase, activeOrder])

  const handleAcceptOrder = async (order: IncomingOrderEvent) => {
    setIsAccepting(true)
    try {
      await ownerApi.acceptOrder(order.orderId)
      setAlertPhase('waiting_payment')
    } finally {
      setIsAccepting(false)
    }
  }

  const handleCreateProduct = async (payload: CreateProductRequest) => {
    const result = await ownerApi.createProduct(payload)
    await loadDashboard()
    return result
  }

  const handleSimulateIncomingOrder = () => {
    const sampleProduct = dashboard?.products[0]
    if (!sampleProduct) return
    const orderId = `ORD-${Date.now().toString().slice(-4)}`
    emitMockOrderAlert({
      orderId,
      productId: sampleProduct.id,
      productCode: sampleProduct.qrCode,
      productName: sampleProduct.name,
      description: sampleProduct.description,
      specs: sampleProduct.specs,
      buyerName: 'Valeria Soto',
      buyerWallet: 'GBCLIENT4VALERIASOTOSTELLARTESTNET0000000000000000004',
      totalPriceUsdc: sampleProduct.totalPriceUsdc,
      downPaymentUsdc: sampleProduct.totalPriceUsdc / 2,
      installmentAmountUsdc: sampleProduct.totalPriceUsdc / 8,
      installmentsCount: 4,
      createdAt: new Date().toISOString(),
    })
  }

  const handleSimulatePaymentConfirmed = () => {
    if (!activeOrder) return
    emitMockPaymentConfirmed({
      orderId: activeOrder.orderId,
      productCode: activeOrder.productCode,
      productName: activeOrder.productName,
      buyerName: activeOrder.buyerName,
      buyerWallet: activeOrder.buyerWallet,
      amountPaidUsdc: activeOrder.downPaymentUsdc,
      totalPriceUsdc: activeOrder.totalPriceUsdc,
      txHash: `tx_${Date.now().toString(16)}`,
      paidAt: new Date().toISOString(),
    })
  }

  if (!dashboard || !profile) {
    return (
      <div className="min-h-screen bg-[#f6f7f9] p-6 text-sm text-neutral-500">
        Cargando panel de tienda...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-neutral-900">
      <Header
        storeName={profile.storeName || dashboard.storeName}
        sseStatus={sseStatus}
        activeSection={activeSection}
        onSelectSection={setActiveSection}
      />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        {activeSection === 'overview' && (
          <>
            <OverviewMetricsSection metrics={dashboard.metrics} />
            <LiveOrderAlertSection
              phase={alertPhase}
              activeOrder={activeOrder}
              isAccepting={isAccepting}
              isMockSse={!isRemoteApiConfigured}
              onAcceptOrder={(order) => void handleAcceptOrder(order)}
              onSimulateIncomingOrder={handleSimulateIncomingOrder}
              onSimulatePaymentConfirmed={handleSimulatePaymentConfirmed}
            />
            <SoldProductsSection soldProducts={dashboard.soldProducts} />
          </>
        )}

        {activeSection === 'products' && (
          <OwnerProductsSection products={dashboard.products} />
        )}

        {activeSection === 'add_product' && (
          <AddProductSection
            defaultStoreName={profile.storeName || dashboard.storeName}
            onCreateProduct={handleCreateProduct}
          />
        )}

        {activeSection === 'clients' && (
          <ClientsSection clients={dashboard.clients} />
        )}

        {activeSection === 'profile' && wallet.walletAddress && (
          <OwnerProfileSection
            profile={profile}
            walletAddress={wallet.walletAddress}
            balances={wallet.balances}
            isLoadingBalance={wallet.isLoadingBalance}
            onRefreshBalance={() => void wallet.refreshBalance()}
            onLogout={wallet.logout}
          />
        )}
      </main>

      <PaymentPaidModal
        payment={paidEvent}
        onClose={() => setPaidEvent(null)}
      />
    </div>
  )
}
