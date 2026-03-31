import { buildVerifierApiServer } from '../src/server.js'

describe('buildVerifierApiServer', () => {
  it('returns a generated QR response', async () => {
    const server = buildVerifierApiServer({
      generateQr: async () => ({
        invitation: { '@id': 'invitation-id' },
        invitationUrl: 'http://localhost:3100/proof-request/out-of-band-id',
        outOfBandId: 'out-of-band-id',
        proofExchangeId: 'proof-id',
        proofRequest: {
          requestedAttributes: ['studentNumber', 'enrollmentStatus', 'validFrom', 'validUntil'],
          validityCheck: 'revealed-date-claims',
        },
        qrCodeDataUrl: 'data:image/png;base64,abc123',
      }),
      getInvitation: async () => null,
      verifyProof: async () => null,
    })

    const response = await server.inject({
      method: 'POST',
      url: '/generate-qr',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      invitation: { '@id': 'invitation-id' },
      invitationUrl: 'http://localhost:3100/proof-request/out-of-band-id',
      outOfBandId: 'out-of-band-id',
      proofExchangeId: 'proof-id',
      proofRequest: {
        requestedAttributes: ['studentNumber', 'enrollmentStatus', 'validFrom', 'validUntil'],
        validityCheck: 'revealed-date-claims',
      },
      qrCodeDataUrl: 'data:image/png;base64,abc123',
    })

    await server.close()
  })

  it('returns 404 when a proof invitation is missing', async () => {
    const server = buildVerifierApiServer({
      generateQr: async () => {
        throw new Error('not used')
      },
      getInvitation: async () => null,
      verifyProof: async () => null,
    })

    const response = await server.inject({
      method: 'GET',
      url: '/proof-request/missing',
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({
      message: 'Out-of-band invitation not found',
    })

    await server.close()
  })

  it('returns 400 when the verify-proof request is invalid', async () => {
    const server = buildVerifierApiServer({
      generateQr: async () => {
        throw new Error('not used')
      },
      getInvitation: async () => null,
      verifyProof: async () => null,
    })

    const response = await server.inject({
      method: 'POST',
      payload: {},
      url: '/verify-proof',
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      issues: [
        {
          message: 'proofExchangeId is required',
          path: 'proofExchangeId',
        },
      ],
      message: 'Invalid verify-proof request',
    })

    await server.close()
  })

  it('returns 404 when a proof exchange record is missing', async () => {
    const server = buildVerifierApiServer({
      generateQr: async () => {
        throw new Error('not used')
      },
      getInvitation: async () => null,
      verifyProof: async () => null,
    })

    const response = await server.inject({
      method: 'POST',
      payload: {
        proofExchangeId: 'missing',
      },
      url: '/verify-proof',
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({
      message: 'Proof exchange not found',
    })

    await server.close()
  })
})
