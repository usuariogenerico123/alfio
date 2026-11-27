const env = import.meta.env

export const API_URL =
  (env.VITE_API_BASE_URL || env.API_BASE_URL || '').trim().replace(/\/+$/, '')
console.log(API_URL);



export const IS_REMOTE_API_CONFIGURED = Boolean(API_URL)

// Rutas HTTP del backend Go/Gin consumidas por frontend-client
export let RUTA_CREAR_CLIENTE = API_URL + '/api/v1/clients'
export let RUTA_CLIENTE_POR_WALLET = (walletAddress) =>
  API_URL + `/api/v1/clients/wallet/${encodeURIComponent(walletAddress)}`

export let RUTA_OBTENER_TIENDAS = API_URL + '/api/v1/tiendas'
export let RUTA_TIENDA_POR_ID = (tiendaId) =>
  API_URL + `/api/v1/tiendas/${encodeURIComponent(tiendaId)}`

export let RUTA_CATALOGO_PRODUCTOS = API_URL + '/api/v1/productos'
export let RUTA_PRODUCTO_POR_ID = (productId) =>
  API_URL + `/api/v1/productos/${encodeURIComponent(productId)}`
export let RUTA_PRODUCTO_POR_QR = (codigoProducto) =>
  API_URL + `/api/v1/productos/codigo/${encodeURIComponent(codigoProducto)}`

export let RUTA_CREAR_CREDITO = API_URL + '/api/v1/creditos'
export let RUTA_CREDITOS_POR_CLIENTE = (clienteId) =>
  API_URL + `/api/v1/creditos/cliente/${encodeURIComponent(clienteId)}`

export let RUTA_GENERAR_CUOTAS = API_URL + '/api/v1/cuotas/generar'
export let RUTA_CUOTAS_POR_CREDITO = (creditoId) =>
  API_URL + `/api/v1/cuotas/credito/${encodeURIComponent(creditoId)}`
export let RUTA_ACTUALIZAR_ESTADO_CUOTA = (cuotaId) =>
  API_URL + `/api/v1/cuotas/${encodeURIComponent(cuotaId)}/estado`

export let RUTA_REGISTRAR_PAGO = API_URL + '/api/v1/pagos'

// Rutas Stellar / SSE del backend (comprador)
export let RUTA_CREAR_ORDEN_STELLAR = API_URL + '/api/v1/stellar/orders'
export let RUTA_SSE_ESTADO_ORDEN = (orderId) =>
  API_URL + `/api/v1/stellar/orders/${encodeURIComponent(orderId)}/events`
export let RUTA_CONFIRMAR_PAGO_ORDEN = (orderId) =>
  API_URL + `/api/v1/stellar/orders/${encodeURIComponent(orderId)}/confirm`
