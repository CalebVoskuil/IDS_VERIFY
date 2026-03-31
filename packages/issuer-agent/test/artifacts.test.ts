import type {
  RegisterCredentialDefinitionReturn,
  RegisterSchemaReturn,
} from '@credo-ts/anoncreds'
import { TypedArrayEncoder } from '@credo-ts/core'

import {
  BCOVRIN_NYM_ROLE,
  buildBcovrinDidRegistrationPayload,
  buildDidIndyCredentialDefinitionId,
  buildDidIndySchemaId,
  deriveIssuerDidComponents,
  extractIndyLedgerSeqNo,
  requireFinishedCredentialDefinitionRegistration,
  requireFinishedSchemaRegistration,
  seedStringToBytes,
} from '../src/artifacts.js'

describe('seedStringToBytes', () => {
  test('returns the original bytes for a 32-byte seed', () => {
    const seed = '12345678901234567890123456789012'

    expect(seedStringToBytes(seed)).toEqual(TypedArrayEncoder.fromString(seed))
  })

  test('throws for a seed that is not 32 bytes long', () => {
    expect(() => seedStringToBytes('too-short')).toThrow(
      'Issuer public DID seed must be exactly 32 bytes, received 9',
    )
  })
})

describe('deriveIssuerDidComponents', () => {
  test('derives the expected indy did and verkey from the public key bytes', () => {
    const publicKey = TypedArrayEncoder.fromBase58(
      'Hyw1cnwRgtJUr16SzckPZfj72MnP9hCJjYUJLYMrm35d',
    )

    expect(deriveIssuerDidComponents(publicKey, 'bcovrin:test')).toEqual({
      did: 'did:indy:bcovrin:test:YA6qE2vCVpQSF5xFWauwEF',
      didShortForm: 'YA6qE2vCVpQSF5xFWauwEF',
      verkey: 'Hyw1cnwRgtJUr16SzckPZfj72MnP9hCJjYUJLYMrm35d',
    })
  })
})

describe('buildBcovrinDidRegistrationPayload', () => {
  test('maps the local did material to the BCovrin register payload', () => {
    expect(
      buildBcovrinDidRegistrationPayload(
        {
          did: 'did:indy:bcovrin:test:YA6qE2vCVpQSF5xFWauwEF',
          didShortForm: 'YA6qE2vCVpQSF5xFWauwEF',
          verkey: 'Hyw1cnwRgtJUr16SzckPZfj72MnP9hCJjYUJLYMrm35d',
        },
        'vero-phase2-did-test',
      ),
    ).toEqual({
      alias: 'vero-phase2-did-test',
      did: 'YA6qE2vCVpQSF5xFWauwEF',
      role: BCOVRIN_NYM_ROLE,
      verkey: 'Hyw1cnwRgtJUr16SzckPZfj72MnP9hCJjYUJLYMrm35d',
    })
  })
})

describe('did:indy identifier helpers', () => {
  test('builds the expected schema and credential definition ids', () => {
    expect(
      buildDidIndySchemaId(
        'bcovrin:test',
        'YA6qE2vCVpQSF5xFWauwEF',
        'Vero UCT Student Credential',
        '1.0.0',
      ),
    ).toBe(
      'did:indy:bcovrin:test:YA6qE2vCVpQSF5xFWauwEF/anoncreds/v0/SCHEMA/Vero UCT Student Credential/1.0.0',
    )

    expect(
      buildDidIndyCredentialDefinitionId(
        'bcovrin:test',
        'YA6qE2vCVpQSF5xFWauwEF',
        3150633,
        'uct-student-v1',
      ),
    ).toBe(
      'did:indy:bcovrin:test:YA6qE2vCVpQSF5xFWauwEF/anoncreds/v0/CLAIM_DEF/3150633/uct-student-v1',
    )
  })
})

describe('extractIndyLedgerSeqNo', () => {
  test('returns the ledger sequence number from schema metadata', () => {
    expect(extractIndyLedgerSeqNo({ indyLedgerSeqNo: 3150633 })).toBe(3150633)
  })

  test('throws when the sequence number is missing', () => {
    expect(() => extractIndyLedgerSeqNo({})).toThrow(
      'Schema metadata is missing the indyLedgerSeqNo value',
    )
  })
})

describe('registration state guards', () => {
  test('returns the schema id for a finished schema registration', () => {
    const schemaResult = {
      registrationMetadata: {},
      schemaMetadata: {},
      schemaState: {
        schema: {
          attrNames: ['studentNumber'],
          issuerId: 'did:indy:bcovrin:test:issuer',
          name: 'Vero UCT Student Credential',
          version: '1.0.0',
        },
        schemaId: 'schema-id',
        state: 'finished',
      },
    } as RegisterSchemaReturn

    expect(requireFinishedSchemaRegistration(schemaResult)).toBe('schema-id')
  })

  test('throws the failure reason for a failed schema registration', () => {
    const schemaResult = {
      registrationMetadata: {},
      schemaMetadata: {},
      schemaState: {
        reason: 'ledger rejected schema',
        state: 'failed',
      },
    } as RegisterSchemaReturn

    expect(() => requireFinishedSchemaRegistration(schemaResult)).toThrow(
      'Schema registration failed: ledger rejected schema',
    )
  })

  test('returns the credential definition id for a finished registration', () => {
    const credentialDefinitionResult = {
      credentialDefinitionMetadata: {},
      credentialDefinitionState: {
        credentialDefinition: {
          issuerId: 'did:indy:bcovrin:test:issuer',
          schemaId: 'schema-id',
          tag: 'uct-student-v1',
          type: 'CL',
          value: {},
        },
        credentialDefinitionId: 'cred-def-id',
        state: 'finished',
      },
      registrationMetadata: {},
    } as RegisterCredentialDefinitionReturn

    expect(requireFinishedCredentialDefinitionRegistration(credentialDefinitionResult)).toBe(
      'cred-def-id',
    )
  })

  test('throws the failure reason for a failed credential definition registration', () => {
    const credentialDefinitionResult = {
      credentialDefinitionMetadata: {},
      credentialDefinitionState: {
        reason: 'ledger rejected credential definition',
        state: 'failed',
      },
      registrationMetadata: {},
    } as RegisterCredentialDefinitionReturn

    expect(() =>
      requireFinishedCredentialDefinitionRegistration(credentialDefinitionResult),
    ).toThrow('Credential definition registration failed: ledger rejected credential definition')
  })
})
