import path from 'node:path'

import { LogLevel } from '@credo-ts/core'

import {
  BCOVRIN_TEST_GENESIS_URL,
  BCOVRIN_TEST_NAMESPACE,
  DEFAULT_ACTIVE_ENROLLMENT_STATUSES,
  DEFAULT_API_PORT,
  DEFAULT_DIDCOMM_PORT,
  DEFAULT_INVITATION_URL_BASE,
  DEFAULT_PUBLIC_DIDCOMM_ENDPOINT,
  DEFAULT_STUDENT_SCHEMA_NAME,
  DEFAULT_STUDENT_SCHEMA_VERSION,
  resolveVerifierAgentConfig,
} from '../src/config.js'

describe('resolveVerifierAgentConfig', () => {
  test('returns the expected defaults for the local workspace', () => {
    const workspaceRoot = path.join('C:', 'vero', 'packages', 'verifier-agent')

    const config = resolveVerifierAgentConfig({}, workspaceRoot)

    expect(config).toEqual({
      activeEnrollmentStatuses: DEFAULT_ACTIVE_ENROLLMENT_STATUSES,
      agentName: 'Vero Verifier Agent',
      allowInsecureHttpUrls: true,
      apiHost: '0.0.0.0',
      apiPort: DEFAULT_API_PORT,
      bcovrinGenesisUrl: BCOVRIN_TEST_GENESIS_URL,
      didCommPath: '/didcomm',
      didCommPort: DEFAULT_DIDCOMM_PORT,
      expectedCredentialDefinitionId: undefined,
      expectedIssuerId: undefined,
      invitationUrlBase: DEFAULT_INVITATION_URL_BASE,
      indyNamespace: BCOVRIN_TEST_NAMESPACE,
      logLevel: LogLevel.info,
      publicDidCommEndpoint: DEFAULT_PUBLIC_DIDCOMM_ENDPOINT,
      studentCredentialSchemaName: DEFAULT_STUDENT_SCHEMA_NAME,
      studentCredentialSchemaVersion: DEFAULT_STUDENT_SCHEMA_VERSION,
      walletDbPath: path.join(workspaceRoot, '.data', 'wallet', 'verifier-agent.sqlite'),
      walletId: 'vero-verifier-agent',
      walletKey: 'vero-verifier-agent-local-key',
      walletKeyDerivationMethod: 'kdf:argon2i:mod',
    })
  })

  test('applies environment overrides and resolves relative wallet paths', () => {
    const workspaceRoot = path.join('C:', 'vero', 'packages', 'verifier-agent')

    const config = resolveVerifierAgentConfig(
      {
        VERO_VERIFIER_AGENT_ACTIVE_ENROLLMENT_STATUSES: 'active, enrolled,ACTIVE',
        VERO_VERIFIER_AGENT_API_HOST: '127.0.0.1',
        VERO_VERIFIER_AGENT_API_PORT: '3200',
        VERO_VERIFIER_AGENT_BCOVRIN_GENESIS_URL: 'http://localhost:9000/genesis',
        VERO_VERIFIER_AGENT_BCOVRIN_NAMESPACE: 'local:test',
        VERO_VERIFIER_AGENT_DIDCOMM_PATH: 'proofs',
        VERO_VERIFIER_AGENT_DIDCOMM_PORT: '3201',
        VERO_VERIFIER_AGENT_EXPECTED_CREDENTIAL_DEFINITION_ID:
          'did:indy:bcovrin:test:issuer/anoncreds/v0/CLAIM_DEF/1/tag',
        VERO_VERIFIER_AGENT_EXPECTED_ISSUER_ID: 'did:indy:bcovrin:test:issuer',
        VERO_VERIFIER_AGENT_INVITATION_URL_BASE: 'http://localhost:3200/proof-request',
        VERO_VERIFIER_AGENT_LOG_LEVEL: 'debug',
        VERO_VERIFIER_AGENT_NAME: 'UCT Verifier',
        VERO_VERIFIER_AGENT_PUBLIC_DIDCOMM_ENDPOINT: 'http://localhost:3201/proofs',
        VERO_VERIFIER_AGENT_STUDENT_SCHEMA_NAME: 'Custom Student Credential',
        VERO_VERIFIER_AGENT_STUDENT_SCHEMA_VERSION: '2.0.0',
        VERO_VERIFIER_AGENT_WALLET_DB_PATH: '.runtime/custom.sqlite',
        VERO_VERIFIER_AGENT_WALLET_ID: 'custom-wallet',
        VERO_VERIFIER_AGENT_WALLET_KEY: 'super-secret',
        VERO_VERIFIER_AGENT_WALLET_KEY_DERIVATION_METHOD: 'raw',
      },
      workspaceRoot,
    )

    expect(config.agentName).toBe('UCT Verifier')
    expect(config.activeEnrollmentStatuses).toEqual(['active', 'enrolled'])
    expect(config.apiHost).toBe('127.0.0.1')
    expect(config.apiPort).toBe(3200)
    expect(config.bcovrinGenesisUrl).toBe('http://localhost:9000/genesis')
    expect(config.didCommPath).toBe('/proofs')
    expect(config.didCommPort).toBe(3201)
    expect(config.expectedCredentialDefinitionId).toBe(
      'did:indy:bcovrin:test:issuer/anoncreds/v0/CLAIM_DEF/1/tag',
    )
    expect(config.expectedIssuerId).toBe('did:indy:bcovrin:test:issuer')
    expect(config.indyNamespace).toBe('local:test')
    expect(config.invitationUrlBase).toBe('http://localhost:3200/proof-request')
    expect(config.logLevel).toBe(LogLevel.debug)
    expect(config.publicDidCommEndpoint).toBe('http://localhost:3201/proofs')
    expect(config.studentCredentialSchemaName).toBe('Custom Student Credential')
    expect(config.studentCredentialSchemaVersion).toBe('2.0.0')
    expect(config.walletDbPath).toBe(path.resolve(workspaceRoot, '.runtime/custom.sqlite'))
    expect(config.walletId).toBe('custom-wallet')
    expect(config.walletKey).toBe('super-secret')
    expect(config.walletKeyDerivationMethod).toBe('raw')
  })
})
