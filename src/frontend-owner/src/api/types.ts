export interface ProductSpec {
  label: string
  value: string
}

export interface OwnerProfile {
  storeName: string
  ownerName: string
  email: string
  walletAddress?: string
}

export interface OwnerProduct {
  id: string
  qrCode: string
  storeName?: string
  name: string
  photoUrl?: string
  description: string
  specs: ProductSpec[]
  basePriceUsdc: number
  platformFeeUsdc: number
  totalPriceUsdc: number
  stock: number
  active: boolean
}

export interface CreateProductRequest {
  storeName: string
  name: string
  photoUrl?: string
  description: string
  specs: ProductSpec[]
  priceUsd: number
  stock: number
}

export interface CreateProductResponse {
  product: OwnerProduct
  productCode: string
}

export interface SoldProduct {
  id: string
  orderId: string
  productCode: string
  productName: string
  buyerName: string
  buyerWallet: string
  soldAt: string
  totalAmountUsdc: number
  downPaymentUsdc: number
  paidInstallments: number
  totalInstallments: number
  status: 'active' | 'completed'
  txHash?: string
}

export interface StoreClient {
  id: string
  name: string
  walletAddress: string
  activeCredits: number
  pendingBalanceUsdc: number
  nextDueDate: string | null
  status: 'on_time' | 'overdue' | 'completed'
}

export interface OwnerMetrics {
  salesTodayUsdc: number
  salesTodayCount: number
  receivableTodayUsdc: number
  receivableTodayCount: number
  overdueAmountUsdc: number
  overdueCount: number
}

export interface IncomingOrderEvent {
  orderId: string
  productId: string
  productCode: string
  productName: string
  description: string
  specs: ProductSpec[]
  buyerName: string
  buyerWallet: string
  totalPriceUsdc: number
  downPaymentUsdc: number
  installmentAmountUsdc: number
  installmentsCount: number
  createdAt: string
}

export interface PaymentConfirmedEvent {
  orderId: string
  productCode: string
  productName: string
  buyerName: string
  buyerWallet: string
  amountPaidUsdc: number
  totalPriceUsdc: number
  txHash: string
  paidAt: string
}

export interface OwnerDashboardData {
  storeName: string
  metrics: OwnerMetrics
  products: OwnerProduct[]
  soldProducts: SoldProduct[]
  clients: StoreClient[]
}
