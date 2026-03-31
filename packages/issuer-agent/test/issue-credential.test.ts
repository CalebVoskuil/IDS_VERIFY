import { ZodError } from 'zod'

import {
  buildIssueCredentialInvitationUrl,
  buildAnonCredsCredentialAttributes,
  parseIssueCredentialRequest,
  toIssueCredentialValidationErrorResponse,
} from '../src/issue-credential.js'

const validIssueCredentialRequest = {
  enrollmentStatus: 'active',
  faculty: 'Engineering',
  fullName: 'Ada Lovelace',
  studentNumber: '20260001',
  validFrom: '2026-01-01',
  validUntil: '2026-12-31',
}

describe('parseIssueCredentialRequest', () => {
  test('parses and trims a valid request payload', () => {
    expect(
      parseIssueCredentialRequest({
        ...validIssueCredentialRequest,
        fullName: '  Ada Lovelace  ',
      }),
    ).toEqual(validIssueCredentialRequest)
  })

  test('rejects a payload where validUntil is before validFrom', () => {
    expect(() =>
      parseIssueCredentialRequest({
        ...validIssueCredentialRequest,
        validUntil: '2025-12-31',
      }),
    ).toThrow('validUntil must be on or after validFrom')
  })
})

describe('toIssueCredentialValidationErrorResponse', () => {
  test('maps zod issues into the route error payload', () => {
    const error = new ZodError([
      {
        code: 'custom',
        input: 'bad-value',
        message: 'validUntil must be on or after validFrom',
        path: ['validUntil'],
      },
    ])

    expect(toIssueCredentialValidationErrorResponse(error)).toEqual({
      issues: [
        {
          message: 'validUntil must be on or after validFrom',
          path: 'validUntil',
        },
      ],
      message: 'Invalid issue-credential request',
    })
  })
})

describe('buildAnonCredsCredentialAttributes', () => {
  test('maps the request into the schema attribute order expected by anoncreds', () => {
    expect(buildAnonCredsCredentialAttributes(validIssueCredentialRequest)).toEqual([
      {
        name: 'studentNumber',
        value: '20260001',
      },
      {
        name: 'fullName',
        value: 'Ada Lovelace',
      },
      {
        name: 'faculty',
        value: 'Engineering',
      },
      {
        name: 'enrollmentStatus',
        value: 'active',
      },
      {
        name: 'validFrom',
        value: '2026-01-01',
      },
      {
        name: 'validUntil',
        value: '2026-12-31',
      },
    ])
  })
})

describe('buildIssueCredentialInvitationUrl', () => {
  test('appends the out-of-band id to the configured invitation base url', () => {
    expect(
      buildIssueCredentialInvitationUrl('http://localhost:3000/oob', 'out-of-band-id'),
    ).toBe('http://localhost:3000/oob/out-of-band-id')
  })

  test('normalizes a trailing slash on the invitation base url', () => {
    expect(
      buildIssueCredentialInvitationUrl('http://localhost:3000/oob/', 'out-of-band-id'),
    ).toBe('http://localhost:3000/oob/out-of-band-id')
  })
})
