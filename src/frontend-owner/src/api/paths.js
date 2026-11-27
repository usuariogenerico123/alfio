const env = import.meta.env

export const API_URL =
  (env.API_BASE_URL || env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
console.log(API_URL);

export const IS_REMOTE_API_CONFIGURED = Boolean(API_URL)

const SSE_ORDERS_BASE_PATH =
  (env.SSE_ORDERS_PATH || env.VITE_SSE_ORDERS_PATH || '/api/v1/owner/events/orders').trim()

  
const SSE_PAYMENTS_BASE_PATH =
  (env.SSE_PAYMENTS_PATH || env.VITE_SSE_PAYMENTS_PATH || '/api/v1/owner/events/payments').trim()

// Rutas HTTP del backend Go/Gin consumidas por frontend-owner
export let RUTA_REGISTRAR_OWNER = API_URL + '/api/v1/tiendas'
export let RUTA_OBTENER_TIENDAS = API_URL + '/api/v1/tiendas'
export let RUTA_PERFIL_OWNER_POR_WALLET = (wallet) =>
  API_URL + `/api/v1/tiendas/wallet/${encodeURIComponent(wallet)}`
export let RUTA_PERFIL_OWNER_POR_ID = (id) =>
  API_URL + `/api/v1/tiendas/${encodeURIComponent(id)}`

export let RUTA_ANADIR_PRODUCTO = API_URL + '/api/v1/productos'
export let RUTA_OBTENER_PRODUCTOS = API_URL + '/api/v1/productos'
export let RUTA_PRODUCTOS_POR_TIENDA = (tiendaId) =>
  API_URL + `/api/v1/productos/tienda/${encodeURIComponent(tiendaId)}`

export let RUTA_CLIENTES_OWNER = API_URL + '/api/v1/clients'
export let RUTA_VENTAS_OWNER = API_URL + '/api/v1/creditos'
export let RUTA_CUOTAS_OWNER = API_URL + '/api/v1/cuotas'

// Rutas Stellar / SSE (tiempo real con Horizon)
export let RUTA_ACEPTAR_ORDEN = (orderId) =>
  API_URL + `/api/v1/owner/orders/${encodeURIComponent(orderId)}/accept`
export let RUTA_SSE_ORDENES = API_URL + SSE_ORDERS_BASE_PATH
export let RUTA_SSE_PAGOS = (orderId) =>
  API_URL + `${SSE_PAYMENTS_BASE_PATH}/${encodeURIComponent(orderId)}`
