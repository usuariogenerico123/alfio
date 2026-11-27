import { apiRequest, isRemoteApiConfigured } from './client'
import rawMockData from './mockData.json'
import {
  RUTA_ACTUALIZAR_ESTADO_CUOTA,
  RUTA_CATALOGO_PRODUCTOS,
  RUTA_CLIENTE_POR_WALLET,
  RUTA_CONFIRMAR_PAGO_ORDEN,
  RUTA_CREAR_CLIENTE,
  RUTA_CREAR_CREDITO,
  RUTA_CREAR_ORDEN_STELLAR,
  RUTA_CREDITOS_POR_CLIENTE,
  RUTA_CUOTAS_POR_CREDITO,
  RUTA_GENERAR_CUOTAS,
  RUTA_OBTENER_TIENDAS,
  RUTA_PRODUCTO_POR_ID,
  RUTA_PRODUCTO_POR_QR,
  RUTA_REGISTRAR_PAGO,
  RUTA_SSE_ESTADO_ORDEN,
} from './paths.js'
import type {
  ClientProfile,
  CreateCreditPurchaseRequest,
  InstallmentStatus,
  OrderStatusEvent,
  PayInstallmentRequest,
  PendingInstallment,
  ProductCatalogItem,
  ProductSpec,
  PurchasedProduct,
  StellarOrderResponse,
  UserPortfolioResponse,
} from './types'

// DTOs exactos devueltos por el backend en Go/Gin
interface BackendClientResponse {
  id: number
  nombre: string
  ci: string
  telefono: string
  direccion_billetera: string
}

interface BackendTiendaResponse {
  id: number
  nombre: string
  dueno: string
  email_panel: string
  billetera_g: string
}

interface BackendProductoResponse {
  id: number
  codigo_producto: string
  tienda_id: number
  tienda_nombre?: string
  nombre: string
  especificaciones: string
  precio_usd: number
  stock: number
  foto_url?: string
}

interface BackendCreditoResponse {
  id: number
  cliente_id: number
  cliente_nombre?: string
  producto_id: number
  producto_nombre?: string
  total: number
  inicial: number
  fecha: string
  estado: string
}

interface BackendCuotaResponse {
  id: number
  credito_id: number
  numero: number
  monto: number
  vencimiento: string
  estado: string
  memo: string
}

// Estado en memoria para el modo mock (se reemplaza automáticamente cuando VITE_API_BASE_URL está definido)
let mockPurchasedProducts: PurchasedProduct[] = structuredClone(
  rawMockData.purchasedProducts as PurchasedProduct[],
)
let mockPendingInstallments: PendingInstallment[] = structuredClone(
  rawMockData.pendingInstallments as PendingInstallment[],
)
const mockCatalog: ProductCatalogItem[] = rawMockData.catalog as ProductCatalogItem[]

function addDays(baseDate: Date, days: number): string {
  const result = new Date(baseDate)
  result.setDate(result.getDate() + days)
  return result.toISOString().slice(0, 10)
}

function parseSpecs(raw: string): { description: string; specs: ProductSpec[] } {
  const segments = raw
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)
  const specs: ProductSpec[] = []
  const descParts: string[] = []

  for (const seg of segments) {
    const colonIdx = seg.indexOf(':')
    if (colonIdx > 0 && colonIdx < seg.length - 1) {
      specs.push({
        label: seg.slice(0, colonIdx).trim(),
        value: seg.slice(colonIdx + 1).trim(),
      })
    } else {
      descParts.push(seg)
    }
  }

  return {
    description: descParts.join(' · ') || raw,
    specs,
  }
}

function mapProductoToCatalogItem(
  p: BackendProductoResponse,
  tiendasById?: Map<number, BackendTiendaResponse>,
): ProductCatalogItem {
  const platformFeeUsdc = Number((p.precio_usd * 0.05).toFixed(2))
  const totalPriceUsdc = Number((p.precio_usd + platformFeeUsdc).toFixed(2))
  const downPaymentUsdc = Number((totalPriceUsdc / 2).toFixed(2))
  const installmentAmountUsdc = Number((downPaymentUsdc / 4).toFixed(2))
  const tienda = tiendasById?.get(p.tienda_id)
  const { description, specs } = parseSpecs(p.especificaciones || '')

  return {
    id: String(p.id),
    qrCode: p.codigo_producto,
    name: p.nombre,
    storeName: p.tienda_nombre || tienda?.nombre || `Tienda #${p.tienda_id}`,
    storeWallet: tienda?.billetera_g || '',
    description,
    specs,
    basePriceUsdc: p.precio_usd,
    platformFeeUsdc,
    totalPriceUsdc,
    downPaymentUsdc,
    installmentAmountUsdc,
    installmentsCount: 4,
    intervalDays: 15,
  }
}

