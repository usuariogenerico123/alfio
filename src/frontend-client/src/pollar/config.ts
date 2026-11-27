import type { StellarNetwork } from '@pollar/core'

const env = import.meta.env as Record<string, string | undefined>

const rawApiKey =
  env.POLLLAR_KEY?.trim() ||
  env.VITE_POLLAR_KEY?.trim() ||
  env.POLLAR_KEY?.trim() ||
  env.VITE_POLLAR_API_KEY?.trim() ||
  ''

const rawNetwork = (env.VITE_POLLAR_NETWORK || env.POLLAR_NETWORK)?.trim()

const rawUsdcIssuer =
  (env.STELLAR_USDC_ISSUER || env.POLLAR_USDC_ISSUER)?.trim() ||
  'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'

export const POLLAR_CONFIG = {
  apiKey: rawApiKey || 'pub_testnet_demo_placeholder',
  hasValidApiKey:
    Boolean(rawApiKey) &&
    !rawApiKey.includes('your_key_here') &&
    !rawApiKey.includes('placeholder'),
  stellarNetwork: (rawNetwork === 'mainnet' ? 'mainnet' : 'testnet') as StellarNetwork,
  defaultAssetCode: 'USDC',
  defaultAssetIssuer: rawUsdcIssuer,
} as const
