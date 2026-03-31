import type { Agent } from '@credo-ts/core'
import type { AnonCredsProof, AnonCredsProofRequestRestriction } from '@credo-ts/anoncreds'
import { DidCommAutoAcceptProof, DidCommProofState } from '@credo-ts/didcomm'
import QRCode from 'qrcode'
import { ZodError, z } from 'zod'

import type { VerifierAgentConfig } from './config.js'

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/

export const CANTEEN_PROOF_REQUEST_NAME = 'Vero Canteen Verification'
export const CANTEEN_PROOF_REQUEST_VERSION = '1.0'

export const CANTEEN_PROOF_REFERENTS = {
  enrollmentStatus: 'enrollment_status',
  studentNumber: 'student_number',
  validFrom: 'valid_from',
  validUntil: 'valid_until',
} as const

export const verifyProofRequestSchema = z.object({
  proofExchangeId: z
    .string({ error: 'proofExchangeId is required' })
    .trim()
    .min(1, 'proofExchangeId is required'),
})

export type VerifyProofRequest = z.infer<typeof verifyProofRequestSchema>

export interface GenerateProofQrResponse {
  invitation: Record<string, unknown>
  invitationUrl: string
  outOfBandId: string
  proofExchangeId: string
  proofRequest: {
    requestedAttributes: string[]
    validityCheck: 'revealed-date-claims'
  }
  qrCodeDataUrl: string
}

export interface CreatedCanteenProofRequest {
  invitation: Record<string, unknown>
  outOfBandId: string
  proofExchangeId: string
}

export interface VerifyProofValidationIssue {
  message: string
  path: string
}

export interface VerifyProofValidationErrorResponse {
  issues: VerifyProofValidationIssue[]
  message: 'Invalid verify-proof request'
}

export interface VerifyProofResponse {
  checks: {
    credentialCurrent: boolean | null
    enrollmentActive: boolean | null
    proofVerified: boolean
  }
  failureReasons: string[]
  isApproved: boolean
  isVerified: boolean
  proofExchangeId: string
  proofRecordState: string
  revealedClaims: {
    enrollmentStatus?: string
    studentNumber?: string
    validFrom?: string
    validUntil?: string
  } | null
  status: 'approved' | 'pending' | 'rejected'
}

interface EvaluateCanteenProofOptions {
  activeEnrollmentStatuses: readonly string[]
  errorMessage?: string
  isVerified?: boolean
  now?: Date
  presentation?: AnonCredsProof
  proofExchangeId: string
  proofRecordState: string
}

function normalizeEnrollmentStatus(value: string) {
  return value.trim().toLowerCase()
}

function toLocalIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

function buildRestriction(config: VerifierAgentConfig): AnonCredsProofRequestRestriction {
  const restriction: AnonCredsProofRequestRestriction = {
    schema_name: config.studentCredentialSchemaName,
    schema_version: config.studentCredentialSchemaVersion,
  }

  if (config.expectedIssuerId) {
    restriction.issuer_id = config.expectedIssuerId
  }

  if (config.expectedCredentialDefinitionId) {
    restriction.cred_def_id = config.expectedCredentialDefinitionId
  }

  return restriction
}

function buildCanteenAnonCredsProofRequest(config: VerifierAgentConfig) {
  const restrictions = [buildRestriction(config)]

  return {
    name: CANTEEN_PROOF_REQUEST_NAME,
    requested_attributes: {
      [CANTEEN_PROOF_REFERENTS.studentNumber]: {
        name: 'studentNumber',
        restrictions,
      },
      [CANTEEN_PROOF_REFERENTS.enrollmentStatus]: {
        name: 'enrollmentStatus',
        restrictions,
      },
      [CANTEEN_PROOF_REFERENTS.validFrom]: {
        name: 'validFrom',
        restrictions,
      },
      [CANTEEN_PROOF_REFERENTS.validUntil]: {
        name: 'validUntil',
        restrictions,
      },
    },
    requested_predicates: {},
    version: CANTEEN_PROOF_REQUEST_VERSION,
  }
}

