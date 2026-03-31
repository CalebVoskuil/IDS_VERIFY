import Fastify from 'fastify'
import { ZodError } from 'zod'

import {
  parseIssueCredentialRequest,
  toIssueCredentialValidationErrorResponse,
  type IssueCredentialRequest,
  type IssueCredentialResponse,
} from './issue-credential.js'

export interface BuildIssuerApiServerOptions {
  getInvitation(outOfBandId: string): Promise<Record<string, unknown> | null>
  issueCredential(request: IssueCredentialRequest): Promise<IssueCredentialResponse>
}

export function buildIssuerApiServer(options: BuildIssuerApiServerOptions) {
  const server = Fastify({
    logger: false,
  })

  server.post('/issue-credential', async (request, reply) => {
    let issueCredentialRequest: IssueCredentialRequest

    try {
      issueCredentialRequest = parseIssueCredentialRequest(request.body)
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send(toIssueCredentialValidationErrorResponse(error))
      }

      throw error
    }

    const response = await options.issueCredential(issueCredentialRequest)

    return reply.code(200).send(response)
  })

  server.get('/oob/:outOfBandId', async (request, reply) => {
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

  return server
}
