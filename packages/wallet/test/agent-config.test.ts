import { LogLevel } from '@credo-ts/core'

import {
  BCOVRIN_TEST_GENESIS_URL,
  BCOVRIN_TEST_NAMESPACE,
  DEFAULT_WALLET_DB_FILENAME,
  DEFAULT_WALLET_ID,
  DEFAULT_WALLET_KEY,
  buildWalletDbPath,
  createWalletAgentConfig,
} from '../src/agent/config'

describe('wallet agent config', () => {
  it('builds a sqlite path inside the document directory', () => {
    expect(buildWalletDbPath('/data/user/0/com.vero.wallet/files')).toBe(
      `/data/user/0/com.vero.wallet/files/${DEFAULT_WALLET_DB_FILENAME}`,
    )
  })

  it('normalizes a trailing slash before appending the sqlite file name', () => {
    expect(buildWalletDbPath('/data/user/0/com.vero.wallet/files/')).toBe(
      `/data/user/0/com.vero.wallet/files/${DEFAULT_WALLET_DB_FILENAME}`,
    )
  })

  it('creates the expected wallet bootstrap config', () => {
    const config = createWalletAgentConfig('/wallet-storage')

    expect(config).toEqual({
      allowInsecureHttpUrls: true,
      bcovrinGenesisUrl: BCOVRIN_TEST_GENESIS_URL,
      indyNamespace: BCOVRIN_TEST_NAMESPACE,
      logLevel: LogLevel.info,
      walletDbPath: `/wallet-storage/${DEFAULT_WALLET_DB_FILENAME}`,
      walletId: DEFAULT_WALLET_ID,
      walletKey: DEFAULT_WALLET_KEY,
      walletKeyDerivationMethod: 'kdf:argon2i:mod',
    })
  })
})