function requireDidComm(agent: Agent) {
  const didcomm = agent.didcomm

  if (!didcomm) {
    throw new Error('Verifier agent is missing the DidComm module')
  }

  if (!didcomm.oob) {
    throw new Error('Verifier agent is missing the DidComm OOB API')
  }

  if (!didcomm.proofs) {
    throw new Error('Verifier agent is missing the DidComm proofs API')
  }

  return didcomm
}

function getRevealedAttrValue(presentation: AnonCredsProof | undefined, referent: string) {
  return presentation?.requested_proof.revealed_attrs[referent]?.raw
}

export function parseVerifyProofRequest(payload: unknown): VerifyProofRequest {
  return verifyProofRequestSchema.parse(payload)
}

export function toVerifyProofValidationErrorResponse(
  error: ZodError,
): VerifyProofValidationErrorResponse {
  return {
    issues: error.issues.map((issue) => ({
      message: issue.message,
      path: issue.path.join('.'),
    })),
    message: 'Invalid verify-proof request',
  }
}

export function buildProofRequestInvitationUrl(invitationUrlBase: string, outOfBandId: string) {
  const normalizedInvitationUrlBase = invitationUrlBase.endsWith('/')
    ? invitationUrlBase.slice(0, -1)
    : invitationUrlBase

  return `${normalizedInvitationUrlBase}/${encodeURIComponent(outOfBandId)}`
}

export async function buildGenerateProofQrResponse(
  proofRequest: CreatedCanteenProofRequest,
  invitationUrlBase: string,
): Promise<GenerateProofQrResponse> {
  const invitationUrl = buildProofRequestInvitationUrl(invitationUrlBase, proofRequest.outOfBandId)

  return {
    ...proofRequest,
    invitationUrl,
    proofRequest: {
      requestedAttributes: ['studentNumber', 'enrollmentStatus', 'validFrom', 'validUntil'],
      validityCheck: 'revealed-date-claims',
    },
    qrCodeDataUrl: await QRCode.toDataURL(invitationUrl),
  }
}

export async function createCanteenProofRequest(
  agent: Agent,
  config: VerifierAgentConfig,
): Promise<CreatedCanteenProofRequest> {
  const didcomm = requireDidComm(agent)
  const { message, proofRecord } = await didcomm.proofs.createRequest({
    autoAcceptProof: DidCommAutoAcceptProof.Never,
    goal: 'Verify UCT student status for canteen service',
    goalCode: 'verify-student-status',
    proofFormats: {
      anoncreds: buildCanteenAnonCredsProofRequest(config),
    },
    protocolVersion: 'v2',
  })

  const outOfBandRecord = await didcomm.oob.createInvitation({
    goal: 'Verify UCT student status for canteen service',
    goalCode: 'verify-student-status',
    handshake: false,
    label: config.agentName,
    messages: [message],
  })

  return {
    invitation: outOfBandRecord.outOfBandInvitation.toJSON(),
    outOfBandId: outOfBandRecord.id,
    proofExchangeId: proofRecord.id,
  }
}

