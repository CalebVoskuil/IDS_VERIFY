import { DidCommProofState } from '@credo-ts/didcomm'

import {
  buildProofRequestInvitationUrl,
  CANTEEN_PROOF_REFERENTS,
  evaluateCanteenProof,
  parseVerifyProofRequest,
} from '../src/proof-request.js'

describe('proof-request helpers', () => {
  it('parses a verify-proof request', () => {
    expect(parseVerifyProofRequest({ proofExchangeId: 'proof-id' })).toEqual({
      proofExchangeId: 'proof-id',
    })
  })

  it('normalizes proof request invitation URLs', () => {
    expect(
      buildProofRequestInvitationUrl('http://localhost:3100/proof-request/', 'proof-id'),
    ).toBe('http://localhost:3100/proof-request/proof-id')
  })

  it('returns an approved result for a verified active and current presentation', () => {
    const result = evaluateCanteenProof({
      activeEnrollmentStatuses: ['active', 'enrolled'],
      isVerified: true,
      now: new Date(2026, 2, 30),
      presentation: {
        identifiers: [],
        proof: {},
        requested_proof: {
          predicates: {},
          revealed_attr_groups: {},
          revealed_attrs: {
            [CANTEEN_PROOF_REFERENTS.enrollmentStatus]: {
              encoded: '1',
              raw: 'Active',
              sub_proof_index: 0,
            },
            [CANTEEN_PROOF_REFERENTS.studentNumber]: {
              encoded: '2',
              raw: 'S1234567',
              sub_proof_index: 0,
            },
            [CANTEEN_PROOF_REFERENTS.validFrom]: {
              encoded: '3',
              raw: '2026-01-01',
              sub_proof_index: 0,
            },
            [CANTEEN_PROOF_REFERENTS.validUntil]: {
              encoded: '4',
              raw: '2026-12-31',
              sub_proof_index: 0,
            },
          },
          self_attested_attrs: {},
          unrevealed_attrs: {},
        },
      },
      proofExchangeId: 'proof-id',
      proofRecordState: DidCommProofState.Done,
    })

    expect(result.status).toBe('approved')
    expect(result.isApproved).toBe(true)
    expect(result.checks).toEqual({
      credentialCurrent: true,
      enrollmentActive: true,
      proofVerified: true,
    })
    expect(result.revealedClaims).toEqual({
      enrollmentStatus: 'Active',
      studentNumber: 'S1234567',
      validFrom: '2026-01-01',
      validUntil: '2026-12-31',
    })
  })

  it('returns pending when the proof has not been presented yet', () => {
    const result = evaluateCanteenProof({
      activeEnrollmentStatuses: ['active'],
      proofExchangeId: 'proof-id',
      proofRecordState: DidCommProofState.RequestSent,
    })

    expect(result.status).toBe('pending')
    expect(result.isApproved).toBe(false)
    expect(result.revealedClaims).toBeNull()
  })

  it('rejects an expired presentation', () => {
    const result = evaluateCanteenProof({
      activeEnrollmentStatuses: ['active'],
      isVerified: true,
      now: new Date(2026, 2, 30),
      presentation: {
        identifiers: [],
        proof: {},
        requested_proof: {
          predicates: {},
          revealed_attr_groups: {},
          revealed_attrs: {
            [CANTEEN_PROOF_REFERENTS.enrollmentStatus]: {
              encoded: '1',
              raw: 'active',
              sub_proof_index: 0,
            },
            [CANTEEN_PROOF_REFERENTS.studentNumber]: {
              encoded: '2',
              raw: 'S1234567',
              sub_proof_index: 0,
            },
            [CANTEEN_PROOF_REFERENTS.validFrom]: {
              encoded: '3',
              raw: '2024-01-01',
              sub_proof_index: 0,
            },
            [CANTEEN_PROOF_REFERENTS.validUntil]: {
              encoded: '4',
              raw: '2025-12-31',
              sub_proof_index: 0,
            },
          },
          self_attested_attrs: {},
          unrevealed_attrs: {},
        },
      },
      proofExchangeId: 'proof-id',
      proofRecordState: DidCommProofState.Done,
    })

    expect(result.status).toBe('rejected')
    expect(result.isApproved).toBe(false)
    expect(result.failureReasons).toContain('Credential is not currently valid')
  })
})