function mapCuotaStatus(estado: string, dueDate: string): InstallmentStatus {
  if (estado === 'pagada') return 'paid'
  const today = new Date().toISOString().slice(0, 10)
  if (estado === 'vencida' || (dueDate && dueDate < today)) return 'overdue'
  return 'pending'
}

export const alfioApi = {
  /**
   * Registra un cliente en el backend Go/Gin: POST /api/v1/clients
   */
  async registerClient(profile: ClientProfile): Promise<ClientProfile> {
    if (isRemoteApiConfigured) {
      const created = await apiRequest<BackendClientResponse>(RUTA_CREAR_CLIENTE, {
        method: 'POST',
        body: JSON.stringify({
          nombre: profile.nombre.trim(),
          ci: profile.ci.trim(),
          telefono: profile.telefono.trim(),
          direccion_billetera: profile.walletAddress?.trim() || '',
        }),
      })
      return {
        nombre: created.nombre,
        ci: created.ci,
        telefono: created.telefono,
        walletAddress: created.direccion_billetera,
      }
    }
    return { ...profile }
  },

  /**
   * Verifica si la billetera ya está registrada como cliente en la DB:
   * GET /api/v1/clients/wallet/:wallet
   */
  async verifyClientRegistered(walletAddress: string): Promise<ClientProfile | null> {
    if (!isRemoteApiConfigured) {
      return {
        nombre: 'Cliente Demo',
        ci: '0000000',
        telefono: '00000000',
        walletAddress,
      }
    }
    try {
      const found = await apiRequest<BackendClientResponse>(
        RUTA_CLIENTE_POR_WALLET(walletAddress),
      )
      return {
        nombre: found.nombre,
        ci: found.ci,
        telefono: found.telefono,
        walletAddress: found.direccion_billetera,
      }
    } catch {
      return null
    }
  },

  /**
   * Obtiene los productos comprados y las cuotas pendientes del usuario
   * usando las rutas del backend:
   * GET /api/v1/clients/wallet/:wallet -> GET /api/v1/creditos/cliente/:id -> GET /api/v1/cuotas/credito/:id
   */
  async getUserPortfolio(walletAddress: string): Promise<UserPortfolioResponse> {
    if (isRemoteApiConfigured) {
      let cliente: BackendClientResponse
      try {
        cliente = await apiRequest<BackendClientResponse>(
          RUTA_CLIENTE_POR_WALLET(walletAddress),
        )
      } catch {
        return { purchasedProducts: [], pendingInstallments: [] }
      }

      const [creditos, productos, tiendas] = await Promise.all([
        apiRequest<BackendCreditoResponse[]>(RUTA_CREDITOS_POR_CLIENTE(cliente.id)),
        apiRequest<BackendProductoResponse[]>(RUTA_CATALOGO_PRODUCTOS),
        apiRequest<BackendTiendaResponse[]>(RUTA_OBTENER_TIENDAS),
      ])

      const productosById = new Map(productos.map((p) => [p.id, p]))
      const tiendasById = new Map(tiendas.map((t) => [t.id, t]))

      const cuotasPerCredito = await Promise.all(
        creditos.map((c) =>
          apiRequest<BackendCuotaResponse[]>(RUTA_CUOTAS_POR_CREDITO(c.id)),
        ),
      )

      const purchasedProducts: PurchasedProduct[] = []
      const pendingInstallments: PendingInstallment[] = []

      creditos.forEach((credito, idx) => {
        const cuotas = cuotasPerCredito[idx] ?? []
        const prod = productosById.get(credito.producto_id)
        const tienda = prod ? tiendasById.get(prod.tienda_id) : undefined
        const storeName =
          prod?.tienda_nombre || tienda?.nombre || 'Tienda afiliada'
        const paidCount = cuotas.filter((q) => q.estado === 'pagada').length
        const totalInstallments = cuotas.length || 4

        purchasedProducts.push({
          id: String(credito.id),
          productId: String(credito.producto_id),
          productName:
            credito.producto_nombre ||
            prod?.nombre ||
            `Producto #${credito.producto_id}`,
          storeName,
          purchasedAt: (credito.fecha || '').slice(0, 10),
          totalAmountUsdc: credito.total,
          downPaymentPaidUsdc: credito.inicial,
          paidInstallments: paidCount,
          totalInstallments,
          status:
            credito.estado === 'pagado' || paidCount >= totalInstallments
              ? 'completed'
              : 'active',
        })

        for (const q of cuotas) {
          if (q.estado === 'pagada') continue
          const dueDate = (q.vencimiento || '').slice(0, 10)
          pendingInstallments.push({
            id: String(q.id),
            purchaseId: String(credito.id),
            productName:
              credito.producto_nombre ||
              prod?.nombre ||
              `Producto #${credito.producto_id}`,
            storeName,
            installmentNumber: q.numero,
            totalInstallments,
            amountUsdc: q.monto,
            dueDate,
            status: mapCuotaStatus(q.estado, dueDate),
            memo: q.memo,
            destinationWallet: tienda?.billetera_g || '',
          })
        }
      })

      return { purchasedProducts, pendingInstallments }
    }

    return {
      purchasedProducts: structuredClone(mockPurchasedProducts),
      pendingInstallments: structuredClone(mockPendingInstallments),
    }
  },

  /**
   * Obtiene solo los productos comprados del usuario.
   */
  async getPurchasedProducts(walletAddress: string): Promise<PurchasedProduct[]> {
    if (isRemoteApiConfigured) {
      const portfolio = await this.getUserPortfolio(walletAddress)
      return portfolio.purchasedProducts
    }
    return structuredClone(mockPurchasedProducts)
  },

  /**
   * Obtiene solo las cuotas/productos pendientes de pago.
   */
  async getPendingInstallments(walletAddress: string): Promise<PendingInstallment[]> {
    if (isRemoteApiConfigured) {
      const portfolio = await this.getUserPortfolio(walletAddress)
      return portfolio.pendingInstallments
    }
    return structuredClone(mockPendingInstallments)
  },

  /**
   * Lista el catálogo de productos disponibles: GET /api/v1/productos
   */
  async getProductsCatalog(): Promise<ProductCatalogItem[]> {
    if (isRemoteApiConfigured) {
      const [productos, tiendas] = await Promise.all([
        apiRequest<BackendProductoResponse[]>(RUTA_CATALOGO_PRODUCTOS),
        apiRequest<BackendTiendaResponse[]>(RUTA_OBTENER_TIENDAS),
      ])
      const tiendasById = new Map(tiendas.map((t) => [t.id, t]))
      return productos.map((p) => mapProductoToCatalogItem(p, tiendasById))
    }
    return structuredClone(mockCatalog)
  },

  /**
   * Busca un producto y sus especificaciones a partir del código QR escaneado:
   * GET /api/v1/productos/codigo/:codigo
   */
  async getProductByQrCode(qrCode: string): Promise<ProductCatalogItem | null> {
    const normalized = qrCode.trim().toUpperCase()
    if (!normalized) return null

    if (isRemoteApiConfigured) {
      try {
        const [producto, tiendas] = await Promise.all([
          apiRequest<BackendProductoResponse>(RUTA_PRODUCTO_POR_QR(normalized)),
          apiRequest<BackendTiendaResponse[]>(RUTA_OBTENER_TIENDAS),
        ])
        const tiendasById = new Map(tiendas.map((t) => [t.id, t]))
        return mapProductoToCatalogItem(producto, tiendasById)
      } catch {
        return null
      }
    }
    return (
      mockCatalog.find(
        (item) =>
          item.qrCode.toUpperCase() === normalized ||
          item.id.toUpperCase() === normalized,
      ) ?? null
    )
  },

  /**
   * Registra una nueva compra a crédito usando:
   * POST /api/v1/creditos y POST /api/v1/cuotas/generar
   */
  async createCreditPurchase(
    payload: CreateCreditPurchaseRequest,
  ): Promise<PurchasedProduct> {
    if (isRemoteApiConfigured) {
      const [cliente, producto] = await Promise.all([
        apiRequest<BackendClientResponse>(
          RUTA_CLIENTE_POR_WALLET(payload.walletAddress),
        ),
        apiRequest<BackendProductoResponse>(RUTA_PRODUCTO_POR_ID(payload.productId)),
      ])

      const total = Number((producto.precio_usd * 1.05).toFixed(2))
      const inicial = Number((total / 2).toFixed(2))
      const saldoRestante = Number((total - inicial).toFixed(2))

      const credito = await apiRequest<BackendCreditoResponse>(RUTA_CREAR_CREDITO, {
        method: 'POST',
        body: JSON.stringify({
          cliente_id: cliente.id,
          producto_id: producto.id,
          total,
          inicial,
          estado: 'activo',
        }),
      })

      await apiRequest<BackendCuotaResponse[]>(RUTA_GENERAR_CUOTAS, {
        method: 'POST',
        body: JSON.stringify({
          credito_id: credito.id,
          saldo_restante: saldoRestante,
          cantidad_cuotas: 4,
          intervalo_dias: 15,
        }),
      })

      return {
        id: String(credito.id),
        productId: String(credito.producto_id),
        productName: producto.nombre,
        storeName: producto.tienda_nombre || `Tienda #${producto.tienda_id}`,
        purchasedAt: (credito.fecha || new Date().toISOString()).slice(0, 10),
        totalAmountUsdc: credito.total,
        downPaymentPaidUsdc: credito.inicial,
        paidInstallments: 0,
        totalInstallments: 4,
        status: 'active',
        txHash: payload.downPaymentTxHash,
      }
    }

    const product = mockCatalog.find((p) => p.id === payload.productId)
    if (!product) {
      throw new Error('Producto no encontrado')
    }

    const now = new Date()
    const purchaseId = `pur-${Date.now().toString().slice(-4)}`

    const newPurchase: PurchasedProduct = {
      id: purchaseId,
      productId: product.id,
      productName: product.name,
      storeName: product.storeName,
      purchasedAt: now.toISOString().slice(0, 10),
      totalAmountUsdc: product.totalPriceUsdc,
      downPaymentPaidUsdc: product.downPaymentUsdc,
      paidInstallments: 0,
      totalInstallments: product.installmentsCount,
      status: 'active',
      txHash: payload.downPaymentTxHash,
    }

    const generatedInstallments: PendingInstallment[] = Array.from(
      { length: product.installmentsCount },
      (_, idx) => {
        const number = idx + 1
        const instId = `inst-${Date.now().toString().slice(-4)}-${number}`
        return {
          id: instId,
          purchaseId,
          productName: product.name,
          storeName: product.storeName,
          installmentNumber: number,
          totalInstallments: product.installmentsCount,
          amountUsdc: product.installmentAmountUsdc,
          dueDate: addDays(now, product.intervalDays * number),
          status: 'pending',
          memo: `ALFIO-${instId.toUpperCase()}`,
          destinationWallet: product.storeWallet,
        }
      },
    )

    mockPurchasedProducts = [newPurchase, ...mockPurchasedProducts]
    mockPendingInstallments = [...generatedInstallments, ...mockPendingInstallments]

    return structuredClone(newPurchase)
  },

  /**
   * Registra el pago y actualiza el estado de la cuota usando:
   * POST /api/v1/pagos y PATCH /api/v1/cuotas/:id/estado
   */
  async payInstallment(payload: PayInstallmentRequest): Promise<void> {
    if (isRemoteApiConfigured) {
      const cuotaId = Number(payload.installmentId)
      if (payload.txHash && Number.isFinite(cuotaId) && cuotaId > 0) {
        const pending = await this.getPendingInstallments(payload.walletAddress)
        const target = pending.find((i) => i.id === payload.installmentId)
        await apiRequest(RUTA_REGISTRAR_PAGO, {
          method: 'POST',
          body: JSON.stringify({
            cuota_id: cuotaId,
            monto: target?.amountUsdc ?? 1,
            hash_stellar: payload.txHash,
          }),
        })
      }

      await apiRequest(RUTA_ACTUALIZAR_ESTADO_CUOTA(payload.installmentId), {
        method: 'PATCH',
        body: JSON.stringify({ estado: 'pagada' }),
      })
      return
    }

    const target = mockPendingInstallments.find(
      (item) => item.id === payload.installmentId,
    )
    if (!target) {
      throw new Error('Cuota no encontrada')
    }

    mockPendingInstallments = mockPendingInstallments.filter(
      (item) => item.id !== payload.installmentId,
    )

    mockPurchasedProducts = mockPurchasedProducts.map((purchase) => {
      if (purchase.id !== target.purchaseId) return purchase
      const nextPaid = purchase.paidInstallments + 1
      return {
        ...purchase,
        paidInstallments: nextPaid,
        status: nextPaid >= purchase.totalInstallments ? 'completed' : 'active',
      }
    })
  },

  /**
   * Envía la solicitud de compra al backend para notificar a la tienda por SSE:
   * POST /api/v1/stellar/orders
   */
  async createStellarOrder(params: {
    product: ProductCatalogItem
    buyerWallet: string
    buyerName?: string
  }): Promise<StellarOrderResponse> {
    if (isRemoteApiConfigured) {
      let buyerName = params.buyerName?.trim() || ''
      if (!buyerName) {
        try {
          const cliente = await apiRequest<BackendClientResponse>(
            RUTA_CLIENTE_POR_WALLET(params.buyerWallet),
          )
          buyerName = cliente.nombre
        } catch {
          buyerName = 'Cliente alFio'
        }
      }

      return apiRequest<StellarOrderResponse>(RUTA_CREAR_ORDEN_STELLAR, {
        method: 'POST',
        body: JSON.stringify({
          productId: params.product.id,
          productCode: params.product.qrCode,
          productName: params.product.name,
          description: params.product.description,
          specs: params.product.specs,
          buyerName,
          buyerWallet: params.buyerWallet,
          storeWallet: params.product.storeWallet,
          totalPriceUsdc: params.product.totalPriceUsdc,
        }),
      })
    }

    const orderId = `ORD-${Date.now().toString().slice(-5)}`
    return {
      orderId,
      memo: `ALFIO-${orderId}`,
      storeWallet: params.product.storeWallet,
      downPaymentUsdc: params.product.downPaymentUsdc,
      totalPriceUsdc: params.product.totalPriceUsdc,
    }
  },

  /**
   * SSE del comprador: escucha si la tienda acepta (order_accepted) o rechaza (order_rejected):
   * GET /api/v1/stellar/orders/:orderId/events
   */
  subscribeToOrderStatus(
    orderId: string,
    handlers: {
      onAccepted: (ev: OrderStatusEvent) => void
      onRejected: (ev: OrderStatusEvent) => void
      onError?: () => void
    },
  ): () => void {
    if (!isRemoteApiConfigured) {
      const timer = setTimeout(() => {
        handlers.onAccepted({
          orderId,
          status: 'accepted',
          memo: `ALFIO-${orderId}`,
        })
      }, 1500)
      return () => clearTimeout(timer)
    }

    const source = new EventSource(RUTA_SSE_ESTADO_ORDEN(orderId))

    source.addEventListener('order_accepted', (event) => {
      try {
        const parsed = JSON.parse((event as MessageEvent<string>).data) as OrderStatusEvent
        handlers.onAccepted(parsed)
      } finally {
        source.close()
      }
    })

    source.addEventListener('order_rejected', (event) => {
      try {
        const parsed = JSON.parse((event as MessageEvent<string>).data) as OrderStatusEvent
        handlers.onRejected(parsed)
      } finally {
        source.close()
      }
    })

    source.onerror = () => {
      handlers.onError?.()
    }

    return () => {
      source.close()
    }
  },

  /**
   * Confirma el hash devuelto por Pollar en el backend (verifica en Horizon y dispara SSE "Pagado" a la tienda):
   * POST /api/v1/stellar/orders/:orderId/confirm
   */
  async confirmStellarOrderPayment(orderId: string, txHash: string): Promise<void> {
    if (!isRemoteApiConfigured) return
    await apiRequest(RUTA_CONFIRMAR_PAGO_ORDEN(orderId), {
      method: 'POST',
      body: JSON.stringify({ txHash }),
    })
  },
}
