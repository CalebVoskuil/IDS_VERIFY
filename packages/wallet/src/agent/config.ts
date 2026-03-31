import { LogLevel } from '@credo-ts/core'

export const DEFAULT_WALLET_ID = 'vero-wallet-holder'
export const DEFAULT_WALLET_KEY = 'vero-wallet-holder-local-key'
export const DEFAULT_WALLET_DB_FILENAME = 'vero-wallet.sqlite'

export interface WalletAgentConfig {
  allowInsecureHttpUrls: boolean
  logLevel: LogLevel
  walletDbPath: string
  walletId: string
  walletKey: string
  walletKeyDerivationMethod: 'kdf:argon2i:mod'
}

function trimTrailingSlash(value: string) {
  return value.replace(/[\\/]+$/, '')
}

export function buildWalletDbPath(documentDirectoryPath: string) {
  return `${trimTrailingSlash(documentDirectoryPath)}/${DEFAULT_WALLET_DB_FILENAME}`
}

export function createWalletAgentConfig(
  documentDirectoryPath: string,
): WalletAgentConfig {
  return {
    allowInsecureHttpUrls: true,
    logLevel: LogLevel.info,
    walletDbPath: buildWalletDbPath(documentDirectoryPath),
    walletId: DEFAULT_WALLET_ID,
    walletKey: DEFAULT_WALLET_KEY,
    walletKeyDerivationMethod: 'kdf:argon2i:mod',
  }
}
