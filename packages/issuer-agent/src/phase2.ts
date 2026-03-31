import { setTimeout as delay } from 'node:timers/promises'
import { createRequire } from 'node:module'

import { getUnqualifiedSchemaId, parseIndySchemaId } from '@credo-ts/anoncreds'
import type { Agent } from '@credo-ts/core'
import { IndyVdrPoolService } from '@credo-ts/indy-vdr'
import { GetSchemaRequest } from '@hyperledger/indy-vdr-shared'

import {
  buildBcovrinDidRegistrationPayload,
  buildDidIndyCredentialDefinitionId,
  buildDidIndySchemaId,
  deriveIssuerDidComponents,
  extractIndyLedgerSeqNo,
  requireFinishedCredentialDefinitionRegistration,
  requireFinishedSchemaRegistration,
  seedStringToBytes,
  STUDENT_CREDENTIAL_ATTRIBUTE_NAMES,
  type IssuerDidComponents,
} from './artifacts.js'
import type { IssuerAgentConfig } from './config.js'

export interface RegisterIssuerArtifactsOptions {
  fetchFn?: typeof fetch
}

export interface IssuerLedgerArtifacts {
  credentialDefinitionId: string
  issuerDid: string
  schemaId: string
}

interface DerivedIssuerDidMaterial extends IssuerDidComponents {
  privateJwk: {
    crv: 'Ed25519'
    d: string
    kty: 'OKP'
    x: string
  }
}

function loadAskarCrypto() {
  const require = createRequire(import.meta.url)

  return require('@openwallet-foundation/askar-nodejs') as {
    Key: {
      fromSeed(options: {
        algorithm: string
        method: string
        seed: Uint8Array
      }): {
        jwkSecret: DerivedIssuerDidMaterial['privateJwk']
        publicBytes: Uint8Array
      }
    }
    KeyAlgorithm: {
      Ed25519: string
    }
    KeyMethod: {
      None: string
    }
  }
}

function deriveIssuerDidMaterial(config: IssuerAgentConfig): DerivedIssuerDidMaterial {
  const { Key, KeyAlgorithm, KeyMethod } = loadAskarCrypto()
  const key = Key.fromSeed({
    algorithm: KeyAlgorithm.Ed25519,
    method: KeyMethod.None,
    seed: seedStringToBytes(config.publicDidSeed),
  })

  return {
    ...deriveIssuerDidComponents(key.publicBytes, config.indyNamespace),
    privateJwk: key.jwkSecret,
  }
}

async function tryResolveDidDocument(agent: Agent, did: string) {
  try {
    const result = await agent.dids.resolve(did)
    return result.didDocument
  } catch {
    return undefined
  }
}

async function waitForDidResolution(agent: Agent, did: string, attempts = 5) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const didDocument = await tryResolveDidDocument(agent, did)

    if (didDocument) {
      return didDocument
    }

    if (attempt < attempts - 1) {
      await delay(1000)
    }
  }

  throw new Error(`Issuer DID ${did} could not be resolved from BCovrin after registration`)
}