export function evaluateCanteenProof({
  activeEnrollmentStatuses,
  errorMessage,
  isVerified,
  now = new Date(),
  presentation,
  proofExchangeId,
  proofRecordState,
}: EvaluateCanteenProofOptions): VerifyProofResponse {
  if (
    proofRecordState === DidCommProofState.RequestSent ||
    proofRecordState === DidCommProofState.RequestReceived ||
    proofRecordState === DidCommProofState.ProposalReceived ||
    proofRecordState === DidCommProofState.ProposalSent
  ) {
    return {
      checks: {
        credentialCurrent: null,
        enrollmentActive: null,
        proofVerified: false,
      },
      failureReasons: [],
      isApproved: false,
      isVerified: false,
      proofExchangeId,
      proofRecordState,
      revealedClaims: null,
      status: 'pending',
    }
  }

  const revealedClaims = presentation
    ? {
        enrollmentStatus: getRevealedAttrValue(
          presentation,
          CANTEEN_PROOF_REFERENTS.enrollmentStatus,
        ),
        studentNumber: getRevealedAttrValue(presentation, CANTEEN_PROOF_REFERENTS.studentNumber),
        validFrom: getRevealedAttrValue(presentation, CANTEEN_PROOF_REFERENTS.validFrom),
        validUntil: getRevealedAttrValue(presentation, CANTEEN_PROOF_REFERENTS.validUntil),
      }
    : null

  const proofVerified = isVerified === true
  const failureReasons = errorMessage ? [errorMessage] : []
  const enrollmentStatus = revealedClaims?.enrollmentStatus
  const validFrom = revealedClaims?.validFrom
  const validUntil = revealedClaims?.validUntil
  const enrollmentActive =
    typeof enrollmentStatus === 'string'
      ? activeEnrollmentStatuses.includes(normalizeEnrollmentStatus(enrollmentStatus))
      : null
  const credentialCurrent =
    typeof validFrom === 'string' &&
    typeof validUntil === 'string' &&
    isoDatePattern.test(validFrom) &&
    isoDatePattern.test(validUntil)
      ? toLocalIsoDate(now) >= validFrom && toLocalIsoDate(now) <= validUntil
      : null

  if (!proofVerified) {
    if (failureReasons.length === 0) {
      failureReasons.push('Presentation has not been verified successfully')
    }
  }

  if (!revealedClaims) {
    failureReasons.push('Presentation data is not available yet')
  } else {
    if (credentialCurrent !== true) {
      failureReasons.push('Credential is not currently valid')
    }

    if (enrollmentActive !== true) {
      failureReasons.push('Enrollment status is not eligible for canteen approval')
    }
  }

  const isApproved = proofVerified && credentialCurrent === true && enrollmentActive === true

  return {
    checks: {
      credentialCurrent,
      enrollmentActive,
      proofVerified,
    },
    failureReasons,
    isApproved,
    isVerified: proofVerified,
    proofExchangeId,
    proofRecordState,
    revealedClaims,
    status: isApproved ? 'approved' : 'rejected',
  }
}

export async function resolveCanteenProofVerification(
  agent: Agent,
  config: VerifierAgentConfig,
  request: VerifyProofRequest,
): Promise<VerifyProofResponse | null> {
  const didcomm = requireDidComm(agent)
  let proofRecord = await didcomm.proofs.findById(request.proofExchangeId)

  if (!proofRecord) {
    return null
  }

  if (
    proofRecord.state === DidCommProofState.PresentationReceived &&
    proofRecord.isVerified === true
  ) {
    proofRecord = await didcomm.proofs.acceptPresentation({
      proofExchangeRecordId: request.proofExchangeId,
    })
  }

  if (
    proofRecord.state === DidCommProofState.RequestSent ||
    proofRecord.state === DidCommProofState.RequestReceived ||
    proofRecord.state === DidCommProofState.ProposalReceived ||
    proofRecord.state === DidCommProofState.ProposalSent
  ) {
    return evaluateCanteenProof({
      activeEnrollmentStatuses: config.activeEnrollmentStatuses,
      errorMessage: proofRecord.errorMessage,
      isVerified: proofRecord.isVerified,
      proofExchangeId: proofRecord.id,
      proofRecordState: proofRecord.state,
    })
  }

  const formatData = await didcomm.proofs.getFormatData(request.proofExchangeId)

  return evaluateCanteenProof({
    activeEnrollmentStatuses: config.activeEnrollmentStatuses,
    errorMessage: proofRecord.errorMessage,
    isVerified: proofRecord.isVerified,
    now: new Date(),
    presentation: formatData.presentation?.anoncreds,
    proofExchangeId: proofRecord.id,
    proofRecordState: proofRecord.state,
  })
}
