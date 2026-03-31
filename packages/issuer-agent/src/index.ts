import { createIssuerAgent } from './agent.js'
import { resolveIssuerAgentConfig } from './config.js'
import {
  buildIssueCredentialResponse,
  createIssueCredentialOffer,
} from './issue-credential.js'
import { registerIssuerArtifacts } from './phase2.js'
import { buildIssuerApiServer } from './server.js'

async function main() {
  const config = resolveIssuerAgentConfig()
  const agent = await createIssuerAgent(config)
  let server: Awaited<ReturnType<typeof buildIssuerApiServer>> | undefined

  try {
    await agent.initialize()

    const artifacts = await registerIssuerArtifacts(agent, config)
    const invitationStore = new Map<string, Record<string, unknown>>()
    server = buildIssuerApiServer({
      getInvitation: async (outOfBandId) => invitationStore.get(outOfBandId) ?? null,
      issueCredential: async (request) => {
        const offer = await createIssueCredentialOffer(agent, config, artifacts, request)

        invitationStore.set(offer.outOfBandId, offer.invitation)

        return buildIssueCredentialResponse(offer, config.invitationUrlBase)
      },
    })
    const serverAddress = await server.listen({
      host: config.apiHost,
      port: config.apiPort,
    })

    const shutdown = async (signal?: string) => {
      console.log(`[issuer-agent] Shutting down${signal ? ` after ${signal}` : ''}`)

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
            console.error('[issuer-agent] Shutdown failed')
            console.error(error)
            process.exit(1)
          })
      })
    }

    console.log(`[issuer-agent] Booted against ${config.indyNamespace}`)
    console.log(`[issuer-agent] DID: ${artifacts.issuerDid}`)
    console.log(`[issuer-agent] Schema ID: ${artifacts.schemaId}`)
    console.log(`[issuer-agent] Credential Definition ID: ${artifacts.credentialDefinitionId}`)
    console.log(`[issuer-agent] REST API: ${serverAddress}`)
    console.log(`[issuer-agent] DidComm endpoint: ${config.publicDidCommEndpoint}`)
    console.log(`[issuer-agent] Invitation base URL: ${config.invitationUrlBase}`)
  } catch (error) {
    await server?.close().catch(() => undefined)
    await agent.shutdown().catch(() => undefined)
    throw error
  }
}

void main().catch((error) => {
  console.error('[issuer-agent] Bootstrap failed')
  console.error(error)
  process.exitCode = 1
})
