import { API_URL, IS_REMOTE_API_CONFIGURED } from './paths.js'

export const API_BASE_URL = API_URL
export const isRemoteApiConfigured = IS_REMOTE_API_CONFIGURED

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText)
    throw new Error(message || `Error HTTP ${response.status}`)
  }

  return (await response.json()) as T
}
