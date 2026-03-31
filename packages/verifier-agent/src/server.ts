import Fastify from 'fastify'
import { ZodError } from 'zod'

import {
  parseVerifyProofRequest,
  toVerifyProofValidationErrorResponse,
  type GenerateProofQrResponse,
  type VerifyProofRequest,
  type VerifyProofResponse,
} from './proof-request.js'

export interface BuildVerifierApiServerOptions {
  generateQr(): Promise<GenerateProofQrResponse>
  getInvitation(outOfBandId: string): Promise<Record<string, unknown> | null>
  verifyProof(request: VerifyProofRequest): Promise<VerifyProofResponse | null>
}

export function buildVerifierApiServer(options: BuildVerifierApiServerOptions) {
  const server = Fastify({
    logger: false,
  })

  server.post('/generate-qr', async (_request, reply) => {
    const response = await options.generateQr()

    return reply.code(200).send(response)
  })

  server.get('/proof-request/:outOfBandId', async (request, reply) => {
    const params = request.params as { outOfBandId?: string }

    if (!params.outOfBandId) {
      return reply.code(400).send({
        message: 'Missing out-of-band invitation identifier',
      })
    }

    const invitation = await options.getInvitation(params.outOfBandId)

    if (!invitation) {
      return reply.code(404).send({
        message: 'Out-of-band invitation not found',
      })
    }

    return reply
      .code(200)
      .header('Content-Type', 'application/json')
      .send(invitation)
  })

  server.post('/verify-proof', async (request, reply) => {
    let verifyProofRequest: VerifyProofRequest

    try {
      verifyProofRequest = parseVerifyProofRequest(request.body)
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send(toVerifyProofValidationErrorResponse(error))
      }

      throw error
    }

    const response = await options.verifyProof(verifyProofRequest)

    if (!response) {
      return reply.code(404).send({
        message: 'Proof exchange not found',
      })
    }

    return reply.code(200).send(response)
  })

  return server
}
