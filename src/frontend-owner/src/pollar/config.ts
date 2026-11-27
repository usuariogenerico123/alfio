import type { StellarNetwork } from '@pollar/core'

const env = import.meta.env as Record<string, string | undefined>

const rawApiKey =
  env.POLLAR_KEY?.trim() ||
  env.VITE_POLLAR_KEY?.trim() ||
  env.VITE_POLLAR_API_KEY?.trim() ||
  ''

const rawNetwork = (env.VITE_POLLAR_NETWORK || env.POLLAR_NETWORK)?.trim()

export const POLLAR_OWNER_CONFIG = {
  apiKey: rawApiKey || 'pub_testnet_demo_placeholder',
  hasValidApiKey:
    Boolean(rawApiKey) &&
    !rawApiKey.includes('your_key_here') &&
    !rawApiKey.includes('placeholder'),
  stellarNetwork: (rawNetwork === 'mainnet' ? 'mainnet' : 'testnet') as StellarNetwork,
} as const
