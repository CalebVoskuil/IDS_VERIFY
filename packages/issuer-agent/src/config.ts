import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { LogLevel } from '@credo-ts/core'

export const BCOVRIN_TEST_GENESIS_URL = 'http://test.bcovrin.vonx.io/genesis'
export const BCOVRIN_TEST_REGISTER_URL = 'https://test.bcovrin.vonx.io/register'
export const BCOVRIN_TEST_NAMESPACE = 'bcovrin:test'
export const DEFAULT_AGENT_NAME = 'Vero Issuer Agent'
export const DEFAULT_WALLET_ID = 'vero-issuer-agent'
export const DEFAULT_WALLET_KEY = 'vero-issuer-agent-local-key'
export const DEFAULT_WALLET_DB_FILENAME = 'issuer-agent.sqlite'
export const DEFAULT_WALLET_KEY_DERIVATION_METHOD = 'kdf:argon2i:mod'
export const DEFAULT_PUBLIC_DID_ALIAS = 'vero-uct-issuer'
export const DEFAULT_PUBLIC_DID_SEED = 'vero-uct-issuer-seed-0000000001x'
export const DEFAULT_STUDENT_SCHEMA_NAME = 'Vero UCT Student Credential'
export const DEFAULT_STUDENT_SCHEMA_VERSION = '1.0.0'
export const DEFAULT_STUDENT_CREDENTIAL_DEFINITION_TAG = 'uct-student-v1'
export const DEFAULT_API_HOST = '0.0.0.0'
export const DEFAULT_API_PORT = 3000
export const DEFAULT_DIDCOMM_PORT = 3001
export const DEFAULT_DIDCOMM_PATH = '/didcomm'
export const DEFAULT_INVITATION_URL_BASE = `http://localhost:${DEFAULT_API_PORT}/oob`
export const DEFAULT_PUBLIC_DIDCOMM_ENDPOINT = `http://localhost:${DEFAULT_DIDCOMM_PORT}${DEFAULT_DIDCOMM_PATH}`

const DEFAULT_WORKSPACE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export interface IssuerAgentConfig {
  agentName: string
  allowInsecureHttpUrls: boolean
  apiHost: string
  apiPort: number
  bcovrinGenesisUrl: string
  bcovrinRegisterUrl: string
  didCommPath: string
  didCommPort: number
  indyNamespace: string
  invitationUrlBase: string
  logLevel: LogLevel
  publicDidAlias: string
  publicDidCommEndpoint: string
  publicDidSeed: string
  studentCredentialDefinitionTag: string
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
      throw new Error(`Unsupported issuer-agent log level: ${value}`)
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

export function resolveIssuerAgentConfig(
  env: NodeJS.ProcessEnv = process.env,
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
): IssuerAgentConfig {
  const walletKeyDerivationMethod =
    env.VERO_ISSUER_AGENT_WALLET_KEY_DERIVATION_METHOD ?? DEFAULT_WALLET_KEY_DERIVATION_METHOD

  if (
    walletKeyDerivationMethod !== 'kdf:argon2i:mod' &&
    walletKeyDerivationMethod !== 'kdf:argon2i:int' &&
    walletKeyDerivationMethod !== 'raw'
  ) {
    throw new Error(
      `Unsupported issuer-agent wallet key derivation method: ${walletKeyDerivationMethod}`,
    )
  }

  const didCommPath = normalizeUrlPath(
    env.VERO_ISSUER_AGENT_DIDCOMM_PATH,
    DEFAULT_DIDCOMM_PATH,
  )

  return {
    agentName: env.VERO_ISSUER_AGENT_NAME ?? DEFAULT_AGENT_NAME,
    allowInsecureHttpUrls: true,
    apiHost: env.VERO_ISSUER_AGENT_API_HOST ?? DEFAULT_API_HOST,
    apiPort: parsePort(env.VERO_ISSUER_AGENT_API_PORT, DEFAULT_API_PORT, 'VERO_ISSUER_AGENT_API'),
    bcovrinGenesisUrl: env.VERO_ISSUER_AGENT_BCOVRIN_GENESIS_URL ?? BCOVRIN_TEST_GENESIS_URL,
    bcovrinRegisterUrl:
      env.VERO_ISSUER_AGENT_BCOVRIN_REGISTER_URL ?? BCOVRIN_TEST_REGISTER_URL,
    didCommPath,
    didCommPort: parsePort(
      env.VERO_ISSUER_AGENT_DIDCOMM_PORT,
      DEFAULT_DIDCOMM_PORT,
      'VERO_ISSUER_AGENT_DIDCOMM',
    ),
    indyNamespace: env.VERO_ISSUER_AGENT_BCOVRIN_NAMESPACE ?? BCOVRIN_TEST_NAMESPACE,
    invitationUrlBase:
      env.VERO_ISSUER_AGENT_INVITATION_URL_BASE ?? DEFAULT_INVITATION_URL_BASE,
    logLevel: parseLogLevel(env.VERO_ISSUER_AGENT_LOG_LEVEL),
    publicDidAlias: env.VERO_ISSUER_AGENT_PUBLIC_DID_ALIAS ?? DEFAULT_PUBLIC_DID_ALIAS,
    publicDidCommEndpoint:
      env.VERO_ISSUER_AGENT_PUBLIC_DIDCOMM_ENDPOINT ?? DEFAULT_PUBLIC_DIDCOMM_ENDPOINT,
    publicDidSeed: env.VERO_ISSUER_AGENT_PUBLIC_DID_SEED ?? DEFAULT_PUBLIC_DID_SEED,
    studentCredentialDefinitionTag:
      env.VERO_ISSUER_AGENT_STUDENT_CREDENTIAL_DEFINITION_TAG ??
      DEFAULT_STUDENT_CREDENTIAL_DEFINITION_TAG,
    studentCredentialSchemaName:
      env.VERO_ISSUER_AGENT_STUDENT_SCHEMA_NAME ?? DEFAULT_STUDENT_SCHEMA_NAME,
    studentCredentialSchemaVersion:
      env.VERO_ISSUER_AGENT_STUDENT_SCHEMA_VERSION ?? DEFAULT_STUDENT_SCHEMA_VERSION,
    walletDbPath: resolveWalletDbPath(workspaceRoot, env.VERO_ISSUER_AGENT_WALLET_DB_PATH),
    walletId: env.VERO_ISSUER_AGENT_WALLET_ID ?? DEFAULT_WALLET_ID,
    walletKey: env.VERO_ISSUER_AGENT_WALLET_KEY ?? DEFAULT_WALLET_KEY,
    walletKeyDerivationMethod,
  }
}
