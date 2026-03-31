import { bootstrapVerifierAgent } from './agent.js'
import { resolveVerifierAgentConfig } from './config.js'
import {
  buildGenerateProofQrResponse,
  createCanteenProofRequest,
  resolveCanteenProofVerification,
} from './proof-request.js'
import { buildVerifierApiServer } from './server.js'

async function main() {
  const config = resolveVerifierAgentConfig()
  const { agent, did } = await bootstrapVerifierAgent(config)
  let server: Awaited<ReturnType<typeof buildVerifierApiServer>> | undefined
  const invitationStore = new Map<string, Record<string, unknown>>()

  try {
    server = buildVerifierApiServer({
      generateQr: async () => {
        const proofRequest = await createCanteenProofRequest(agent, config)

        invitationStore.set(proofRequest.outOfBandId, proofRequest.invitation)

        return buildGenerateProofQrResponse(proofRequest, config.invitationUrlBase)
      },
      getInvitation: async (outOfBandId) => invitationStore.get(outOfBandId) ?? null,
      verifyProof: async (request) => resolveCanteenProofVerification(agent, config, request),
    })

    const serverAddress = await server.listen({
      host: config.apiHost,
      port: config.apiPort,
    })

    const shutdown = async (signal?: string) => {
      console.log(`[verifier-agent] Shutting down${signal ? ` after ${signal}` : ''}`)

      await server?.close()
      await agent.shutdown()
    }

    for (const signal of ['SIGINT', 'SIGTERM'] as const) {
      process.once(signal, () => {
        void shutdown(signal)
          .then(() => {
            process.exit(0)
          })
          .catch((error) => {
            console.error('[verifier-agent] Shutdown failed')
            console.error(error)
            process.exit(1)
          })
      })
    }

    console.log(`[verifier-agent] Booted against ${config.indyNamespace}`)
    console.log(`[verifier-agent] DID: ${did}`)
    console.log(`[verifier-agent] REST API: ${serverAddress}`)
    console.log(`[verifier-agent] DidComm endpoint: ${config.publicDidCommEndpoint}`)
    console.log(`[verifier-agent] Invitation base URL: ${config.invitationUrlBase}`)
  } catch (error) {
    await server?.close().catch(() => undefined)
    await agent.shutdown().catch(() => undefined)
    throw error
  }
}

void main().catch((error) => {
  console.error('[verifier-agent] Bootstrap failed')
  console.error(error)
  process.exitCode = 1
})
