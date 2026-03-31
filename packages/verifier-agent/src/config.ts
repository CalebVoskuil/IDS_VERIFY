import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { LogLevel } from '@credo-ts/core'

export const BCOVRIN_TEST_GENESIS_URL = 'http://test.bcovrin.vonx.io/genesis'
export const BCOVRIN_TEST_NAMESPACE = 'bcovrin:test'
export const DEFAULT_AGENT_NAME = 'Vero Verifier Agent'
export const DEFAULT_WALLET_ID = 'vero-verifier-agent'
export const DEFAULT_WALLET_KEY = 'vero-verifier-agent-local-key'
export const DEFAULT_WALLET_DB_FILENAME = 'verifier-agent.sqlite'
export const DEFAULT_WALLET_KEY_DERIVATION_METHOD = 'kdf:argon2i:mod'
export const DEFAULT_API_HOST = '0.0.0.0'
export const DEFAULT_API_PORT = 3100
export const DEFAULT_DIDCOMM_PORT = 3101
export const DEFAULT_DIDCOMM_PATH = '/didcomm'
export const DEFAULT_INVITATION_URL_BASE = `http://localhost:${DEFAULT_API_PORT}/proof-request`
export const DEFAULT_PUBLIC_DIDCOMM_ENDPOINT = `http://localhost:${DEFAULT_DIDCOMM_PORT}${DEFAULT_DIDCOMM_PATH}`
export const DEFAULT_STUDENT_SCHEMA_NAME = 'Vero UCT Student Credential'
export const DEFAULT_STUDENT_SCHEMA_VERSION = '1.0.0'
export const DEFAULT_ACTIVE_ENROLLMENT_STATUSES = ['active', 'current', 'enrolled', 'registered']

const DEFAULT_WORKSPACE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export interface VerifierAgentConfig {
  agentName: string
  allowInsecureHttpUrls: boolean
  apiHost: string
  apiPort: number
  bcovrinGenesisUrl: string
  didCommPath: string
  didCommPort: number
  expectedCredentialDefinitionId?: string
  expectedIssuerId?: string
  invitationUrlBase: string
  indyNamespace: string
  logLevel: LogLevel
  activeEnrollmentStatuses: string[]
  publicDidCommEndpoint: string
  studentCredentialSchemaName: string
  studentCredentialSchemaVersion: string
  walletDbPath: string
  walletId: string
  walletKey: string
  walletKeyDerivationMethod: 'kdf:argon2i:mod' | 'kdf:argon2i:int' | 'raw'
}

export function parseLogLevel(value?: string): LogLevel {
  switch (value?.toLowerCase()) {
    case undefined:
    case 'info':
      return LogLevel.info
    case 'test':
      return LogLevel.test
    case 'trace':
      return LogLevel.trace
    case 'debug':
      return LogLevel.debug
    case 'warn':
      return LogLevel.warn
    case 'error':
      return LogLevel.error
    case 'fatal':
      return LogLevel.fatal
    case 'off':
      return LogLevel.off
    default:
      throw new Error(`Unsupported verifier-agent log level: ${value}`)
  }
}

function resolveWalletDbPath(workspaceRoot: string, walletDbPath?: string): string {
  if (!walletDbPath) {
    return path.join(workspaceRoot, '.data', 'wallet', DEFAULT_WALLET_DB_FILENAME)
  }

  return path.isAbsolute(walletDbPath) ? walletDbPath : path.resolve(workspaceRoot, walletDbPath)
}

function parsePort(
  value: string | undefined,
  fallback: number,
  envVarName: string,
): number {
  if (!value) {
    return fallback
  }

  const parsedPort = Number.parseInt(value, 10)

  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    throw new Error(`Unsupported ${envVarName} port: ${value}`)
  }

  return parsedPort
}

function normalizeUrlPath(value: string | undefined, fallback: string): string {
  const normalizedValue = value?.trim() || fallback

  return normalizedValue.startsWith('/') ? normalizedValue : `/${normalizedValue}`
}

