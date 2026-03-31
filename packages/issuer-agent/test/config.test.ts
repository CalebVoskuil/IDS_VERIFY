import path from 'node:path'

import { LogLevel } from '@credo-ts/core'

import {
  DEFAULT_API_HOST,
  DEFAULT_API_PORT,
  BCOVRIN_TEST_GENESIS_URL,
  BCOVRIN_TEST_REGISTER_URL,
  BCOVRIN_TEST_NAMESPACE,
  DEFAULT_DIDCOMM_PATH,
  DEFAULT_DIDCOMM_PORT,
  DEFAULT_INVITATION_URL_BASE,
  DEFAULT_PUBLIC_DIDCOMM_ENDPOINT,
  resolveIssuerAgentConfig,
} from '../src/config.js'

describe('resolveIssuerAgentConfig', () => {
  test('returns the expected defaults for the local workspace', () => {
    const workspaceRoot = path.join('C:', 'vero', 'packages', 'issuer-agent')

    const config = resolveIssuerAgentConfig({}, workspaceRoot)

    expect(config).toEqual({
      agentName: 'Vero Issuer Agent',
      allowInsecureHttpUrls: true,
      apiHost: DEFAULT_API_HOST,
      apiPort: DEFAULT_API_PORT,
      bcovrinGenesisUrl: BCOVRIN_TEST_GENESIS_URL,
      bcovrinRegisterUrl: BCOVRIN_TEST_REGISTER_URL,
      didCommPath: DEFAULT_DIDCOMM_PATH,
      didCommPort: DEFAULT_DIDCOMM_PORT,
      indyNamespace: BCOVRIN_TEST_NAMESPACE,
      invitationUrlBase: DEFAULT_INVITATION_URL_BASE,
      logLevel: LogLevel.info,
      publicDidAlias: 'vero-uct-issuer',
      publicDidCommEndpoint: DEFAULT_PUBLIC_DIDCOMM_ENDPOINT,
      publicDidSeed: 'vero-uct-issuer-seed-0000000001x',
      studentCredentialDefinitionTag: 'uct-student-v1',
      studentCredentialSchemaName: 'Vero UCT Student Credential',
      studentCredentialSchemaVersion: '1.0.0',
      walletDbPath: path.join(workspaceRoot, '.data', 'wallet', 'issuer-agent.sqlite'),
      walletId: 'vero-issuer-agent',
      walletKey: 'vero-issuer-agent-local-key',
      walletKeyDerivationMethod: 'kdf:argon2i:mod',
    })
  })

  test('applies environment overrides and resolves relative wallet paths', () => {
    const workspaceRoot = path.join('C:', 'vero', 'packages', 'issuer-agent')

    const config = resolveIssuerAgentConfig(
      {
        VERO_ISSUER_AGENT_NAME: 'UCT Issuer',
        VERO_ISSUER_AGENT_API_HOST: '127.0.0.1',
        VERO_ISSUER_AGENT_API_PORT: '3300',
        VERO_ISSUER_AGENT_BCOVRIN_GENESIS_URL: 'http://localhost:9000/genesis',
        VERO_ISSUER_AGENT_BCOVRIN_REGISTER_URL: 'https://localhost:9000/register',
        VERO_ISSUER_AGENT_BCOVRIN_NAMESPACE: 'local:test',
        VERO_ISSUER_AGENT_DIDCOMM_PATH: 'custom-didcomm',
        VERO_ISSUER_AGENT_DIDCOMM_PORT: '3301',
        VERO_ISSUER_AGENT_INVITATION_URL_BASE: 'http://localhost:3300/oob',
        VERO_ISSUER_AGENT_LOG_LEVEL: 'debug',
        VERO_ISSUER_AGENT_PUBLIC_DID_ALIAS: 'uct-admin',
        VERO_ISSUER_AGENT_PUBLIC_DIDCOMM_ENDPOINT: 'http://localhost:3301/custom-didcomm',
        VERO_ISSUER_AGENT_PUBLIC_DID_SEED: '12345678901234567890123456789012',
        VERO_ISSUER_AGENT_STUDENT_CREDENTIAL_DEFINITION_TAG: 'student-v2',
        VERO_ISSUER_AGENT_STUDENT_SCHEMA_NAME: 'UCT Student Card',
        VERO_ISSUER_AGENT_STUDENT_SCHEMA_VERSION: '1.1.0',
        VERO_ISSUER_AGENT_WALLET_DB_PATH: '.runtime/custom.sqlite',
        VERO_ISSUER_AGENT_WALLET_ID: 'custom-wallet',
        VERO_ISSUER_AGENT_WALLET_KEY: 'super-secret',
        VERO_ISSUER_AGENT_WALLET_KEY_DERIVATION_METHOD: 'raw',
      },
      workspaceRoot,
    )

    expect(config.agentName).toBe('UCT Issuer')
    expect(config.apiHost).toBe('127.0.0.1')
    expect(config.apiPort).toBe(3300)
    expect(config.bcovrinGenesisUrl).toBe('http://localhost:9000/genesis')
    expect(config.bcovrinRegisterUrl).toBe('https://localhost:9000/register')
    expect(config.didCommPath).toBe('/custom-didcomm')
    expect(config.didCommPort).toBe(3301)
    expect(config.indyNamespace).toBe('local:test')
    expect(config.invitationUrlBase).toBe('http://localhost:3300/oob')
    expect(config.logLevel).toBe(LogLevel.debug)
    expect(config.publicDidAlias).toBe('uct-admin')
    expect(config.publicDidCommEndpoint).toBe('http://localhost:3301/custom-didcomm')
    expect(config.publicDidSeed).toBe('12345678901234567890123456789012')
    expect(config.studentCredentialDefinitionTag).toBe('student-v2')
    expect(config.studentCredentialSchemaName).toBe('UCT Student Card')
    expect(config.studentCredentialSchemaVersion).toBe('1.1.0')
    expect(config.walletDbPath).toBe(path.resolve(workspaceRoot, '.runtime/custom.sqlite'))
    expect(config.walletId).toBe('custom-wallet')
    expect(config.walletKey).toBe('super-secret')
    expect(config.walletKeyDerivationMethod).toBe('raw')
  })
})