async function ensureDidPublishedOnBcovrin(
  agent: Agent,
  config: IssuerAgentConfig,
  did: IssuerDidComponents,
  fetchFn: typeof fetch,
) {
  const existingDidDocument = await tryResolveDidDocument(agent, did.did)

  if (existingDidDocument) {
    return
  }

  const response = await fetchFn(config.bcovrinRegisterUrl, {
    body: JSON.stringify(buildBcovrinDidRegistrationPayload(did, config.publicDidAlias)),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  const responseBody = await response.text()

  if (!response.ok) {
    throw new Error(
      `BCovrin DID registration failed with status ${response.status}: ${responseBody}`,
    )
  }

  const responseJson = JSON.parse(responseBody) as Record<string, unknown>

  if (responseJson.did !== did.didShortForm) {
    throw new Error(`BCovrin DID registration returned unexpected did: ${String(responseJson.did)}`)
  }

  if (responseJson.verkey !== did.verkey) {
    throw new Error(
      `BCovrin DID registration returned unexpected verkey: ${String(responseJson.verkey)}`,
    )
  }

  await waitForDidResolution(agent, did.did)
}

async function getCreatedDidKeyId(agent: Agent, did: string) {
  try {
    const didRecord = await agent.dids.resolveCreatedDidDocumentWithKeys(did)
    return didRecord.keys?.[0]?.kmsKeyId
  } catch {
    return undefined
  }
}

async function ensureDidImported(agent: Agent, did: DerivedIssuerDidMaterial) {
  const existingKeyId = await getCreatedDidKeyId(agent, did.did)

  if (existingKeyId) {
    return existingKeyId
  }

  const importedKey = await agent.kms.importKey({
    privateJwk: did.privateJwk,
  })

  await agent.dids.import({
    did: did.did,
    keys: [
      {
        didDocumentRelativeKeyId: '#verkey',
        kmsKeyId: importedKey.keyId,
      },
    ],
    overwrite: true,
  })

  return importedKey.keyId
}

function getAnonCredsApi(agent: Agent) {
  const anoncreds = agent.modules.anoncreds

  if (!anoncreds) {
    throw new Error('Issuer agent is missing the anoncreds module')
  }

  return anoncreds
}

async function resolveSchemaSeqNo(
  agent: Agent,
  schemaId: string,
  schemaMetadata?: Record<string, unknown>,
) {
  if (typeof schemaMetadata?.indyLedgerSeqNo === 'number') {
    return schemaMetadata.indyLedgerSeqNo
  }

  const { did, namespaceIdentifier, schemaName, schemaVersion } = parseIndySchemaId(schemaId)
  const { pool } = await agent.context.resolve(IndyVdrPoolService).getPoolForDid(agent.context, did)
  const response = await pool.submitRequest(
    new GetSchemaRequest({
      schemaId: getUnqualifiedSchemaId(namespaceIdentifier, schemaName, schemaVersion),
    }),
  )

  if (typeof response.result.seqNo !== 'number') {
    throw new Error(
      `Schema ${schemaId} could not be resolved with an indyLedgerSeqNo from BCovrin`,
    )
  }

  return response.result.seqNo
}

async function ensureStudentSchema(
  agent: Agent,
  config: IssuerAgentConfig,
  did: DerivedIssuerDidMaterial,
) {
  const anonCreds = getAnonCredsApi(agent)
  const schemaId = buildDidIndySchemaId(
    config.indyNamespace,
    did.didShortForm,
    config.studentCredentialSchemaName,
    config.studentCredentialSchemaVersion,
  )
  const existingSchema = await anonCreds.getSchema(schemaId)

  if (existingSchema.schema) {
    return {
      schemaId,
      schemaSeqNo: await resolveSchemaSeqNo(
        agent,
        schemaId,
        existingSchema.schemaMetadata as Record<string, unknown>,
      ),
    }
  }

  const schemaResult = await anonCreds.registerSchema({
    options: {
      endorserDid: did.did,
      endorserMode: 'internal',
    },
    schema: {
      attrNames: [...STUDENT_CREDENTIAL_ATTRIBUTE_NAMES],
      issuerId: did.did,
      name: config.studentCredentialSchemaName,
      version: config.studentCredentialSchemaVersion,
    },
  })

  return {
    schemaId: requireFinishedSchemaRegistration(schemaResult),
    schemaSeqNo: extractIndyLedgerSeqNo(schemaResult.schemaMetadata as Record<string, unknown>),
  }
}

async function ensureStudentCredentialDefinition(
  agent: Agent,
  config: IssuerAgentConfig,
  did: DerivedIssuerDidMaterial,
  schemaId: string,
  schemaSeqNo: number,
) {
  const anonCreds = getAnonCredsApi(agent)
  const credentialDefinitionId = buildDidIndyCredentialDefinitionId(
    config.indyNamespace,
    did.didShortForm,
    schemaSeqNo,
    config.studentCredentialDefinitionTag,
  )
  const existingCredentialDefinition = await anonCreds.getCredentialDefinition(
    credentialDefinitionId,
  )

  if (existingCredentialDefinition.credentialDefinition) {
    return credentialDefinitionId
  }

  const credentialDefinitionResult = await anonCreds.registerCredentialDefinition({
    credentialDefinition: {
      issuerId: did.did,
      schemaId,
      tag: config.studentCredentialDefinitionTag,
    },
    options: {
      endorserDid: did.did,
      endorserMode: 'internal',
      supportRevocation: false,
    },
  })

  return requireFinishedCredentialDefinitionRegistration(credentialDefinitionResult)
}

export async function registerIssuerArtifacts(
  agent: Agent,
  config: IssuerAgentConfig,
  options: RegisterIssuerArtifactsOptions = {},
): Promise<IssuerLedgerArtifacts> {
  const fetchFn = options.fetchFn ?? fetch
  const did = deriveIssuerDidMaterial(config)

  await ensureDidPublishedOnBcovrin(agent, config, did, fetchFn)
  await ensureDidImported(agent, did)

  const { schemaId, schemaSeqNo } = await ensureStudentSchema(agent, config, did)
  const credentialDefinitionId = await ensureStudentCredentialDefinition(
    agent,
    config,
    did,
    schemaId,
    schemaSeqNo,
  )

  return {
    credentialDefinitionId,
    issuerDid: did.did,
    schemaId,
  }
}