function parseActiveEnrollmentStatuses(value?: string): string[] {
  const source = value?.trim()

  if (!source) {
    return [...DEFAULT_ACTIVE_ENROLLMENT_STATUSES]
  }

  const statuses = source
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)

  if (statuses.length === 0) {
    throw new Error('VERO_VERIFIER_AGENT_ACTIVE_ENROLLMENT_STATUSES must not be empty')
  }

  return Array.from(new Set(statuses))
}

export function resolveVerifierAgentConfig(
  env: NodeJS.ProcessEnv = process.env,
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
): VerifierAgentConfig {
  const walletKeyDerivationMethod =
    env.VERO_VERIFIER_AGENT_WALLET_KEY_DERIVATION_METHOD ?? DEFAULT_WALLET_KEY_DERIVATION_METHOD

  if (
    walletKeyDerivationMethod !== 'kdf:argon2i:mod' &&
    walletKeyDerivationMethod !== 'kdf:argon2i:int' &&
    walletKeyDerivationMethod !== 'raw'
  ) {
    throw new Error(
      `Unsupported verifier-agent wallet key derivation method: ${walletKeyDerivationMethod}`,
    )
  }

  const didCommPath = normalizeUrlPath(
    env.VERO_VERIFIER_AGENT_DIDCOMM_PATH,
    DEFAULT_DIDCOMM_PATH,
  )

  return {
    agentName: env.VERO_VERIFIER_AGENT_NAME ?? DEFAULT_AGENT_NAME,
    allowInsecureHttpUrls: true,
    activeEnrollmentStatuses: parseActiveEnrollmentStatuses(
      env.VERO_VERIFIER_AGENT_ACTIVE_ENROLLMENT_STATUSES,
    ),
    apiHost: env.VERO_VERIFIER_AGENT_API_HOST ?? DEFAULT_API_HOST,
    apiPort: parsePort(
      env.VERO_VERIFIER_AGENT_API_PORT,
      DEFAULT_API_PORT,
      'VERO_VERIFIER_AGENT_API',
    ),
    bcovrinGenesisUrl: env.VERO_VERIFIER_AGENT_BCOVRIN_GENESIS_URL ?? BCOVRIN_TEST_GENESIS_URL,
    didCommPath,
    didCommPort: parsePort(
      env.VERO_VERIFIER_AGENT_DIDCOMM_PORT,
      DEFAULT_DIDCOMM_PORT,
      'VERO_VERIFIER_AGENT_DIDCOMM',
    ),
    expectedCredentialDefinitionId:
      env.VERO_VERIFIER_AGENT_EXPECTED_CREDENTIAL_DEFINITION_ID?.trim() || undefined,
    expectedIssuerId: env.VERO_VERIFIER_AGENT_EXPECTED_ISSUER_ID?.trim() || undefined,
    invitationUrlBase:
      env.VERO_VERIFIER_AGENT_INVITATION_URL_BASE ?? DEFAULT_INVITATION_URL_BASE,
    indyNamespace: env.VERO_VERIFIER_AGENT_BCOVRIN_NAMESPACE ?? BCOVRIN_TEST_NAMESPACE,
    logLevel: parseLogLevel(env.VERO_VERIFIER_AGENT_LOG_LEVEL),
    publicDidCommEndpoint:
      env.VERO_VERIFIER_AGENT_PUBLIC_DIDCOMM_ENDPOINT ?? DEFAULT_PUBLIC_DIDCOMM_ENDPOINT,
    studentCredentialSchemaName:
      env.VERO_VERIFIER_AGENT_STUDENT_SCHEMA_NAME ?? DEFAULT_STUDENT_SCHEMA_NAME,
    studentCredentialSchemaVersion:
      env.VERO_VERIFIER_AGENT_STUDENT_SCHEMA_VERSION ?? DEFAULT_STUDENT_SCHEMA_VERSION,
    walletDbPath: resolveWalletDbPath(workspaceRoot, env.VERO_VERIFIER_AGENT_WALLET_DB_PATH),
    walletId: env.VERO_VERIFIER_AGENT_WALLET_ID ?? DEFAULT_WALLET_ID,
    walletKey: env.VERO_VERIFIER_AGENT_WALLET_KEY ?? DEFAULT_WALLET_KEY,
    walletKeyDerivationMethod,
  }
}
