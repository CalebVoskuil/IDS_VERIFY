import type { Agent } from '@credo-ts/core'
import {
  DidCommAutoAcceptCredential,
  type DidCommCredentialPreviewAttributeOptions,
} from '@credo-ts/didcomm'
import QRCode from 'qrcode'
import { ZodError, z } from 'zod'

import { STUDENT_CREDENTIAL_ATTRIBUTE_NAMES } from './artifacts.js'
import type { IssuerAgentConfig } from './config.js'
import type { IssuerLedgerArtifacts } from './phase2.js'

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/

export const issueCredentialRequestSchema = z
  .object({
    studentNumber: z.string().trim().min(1, 'studentNumber is required'),
    fullName: z.string().trim().min(1, 'fullName is required'),
    faculty: z.string().trim().min(1, 'faculty is required'),
    enrollmentStatus: z.string().trim().min(1, 'enrollmentStatus is required'),
    validFrom: z.string().regex(isoDatePattern, 'validFrom must use YYYY-MM-DD'),
    validUntil: z.string().regex(isoDatePattern, 'validUntil must use YYYY-MM-DD'),
  })
  .superRefine((value, context) => {
    if (value.validUntil < value.validFrom) {
      context.addIssue({
        code: 'custom',
        message: 'validUntil must be on or after validFrom',
        path: ['validUntil'],
      })
    }
  })

export type IssueCredentialRequest = z.infer<typeof issueCredentialRequestSchema>

export interface IssueCredentialResponse {
  credentialDefinitionId: string
  credentialExchangeId: string
  invitation: Record<string, unknown>
  invitationUrl: string
  issuerDid: string
  outOfBandId: string
  qrCodeDataUrl: string
  schemaId: string
}

export interface CreatedIssueCredentialOffer {
  credentialDefinitionId: string
  credentialExchangeId: string
  invitation: Record<string, unknown>
  issuerDid: string
  outOfBandId: string
  schemaId: string
}

export interface IssueCredentialValidationIssue {
  message: string
  path: string
}

export interface IssueCredentialValidationErrorResponse {
  issues: IssueCredentialValidationIssue[]
  message: 'Invalid issue-credential request'
}

export function parseIssueCredentialRequest(payload: unknown): IssueCredentialRequest {
  return issueCredentialRequestSchema.parse(payload)
}

export function toIssueCredentialValidationErrorResponse(
  error: ZodError,
): IssueCredentialValidationErrorResponse {
  return {
    issues: error.issues.map((issue) => ({
      message: issue.message,
      path: issue.path.join('.'),
    })),
    message: 'Invalid issue-credential request',
  }
}

export function buildAnonCredsCredentialAttributes(
  request: IssueCredentialRequest,
): DidCommCredentialPreviewAttributeOptions[] {
  return STUDENT_CREDENTIAL_ATTRIBUTE_NAMES.map((name) => ({
    name,
    value: request[name],
  }))
}

export function buildIssueCredentialInvitationUrl(invitationUrlBase: string, outOfBandId: string) {
  const normalizedInvitationUrlBase = invitationUrlBase.endsWith('/')
    ? invitationUrlBase.slice(0, -1)
    : invitationUrlBase

  return `${normalizedInvitationUrlBase}/${encodeURIComponent(outOfBandId)}`
}

export async function buildIssueCredentialResponse(
  offer: CreatedIssueCredentialOffer,
  invitationUrlBase: string,
): Promise<IssueCredentialResponse> {
  const invitationUrl = buildIssueCredentialInvitationUrl(invitationUrlBase, offer.outOfBandId)

  return {
    ...offer,
    invitationUrl,
    qrCodeDataUrl: await QRCode.toDataURL(invitationUrl),
  }
}

function requireDidComm(agent: Agent) {
  const didcomm = agent.didcomm

  if (!didcomm) {
    throw new Error('Issuer agent is missing the DidComm module')
  }

  if (!didcomm.credentials) {
    throw new Error('Issuer agent is missing the DidComm credentials API')
  }

  return didcomm
}

export async function createIssueCredentialOffer(
  agent: Agent,
  config: IssuerAgentConfig,
  artifacts: IssuerLedgerArtifacts,
  request: IssueCredentialRequest,
): Promise<CreatedIssueCredentialOffer> {
  const didcomm = requireDidComm(agent)
  const { credentialExchangeRecord, message } = await didcomm.credentials.createOffer({
    autoAcceptCredential: DidCommAutoAcceptCredential.Always,
    credentialFormats: {
      anoncreds: {
        attributes: buildAnonCredsCredentialAttributes(request),
        credentialDefinitionId: artifacts.credentialDefinitionId,
      },
    },
    protocolVersion: 'v2',
  })

  const outOfBandRecord = await didcomm.oob.createInvitation({
    goal: 'Issue a UCT student credential',
    goalCode: 'issue-vc',
    handshake: false,
    label: config.agentName,
    messages: [message],
  })

  return {
    credentialDefinitionId: artifacts.credentialDefinitionId,
    credentialExchangeId: credentialExchangeRecord.id,
    invitation: outOfBandRecord.outOfBandInvitation.toJSON(),
    issuerDid: artifacts.issuerDid,
    outOfBandId: outOfBandRecord.id,
    schemaId: artifacts.schemaId,
  }
}
