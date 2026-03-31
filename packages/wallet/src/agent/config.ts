import { LogLevel } from '@credo-ts/core'

export const BCOVRIN_TEST_GENESIS_URL = 'http://test.bcovrin.vonx.io/genesis'
export const BCOVRIN_TEST_NAMESPACE = 'bcovrin:test'
export const DEFAULT_WALLET_ID = 'vero-wallet-holder'
export const DEFAULT_WALLET_KEY = 'vero-wallet-holder-local-key'
export const DEFAULT_WALLET_DB_FILENAME = 'vero-wallet.sqlite'

export interface WalletAgentConfig {
  allowInsecureHttpUrls: boolean
  bcovrinGenesisUrl: string
  indyNamespace: string
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
    bcovrinGenesisUrl: BCOVRIN_TEST_GENESIS_URL,
    indyNamespace: BCOVRIN_TEST_NAMESPACE,
    logLevel: LogLevel.info,
    walletDbPath: buildWalletDbPath(documentDirectoryPath),
    walletId: DEFAULT_WALLET_ID,
    walletKey: DEFAULT_WALLET_KEY,
    walletKeyDerivationMethod: 'kdf:argon2i:mod',
  }
}
