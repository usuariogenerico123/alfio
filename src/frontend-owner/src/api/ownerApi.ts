import { apiRequest, isRemoteApiConfigured } from './client'
import rawMockData from './mockData.json'
import {
  RUTA_ACEPTAR_ORDEN,
  RUTA_ANADIR_PRODUCTO,
  RUTA_CLIENTES_OWNER,
  RUTA_CUOTAS_OWNER,
  RUTA_OBTENER_PRODUCTOS,
  RUTA_OBTENER_TIENDAS,
  RUTA_PERFIL_OWNER_POR_WALLET,
  RUTA_PRODUCTOS_POR_TIENDA,
  RUTA_RECHAZAR_ORDEN,
  RUTA_REGISTRAR_OWNER,
  RUTA_VENTAS_OWNER,
} from './paths.js'
import type {
  CreateProductRequest,
  CreateProductResponse,
  OwnerDashboardData,
  OwnerMetrics,
  OwnerProduct,
  OwnerProfile,
  PaymentConfirmedEvent,
  ProductSpec,
  SoldProduct,
  StoreClient,
} from './types'

// DTOs exactos devueltos por el backend en Go/Gin
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

interface BackendClientResponse {
  id: number
  nombre: string
  ci: string
  telefono: string
  direccion_billetera: string
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

let mockState: OwnerDashboardData = structuredClone(
  rawMockData as OwnerDashboardData,
)

let mockOwnerProfile: OwnerProfile = {
  storeName: mockState.storeName,
  ownerName: 'Dueño de Tienda',
  email: 'tienda@alfio.app',
}

let activeTiendaId: number | null = null
let activeOwnerWallet: string | null = null

function serializeSpecs(description: string, specs: ProductSpec[]): string {
  const parts: string[] = []
  if (description.trim()) parts.push(description.trim())
  for (const s of specs) {
    if (s.label.trim() && s.value.trim()) {
      parts.push(`${s.label.trim()}: ${s.value.trim()}`)
    }
  }
  return parts.join(' | ') || 'Sin especificaciones'
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

function mapTiendaToProfile(t: BackendTiendaResponse): OwnerProfile {
  activeTiendaId = t.id
  activeOwnerWallet = t.billetera_g
  return {
    storeName: t.nombre,
    ownerName: t.dueno,
    email: t.email_panel,
    walletAddress: t.billetera_g,
  }
}

function mapProductoToOwnerProduct(p: BackendProductoResponse): OwnerProduct {
  const platformFeeUsdc = Number((p.precio_usd * 0.05).toFixed(2))
  const totalPriceUsdc = Number((p.precio_usd + platformFeeUsdc).toFixed(2))
  const { description, specs } = parseSpecs(p.especificaciones || '')

  return {
    id: String(p.id),
    qrCode: p.codigo_producto,
    storeName: p.tienda_nombre,
    name: p.nombre,
    photoUrl: p.foto_url || undefined,
    description,
    specs,
    basePriceUsdc: p.precio_usd,
    platformFeeUsdc,
    totalPriceUsdc,
    stock: p.stock,
    active: p.stock > 0,
  }
}

function computeMetrics(
  creditos: BackendCreditoResponse[],
  cuotas: BackendCuotaResponse[],
): OwnerMetrics {
  const today = new Date().toISOString().slice(0, 10)
  const todayCredits = creditos.filter((c) => (c.fecha || '').slice(0, 10) === today)

  const pendingCuotas = cuotas.filter((q) => q.estado !== 'pagada')
  const receivableToday = pendingCuotas.filter(
    (q) => (q.vencimiento || '').slice(0, 10) === today,
  )
  const overdue = pendingCuotas.filter(
    (q) => q.estado === 'vencida' || (q.vencimiento || '').slice(0, 10) < today,
  )

  return {
    salesTodayUsdc: Number(
      todayCredits.reduce((acc, c) => acc + c.total, 0).toFixed(2),
    ),
    salesTodayCount: todayCredits.length,
    receivableTodayUsdc: Number(
      receivableToday.reduce((acc, q) => acc + q.monto, 0).toFixed(2),
    ),
    receivableTodayCount: receivableToday.length,
    overdueAmountUsdc: Number(
      overdue.reduce((acc, q) => acc + q.monto, 0).toFixed(2),
    ),
    overdueCount: overdue.length,
  }
}

export const ownerApi = {
  /**
   * Registra una tienda en el backend Go/Gin: POST /api/v1/tiendas
   */
  async registerOwner(profile: OwnerProfile): Promise<OwnerProfile> {
    if (isRemoteApiConfigured) {
      const created = await apiRequest<BackendTiendaResponse>(RUTA_REGISTRAR_OWNER, {
        method: 'POST',
        body: JSON.stringify({
          nombre: profile.storeName,
          dueno: profile.ownerName,
          email_panel: profile.email,
          billetera_g: profile.walletAddress?.trim() || '',
        }),
      })
      return mapTiendaToProfile(created)
    }
    mockOwnerProfile = { ...profile }
    mockState = { ...mockState, storeName: profile.storeName }
    return structuredClone(mockOwnerProfile)
  },

  /**
   * Verifica si la tienda existe en la DB por billetera G... (y correo si se provee).
   */
  async verifyOwnerRegistered(
    walletAddress: string,
    email?: string,
  ): Promise<OwnerProfile | null> {
    if (!isRemoteApiConfigured) {
      return structuredClone(mockOwnerProfile)
    }
    try {
      const found = await apiRequest<BackendTiendaResponse>(
        RUTA_PERFIL_OWNER_POR_WALLET(walletAddress),
      )
      if (email && found.email_panel.toLowerCase() !== email.trim().toLowerCase()) {
        return null
      }
      return mapTiendaToProfile(found)
    } catch {
      return null
    }
  },

  /**
   * Obtiene el perfil de la tienda: GET /api/v1/tiendas/wallet/:wallet o GET /api/v1/tiendas
   */
  async getOwnerProfile(walletAddress?: string): Promise<OwnerProfile> {
    if (isRemoteApiConfigured) {
      const wallet = walletAddress?.trim() || activeOwnerWallet
      if (wallet) {
        const found = await apiRequest<BackendTiendaResponse>(
          RUTA_PERFIL_OWNER_POR_WALLET(wallet),
        )
        return mapTiendaToProfile(found)
      }
      const tiendas = await apiRequest<BackendTiendaResponse[]>(RUTA_OBTENER_TIENDAS)
      if (tiendas.length > 0) {
        return mapTiendaToProfile(tiendas[0])
      }
      return structuredClone(mockOwnerProfile)
    }
    return structuredClone(mockOwnerProfile)
  },

  /**
   * Crea un producto en el backend Go/Gin: POST /api/v1/productos
   */
  async createProduct(payload: CreateProductRequest): Promise<CreateProductResponse> {
    if (isRemoteApiConfigured) {
      let tiendaId = activeTiendaId
      if (!tiendaId) {
        const tiendas = await apiRequest<BackendTiendaResponse[]>(RUTA_OBTENER_TIENDAS)
        if (tiendas.length > 0) {
          tiendaId = tiendas[0].id
          activeTiendaId = tiendaId
        }
      }

      const created = await apiRequest<BackendProductoResponse>(RUTA_ANADIR_PRODUCTO, {
        method: 'POST',
        body: JSON.stringify({
          tienda_id: tiendaId ?? 1,
          nombre: payload.name,
          especificaciones: serializeSpecs(payload.description, payload.specs),
          precio_usd: payload.priceUsd,
          stock: payload.stock,
          foto_url: payload.photoUrl ?? '',
        }),
      })

      const product = mapProductoToOwnerProduct(created)
      return {
        product,
        productCode: created.codigo_producto,
      }
    }

    const id = `prod-${Date.now().toString(36)}`
    const productCode = `ALFIO-${id.slice(-4).toUpperCase()}`
    const platformFeeUsdc = Number((payload.priceUsd * 0.05).toFixed(2))
    const totalPriceUsdc = Number((payload.priceUsd + platformFeeUsdc).toFixed(2))

    const newProduct: OwnerProduct = {
      id,
      qrCode: productCode,
      storeName: payload.storeName,
      name: payload.name,
      photoUrl: payload.photoUrl,
      description: payload.description,
      specs: payload.specs,
      basePriceUsdc: payload.priceUsd,
      platformFeeUsdc,
      totalPriceUsdc,
      stock: payload.stock,
      active: true,
    }

    mockState = {
      ...mockState,
      products: [newProduct, ...mockState.products],
    }

    return {
      product: structuredClone(newProduct),
      productCode,
    }
  },

  /**
   * Compone el dashboard consultando las rutas reales del backend:
   * GET /api/v1/productos, GET /api/v1/creditos, GET /api/v1/clients, GET /api/v1/cuotas
   */
  async getDashboardData(): Promise<OwnerDashboardData> {
    if (isRemoteApiConfigured) {
      const [tiendas, rawProducts, rawCreditos, rawClients, rawCuotas] =
        await Promise.all([
          apiRequest<BackendTiendaResponse[]>(RUTA_OBTENER_TIENDAS),
          apiRequest<BackendProductoResponse[]>(
            activeTiendaId
              ? RUTA_PRODUCTOS_POR_TIENDA(activeTiendaId)
              : RUTA_OBTENER_PRODUCTOS,
          ),
          apiRequest<BackendCreditoResponse[]>(RUTA_VENTAS_OWNER),
          apiRequest<BackendClientResponse[]>(RUTA_CLIENTES_OWNER),
          apiRequest<BackendCuotaResponse[]>(RUTA_CUOTAS_OWNER),
        ])

      const currentTienda =
        tiendas.find((t) => t.id === activeTiendaId) ?? tiendas[0]
      if (currentTienda) {
        activeTiendaId = currentTienda.id
        activeOwnerWallet = currentTienda.billetera_g
      }

      const clientsById = new Map(rawClients.map((c) => [c.id, c]))
      const cuotasByCredito = new Map<number, BackendCuotaResponse[]>()
      for (const q of rawCuotas) {
        const list = cuotasByCredito.get(q.credito_id) ?? []
        list.push(q)
        cuotasByCredito.set(q.credito_id, list)
      }

      const soldProducts: SoldProduct[] = rawCreditos.map((c) => {
        const cuotas = cuotasByCredito.get(c.id) ?? []
        const paidCount = cuotas.filter((q) => q.estado === 'pagada').length
        const totalInst = cuotas.length || 4
        const cli = clientsById.get(c.cliente_id)
        return {
          id: String(c.id),
          orderId: `CRED-${c.id}`,
          productCode: `ALFIO-${c.producto_id}`,
          productName: c.producto_nombre || `Producto #${c.producto_id}`,
          buyerName: c.cliente_nombre || cli?.nombre || `Cliente #${c.cliente_id}`,
          buyerWallet: cli?.direccion_billetera || '',
          soldAt: (c.fecha || '').slice(0, 10),
          totalAmountUsdc: c.total,
          downPaymentUsdc: c.inicial,
          paidInstallments: paidCount,
          totalInstallments: totalInst,
          status:
            c.estado === 'pagado' || paidCount >= totalInst ? 'completed' : 'active',
        }
      })

      const today = new Date().toISOString().slice(0, 10)
      const clients: StoreClient[] = rawClients.map((cli) => {
        const cliCreditos = rawCreditos.filter((c) => c.cliente_id === cli.id)
        const cliCuotas = cliCreditos.flatMap(
          (c) => cuotasByCredito.get(c.id) ?? [],
        )
        const pending = cliCuotas.filter((q) => q.estado !== 'pagada')
        const overdue = pending.some(
          (q) => q.estado === 'vencida' || (q.vencimiento || '').slice(0, 10) < today,
        )
        const nextDue =
          pending
            .map((q) => (q.vencimiento || '').slice(0, 10))
            .filter(Boolean)
            .sort()[0] ?? null

        return {
          id: String(cli.id),
          name: cli.nombre,
          walletAddress: cli.direccion_billetera,
          activeCredits: cliCreditos.filter((c) => c.estado !== 'pagado').length,
          pendingBalanceUsdc: Number(
            pending.reduce((acc, q) => acc + q.monto, 0).toFixed(2),
          ),
          nextDueDate: nextDue,
          status: overdue ? 'overdue' : pending.length > 0 ? 'on_time' : 'completed',
        }
      })

      return {
        storeName: currentTienda?.nombre || mockOwnerProfile.storeName,
        metrics: computeMetrics(rawCreditos, rawCuotas),
        products: rawProducts.map(mapProductoToOwnerProduct),
        soldProducts,
        clients,
      }
    }
    return structuredClone(mockState)
  },

  /**
   * Calcula métricas consultando GET /api/v1/creditos y GET /api/v1/cuotas
   */
  async getMetrics(): Promise<OwnerMetrics> {
    if (isRemoteApiConfigured) {
      const [creditos, cuotas] = await Promise.all([
        apiRequest<BackendCreditoResponse[]>(RUTA_VENTAS_OWNER),
        apiRequest<BackendCuotaResponse[]>(RUTA_CUOTAS_OWNER),
      ])
      return computeMetrics(creditos, cuotas)
    }
    return structuredClone(mockState.metrics)
  },

  /**
   * Obtiene los productos: GET /api/v1/productos (o /tienda/:tienda_id)
   */
  async getProducts(): Promise<OwnerProduct[]> {
    if (isRemoteApiConfigured) {
      const list = await apiRequest<BackendProductoResponse[]>(
        activeTiendaId
          ? RUTA_PRODUCTOS_POR_TIENDA(activeTiendaId)
          : RUTA_OBTENER_PRODUCTOS,
      )
      return list.map(mapProductoToOwnerProduct)
    }
    return structuredClone(mockState.products)
  },

  /**
   * Obtiene los créditos/ventas: GET /api/v1/creditos
   */
  async getSoldProducts(): Promise<SoldProduct[]> {
    if (isRemoteApiConfigured) {
      const data = await this.getDashboardData()
      return data.soldProducts
    }
    return structuredClone(mockState.soldProducts)
  },

  /**
   * Obtiene los clientes: GET /api/v1/clients
   */
  async getClients(): Promise<StoreClient[]> {
    if (isRemoteApiConfigured) {
      const data = await this.getDashboardData()
      return data.clients
    }
    return structuredClone(mockState.clients)
  },

  /**
   * Confirma/acepta una orden de compra entrante: POST /api/v1/owner/orders/:orderId/accept
   */
  async acceptOrder(orderId: string): Promise<{ accepted: boolean; orderId: string }> {
    if (isRemoteApiConfigured) {
      return apiRequest<{ accepted: boolean; orderId: string }>(
        RUTA_ACEPTAR_ORDEN(orderId),
        { method: 'POST' },
      )
    }
    return { accepted: true, orderId }
  },

  /**
   * Rechaza una orden de compra entrante: POST /api/v1/owner/orders/:orderId/reject
   */
  async rejectOrder(
    orderId: string,
    reason?: string,
  ): Promise<{ rejected: boolean; orderId: string }> {
    if (isRemoteApiConfigured) {
      return apiRequest<{ rejected: boolean; orderId: string }>(
        RUTA_RECHAZAR_ORDEN(orderId),
        {
          method: 'POST',
          body: JSON.stringify({ reason: reason ?? '' }),
        },
      )
    }
    return { rejected: true, orderId }
  },

  /**
   * Sincroniza un pago confirmado por SSE recargando los datos reales del backend
   */
  async recordConfirmedSale(payment: PaymentConfirmedEvent): Promise<OwnerDashboardData> {
    if (isRemoteApiConfigured) {
      return this.getDashboardData()
    }

    const newSold: SoldProduct = {
      id: `sold-${Date.now().toString().slice(-4)}`,
      orderId: payment.orderId,
      productCode: payment.productCode,
      productName: payment.productName,
      buyerName: payment.buyerName,
      buyerWallet: payment.buyerWallet,
      soldAt: payment.paidAt.slice(0, 10),
      totalAmountUsdc: payment.totalPriceUsdc,
      downPaymentUsdc: payment.amountPaidUsdc,
      paidInstallments: 0,
      totalInstallments: 4,
      status: 'active',
      txHash: payment.txHash,
    }

    const remainingBalance = Math.max(0, payment.totalPriceUsdc - payment.amountPaidUsdc)
    const nextDue = new Date()
    nextDue.setDate(nextDue.getDate() + 15)
    const nextDueIso = nextDue.toISOString().slice(0, 10)

    const existingClient = mockState.clients.find(
      (c) => c.walletAddress === payment.buyerWallet,
    )

    const updatedClients: StoreClient[] = existingClient
      ? mockState.clients.map((c) =>
          c.walletAddress === payment.buyerWallet
            ? {
                ...c,
                activeCredits: c.activeCredits + 1,
                pendingBalanceUsdc: c.pendingBalanceUsdc + remainingBalance,
                nextDueDate: c.nextDueDate ?? nextDueIso,
                status: c.status === 'overdue' ? 'overdue' : 'on_time',
              }
            : c,
        )
      : [
          {
            id: `cli-${Date.now().toString().slice(-4)}`,
            name: payment.buyerName,
            walletAddress: payment.buyerWallet,
            activeCredits: 1,
            pendingBalanceUsdc: remainingBalance,
            nextDueDate: nextDueIso,
            status: 'on_time',
          },
          ...mockState.clients,
        ]

    const updatedProducts = mockState.products.map((p) =>
      p.qrCode === payment.productCode && p.stock > 0
        ? { ...p, stock: p.stock - 1 }
        : p,
    )

    mockState = {
      ...mockState,
      products: updatedProducts,
      soldProducts: [newSold, ...mockState.soldProducts],
      clients: updatedClients,
      metrics: {
        ...mockState.metrics,
        salesTodayUsdc: mockState.metrics.salesTodayUsdc + payment.totalPriceUsdc,
        salesTodayCount: mockState.metrics.salesTodayCount + 1,
      },
    }

    return structuredClone(mockState)
  },
}
