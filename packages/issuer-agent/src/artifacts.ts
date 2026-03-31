import type {
  RegisterCredentialDefinitionReturn,
  RegisterSchemaReturn,
} from '@credo-ts/anoncreds'
import { TypedArrayEncoder } from '@credo-ts/core'

export const BCOVRIN_NYM_ROLE = 'ENDORSER' as const

export const STUDENT_CREDENTIAL_ATTRIBUTE_NAMES = [
  'studentNumber',
  'fullName',
  'faculty',
  'enrollmentStatus',
  'validFrom',
  'validUntil',
] as const

export interface IssuerDidComponents {
  did: string
  didShortForm: string
  verkey: string
}

export interface BcovrinDidRegistrationPayload {
  alias: string
  did: string
  role: typeof BCOVRIN_NYM_ROLE
  verkey: string
}

export function seedStringToBytes(seed: string): Uint8Array {
  const seedBytes = TypedArrayEncoder.fromString(seed)

  if (seedBytes.length !== 32) {
    throw new Error(`Issuer public DID seed must be exactly 32 bytes, received ${seedBytes.length}`)
  }

  return seedBytes
}

export function deriveIssuerDidComponents(
  publicKey: Uint8Array,
  indyNamespace: string,
): IssuerDidComponents {
  if (publicKey.length !== 32) {
    throw new Error(`Issuer Ed25519 public key must be 32 bytes, received ${publicKey.length}`)
  }

  const didShortForm = TypedArrayEncoder.toBase58(publicKey.slice(0, 16))

  return {
    did: `did:indy:${indyNamespace}:${didShortForm}`,
    didShortForm,
    verkey: TypedArrayEncoder.toBase58(publicKey),
  }
}

export function buildBcovrinDidRegistrationPayload(
  did: IssuerDidComponents,
  alias: string,
): BcovrinDidRegistrationPayload {
  return {
    alias,
    did: did.didShortForm,
    role: BCOVRIN_NYM_ROLE,
    verkey: did.verkey,
  }
}

export function buildDidIndySchemaId(
  indyNamespace: string,
  didShortForm: string,
  schemaName: string,
  schemaVersion: string,
): string {
  return `did:indy:${indyNamespace}:${didShortForm}/anoncreds/v0/SCHEMA/${schemaName}/${schemaVersion}`
}

export function buildDidIndyCredentialDefinitionId(
  indyNamespace: string,
  didShortForm: string,
  schemaSeqNo: number | string,
  tag: string,
): string {
  return `did:indy:${indyNamespace}:${didShortForm}/anoncreds/v0/CLAIM_DEF/${schemaSeqNo}/${tag}`
}

export function extractIndyLedgerSeqNo(schemaMetadata: Record<string, unknown>): number {
  const seqNo = schemaMetadata.indyLedgerSeqNo

  if (typeof seqNo !== 'number') {
    throw new Error('Schema metadata is missing the indyLedgerSeqNo value')
  }

  return seqNo
}

export function requireFinishedSchemaRegistration(result: RegisterSchemaReturn): string {
  const { schemaState } = result

  if (schemaState.state === 'finished') {
    return schemaState.schemaId
  }

  if (schemaState.state === 'failed') {
    throw new Error(`Schema registration failed: ${schemaState.reason}`)
  }

  if (schemaState.state === 'action') {
    throw new Error(`Schema registration requires manual action: ${schemaState.action}`)
  }

  throw new Error('Schema registration did not finish yet')
}

export function requireFinishedCredentialDefinitionRegistration(
  result: RegisterCredentialDefinitionReturn,
): string {
  const { credentialDefinitionState } = result

  if (credentialDefinitionState.state === 'finished') {
    return credentialDefinitionState.credentialDefinitionId
  }

  if (credentialDefinitionState.state === 'failed') {
    throw new Error(
      `Credential definition registration failed: ${credentialDefinitionState.reason}`,
    )
  }

  if (credentialDefinitionState.state === 'action') {
    throw new Error(
      `Credential definition registration requires manual action: ${credentialDefinitionState.action}`,
    )
  }

  throw new Error('Credential definition registration did not finish yet')
}
