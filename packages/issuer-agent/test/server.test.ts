import { buildIssuerApiServer } from '../src/server.js'

const validIssueCredentialRequest = {
  enrollmentStatus: 'active',
  faculty: 'Engineering',
  fullName: 'Ada Lovelace',
  studentNumber: '20260001',
  validFrom: '2026-01-01',
  validUntil: '2026-12-31',
}

describe('buildIssuerApiServer', () => {
  test('returns a 200 response for a valid issue-credential request', async () => {
    let capturedRequest: typeof validIssueCredentialRequest | undefined
    const issueCredential = async (request: typeof validIssueCredentialRequest) => {
      capturedRequest = request

      return {
        credentialDefinitionId: 'cred-def-id',
        credentialExchangeId: 'exchange-id',
        invitation: {
          '@id': 'oob-message-id',
          '@type': 'https://didcomm.org/out-of-band/1.1/invitation',
        },
        invitationUrl: 'http://localhost:3000/oob/oob-id',
        issuerDid: 'did:indy:bcovrin:test:issuer',
        outOfBandId: 'oob-id',
        qrCodeDataUrl: 'data:image/png;base64,test',
        schemaId: 'schema-id',
      }
    }
    const server = buildIssuerApiServer({
      getInvitation: async () => null,
      issueCredential,
    })

    try {
      const response = await server.inject({
        method: 'POST',
        payload: validIssueCredentialRequest,
        url: '/issue-credential',
      })

      expect(response.statusCode).toBe(200)
      expect(capturedRequest).toEqual(validIssueCredentialRequest)
      expect(response.json()).toEqual({
        credentialDefinitionId: 'cred-def-id',
        credentialExchangeId: 'exchange-id',
        invitation: {
          '@id': 'oob-message-id',
          '@type': 'https://didcomm.org/out-of-band/1.1/invitation',
        },
        invitationUrl: 'http://localhost:3000/oob/oob-id',
        issuerDid: 'did:indy:bcovrin:test:issuer',
        outOfBandId: 'oob-id',
        qrCodeDataUrl: 'data:image/png;base64,test',
        schemaId: 'schema-id',
      })
    } finally {
      await server.close()
    }
  })

  test('returns a 400 response when the request payload is invalid', async () => {
    let callCount = 0
    const issueCredential = async () => {
      callCount += 1

      throw new Error('This handler should not be called for an invalid request')
    }
    const server = buildIssuerApiServer({
      getInvitation: async () => null,
      issueCredential,
    })

    try {
      const response = await server.inject({
        method: 'POST',
        payload: {
          ...validIssueCredentialRequest,
          validUntil: '2025-12-31',
        },
        url: '/issue-credential',
      })

      expect(response.statusCode).toBe(400)
      expect(callCount).toBe(0)
      expect(response.json()).toEqual({
        issues: [
          {
            message: 'validUntil must be on or after validFrom',
            path: 'validUntil',
          },
        ],
        message: 'Invalid issue-credential request',
      })
    } finally {
      await server.close()
    }
  })

  test('returns a stored out-of-band invitation by id', async () => {
    const server = buildIssuerApiServer({
      getInvitation: async (outOfBandId) =>
        outOfBandId === 'oob-id'
          ? {
              '@id': 'oob-message-id',
              '@type': 'https://didcomm.org/out-of-band/1.1/invitation',
            }
          : null,
      issueCredential: async () => {
        throw new Error('This handler should not be called for a GET /oob request')
      },
    })

    try {
      const response = await server.inject({
        method: 'GET',
        url: '/oob/oob-id',
      })

      expect(response.statusCode).toBe(200)
      expect(response.headers['content-type']).toContain('application/json')
      expect(response.json()).toEqual({
        '@id': 'oob-message-id',
        '@type': 'https://didcomm.org/out-of-band/1.1/invitation',
      })
    } finally {
      await server.close()
    }
  })

  test('returns a 404 response when the out-of-band invitation does not exist', async () => {
    const server = buildIssuerApiServer({
      getInvitation: async () => null,
      issueCredential: async () => {
        throw new Error('This handler should not be called for a missing GET /oob request')
      },
    })

    try {
      const response = await server.inject({
        method: 'GET',
        url: '/oob/missing-id',
      })

      expect(response.statusCode).toBe(404)
      expect(response.json()).toEqual({
        message: 'Out-of-band invitation not found',
      })
    } finally {
      await server.close()
    }
  })
})
