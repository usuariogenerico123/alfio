export type InstallmentStatus = 'pending' | 'overdue' | 'paid'

export interface ProductSpec {
  label: string
  value: string
}

export interface ProductCatalogItem {
  id: string
  qrCode: string
  name: string
  storeName: string
  storeWallet: string
  description: string
  specs: ProductSpec[]
  basePriceUsdc: number
  platformFeeUsdc: number
  totalPriceUsdc: number
  downPaymentUsdc: number
  installmentAmountUsdc: number
  installmentsCount: number
  intervalDays: number
}

export interface PurchasedProduct {
  id: string
  productId: string
  productName: string
  storeName: string
  purchasedAt: string
  totalAmountUsdc: number
  downPaymentPaidUsdc: number
  paidInstallments: number
  totalInstallments: number
  status: 'active' | 'completed'
  txHash?: string
}

export interface PendingInstallment {
  id: string
  purchaseId: string
  productName: string
  storeName: string
  installmentNumber: number
  totalInstallments: number
  amountUsdc: number
  dueDate: string
  status: InstallmentStatus
  memo: string
  destinationWallet: string
}

export interface CreateCreditPurchaseRequest {
  walletAddress: string
  productId: string
  downPaymentTxHash?: string
}

export interface PayInstallmentRequest {
  walletAddress: string
  installmentId: string
  txHash?: string
}

export interface UserPortfolioResponse {
  purchasedProducts: PurchasedProduct[]
  pendingInstallments: PendingInstallment[]
}
