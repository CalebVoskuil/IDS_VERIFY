import crypto from 'node:crypto'
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function toModuleUrl(filePath: string): string {
  return pathToFileURL(filePath).href
}

function generateUniqueSeed() {
  const suffix = crypto.randomBytes(8).toString('hex')
  return `e2e-test-${suffix}`.padEnd(32, '0').slice(0, 32)
}

const MONOREPO_ROOT = path.resolve(__dirname, '..', '..', '..')
const ISSUER_DIST = path.join(MONOREPO_ROOT, 'packages', 'issuer-agent', 'dist', 'src')
const VERIFIER_DIST = path.join(MONOREPO_ROOT, 'packages', 'verifier-agent', 'dist', 'src')
const E2E_DATA_DIR = path.resolve(__dirname, '..', '.data')

async function loadIssuerModules() {
  const agent = await import(toModuleUrl(path.join(ISSUER_DIST, 'agent.js')))
  const config = await import(toModuleUrl(path.join(ISSUER_DIST, 'config.js')))
  const issueCredential = await import(toModuleUrl(path.join(ISSUER_DIST, 'issue-credential.js')))
  const phase2 = await import(toModuleUrl(path.join(ISSUER_DIST, 'phase2.js')))
  const server = await import(toModuleUrl(path.join(ISSUER_DIST, 'server.js')))

  return { agent, config, issueCredential, phase2, server }
}

async function loadVerifierModules() {
  const agent = await import(toModuleUrl(path.join(VERIFIER_DIST, 'agent.js')))
  const config = await import(toModuleUrl(path.join(VERIFIER_DIST, 'config.js')))
  const proofRequest = await import(toModuleUrl(path.join(VERIFIER_DIST, 'proof-request.js')))
  const server = await import(toModuleUrl(path.join(VERIFIER_DIST, 'server.js')))

  return { agent, config, proofRequest, server }
}

describe('canteen flow (e2e)', { timeout: 120_000 }, () => {
  let issuerAgent: any
  let verifierAgent: any
  let issuerServer: any
  let verifierServer: any

  before(async () => {
    await mkdir(E2E_DATA_DIR, { recursive: true })
  })

  after(async () => {
    await issuerServer?.close().catch(() => {})
    await verifierServer?.close().catch(() => {})
    await issuerAgent?.shutdown().catch(() => {})
    await verifierAgent?.shutdown().catch(() => {})
    await rm(E2E_DATA_DIR, { recursive: true, force: true }).catch(() => {})
  })

  it('issues a credential via the issuer API and generates a proof QR via the verifier API', async () => {
    const issuer = await loadIssuerModules()
    const verifier = await loadVerifierModules()

    const uniqueSeed = generateUniqueSeed()
    console.log('[e2e] Using unique DID seed:', uniqueSeed)

    const issuerConfig = issuer.config.resolveIssuerAgentConfig(
      {
        VERO_ISSUER_AGENT_NAME: 'E2E Issuer',
        VERO_ISSUER_AGENT_API_PORT: '4000',
        VERO_ISSUER_AGENT_DIDCOMM_PORT: '4001',
        VERO_ISSUER_AGENT_PUBLIC_DIDCOMM_ENDPOINT: 'http://localhost:4001/didcomm',
        VERO_ISSUER_AGENT_INVITATION_URL_BASE: 'http://localhost:4000/oob',
        VERO_ISSUER_AGENT_WALLET_DB_PATH: path.join(E2E_DATA_DIR, 'issuer.sqlite'),
        VERO_ISSUER_AGENT_PUBLIC_DID_SEED: uniqueSeed,
        VERO_ISSUER_AGENT_LOG_LEVEL: 'error',
      } as NodeJS.ProcessEnv,
      path.join(MONOREPO_ROOT, 'packages', 'issuer-agent'),
    )

    const verifierConfig = verifier.config.resolveVerifierAgentConfig(
      {
        VERO_VERIFIER_AGENT_NAME: 'E2E Verifier',
        VERO_VERIFIER_AGENT_API_PORT: '4100',
        VERO_VERIFIER_AGENT_DIDCOMM_PORT: '4101',
        VERO_VERIFIER_AGENT_PUBLIC_DIDCOMM_ENDPOINT: 'http://localhost:4101/didcomm',
        VERO_VERIFIER_AGENT_INVITATION_URL_BASE: 'http://localhost:4100/proof-request',
        VERO_VERIFIER_AGENT_WALLET_DB_PATH: path.join(E2E_DATA_DIR, 'verifier.sqlite'),
        VERO_VERIFIER_AGENT_LOG_LEVEL: 'error',
      } as NodeJS.ProcessEnv,
      path.join(MONOREPO_ROOT, 'packages', 'verifier-agent'),
    )

    // --- Step 1: Boot issuer agent, register DID/schema/cred-def on BCovrin ---
    issuerAgent = await issuer.agent.createIssuerAgent(issuerConfig)
    await issuerAgent.initialize()
    const artifacts = await issuer.phase2.registerIssuerArtifacts(issuerAgent, issuerConfig)

    assert.match(artifacts.issuerDid, /^did:indy:bcovrin:test:/)
    assert.ok(artifacts.schemaId, 'schemaId should be truthy')
    assert.ok(artifacts.credentialDefinitionId, 'credentialDefinitionId should be truthy')

    console.log('[e2e] Issuer DID:', artifacts.issuerDid)
    console.log('[e2e] Schema ID:', artifacts.schemaId)
    console.log('[e2e] Cred Def ID:', artifacts.credentialDefinitionId)

    // --- Step 2: Start the issuer REST API ---
    const issuerInvitationStore = new Map<string, Record<string, unknown>>()
    issuerServer = issuer.server.buildIssuerApiServer({
      getInvitation: async (id: string) => issuerInvitationStore.get(id) ?? null,
      issueCredential: async (request: any) => {
        const offer = await issuer.issueCredential.createIssueCredentialOffer(
          issuerAgent,
          issuerConfig,
          artifacts,
          request,
        )
        issuerInvitationStore.set(offer.outOfBandId, offer.invitation as any)
        return issuer.issueCredential.buildIssueCredentialResponse(
          offer,
          issuerConfig.invitationUrlBase,
        )
      },
    })
    const issuerAddress = await issuerServer.listen({
      host: '127.0.0.1',
      port: issuerConfig.apiPort,
    })
    console.log('[e2e] Issuer API:', issuerAddress)

    // --- Step 3: Issue a credential via HTTP ---
    const issueResponse = await issuerServer.inject({
      method: 'POST',
      url: '/issue-credential',
      payload: {
        studentNumber: '20260042',
        fullName: 'Thabo Mokoena',
        faculty: 'Engineering & the Built Environment',
        enrollmentStatus: 'active',
        validFrom: '2026-01-15',
        validUntil: '2026-12-15',
      },
    })

    if (issueResponse.statusCode !== 200) {
      console.error('[e2e] Issue credential failed:', issueResponse.statusCode, issueResponse.body)
    }
    assert.equal(issueResponse.statusCode, 200)

    const issueResult = issueResponse.json()
    assert.equal(issueResult.issuerDid, artifacts.issuerDid)
    assert.equal(issueResult.schemaId, artifacts.schemaId)
    assert.equal(issueResult.credentialDefinitionId, artifacts.credentialDefinitionId)
    assert.ok(issueResult.invitationUrl, 'invitationUrl should be truthy')
    assert.match(issueResult.qrCodeDataUrl, /^data:image\/png;base64,/)
    assert.ok(issueResult.outOfBandId, 'outOfBandId should be truthy')

    console.log('[e2e] Credential offer created, OOB ID:', issueResult.outOfBandId)

    // --- Step 4: Verify the OOB invitation is fetchable ---
    const oobResponse = await issuerServer.inject({
      method: 'GET',
      url: `/oob/${issueResult.outOfBandId}`,
    })

    assert.equal(oobResponse.statusCode, 200)
    const invitation = oobResponse.json()
    assert.ok(invitation['@type'] ?? invitation.type, 'invitation should have @type or type')
    console.log('[e2e] OOB invitation fetched successfully')

    // --- Step 5: Boot the verifier agent ---
    verifierAgent = await verifier.agent.createVerifierAgent(verifierConfig)
    await verifierAgent.initialize()

    console.log('[e2e] Verifier agent initialized')

    // --- Step 6: Start the verifier REST API ---
    const verifierInvitationStore = new Map<string, Record<string, unknown>>()
    verifierServer = verifier.server.buildVerifierApiServer({
      generateQr: async () => {
        const proofRequest = await verifier.proofRequest.createCanteenProofRequest(
          verifierAgent,
          verifierConfig,
        )
        verifierInvitationStore.set(
          proofRequest.outOfBandId,
          proofRequest.invitation as any,
        )
        return verifier.proofRequest.buildGenerateProofQrResponse(
          proofRequest,
          verifierConfig.invitationUrlBase,
        )
      },
      getInvitation: async (id: string) => verifierInvitationStore.get(id) ?? null,
      verifyProof: async (request: { proofExchangeId: string }) =>
        verifier.proofRequest.resolveCanteenProofVerification(
          verifierAgent,
          verifierConfig,
          request,
        ),
    })
    const verifierAddress = await verifierServer.listen({
      host: '127.0.0.1',
      port: verifierConfig.apiPort,
    })
    console.log('[e2e] Verifier API:', verifierAddress)

    // --- Step 7: Generate a canteen proof QR ---
    const qrResponse = await verifierServer.inject({
      method: 'POST',
      url: '/generate-qr',
    })

    assert.equal(qrResponse.statusCode, 200)

    const qrResult = qrResponse.json()
    assert.match(qrResult.qrCodeDataUrl, /^data:image\/png;base64,/)
    assert.ok(qrResult.proofExchangeId, 'proofExchangeId should be truthy')
    assert.ok(qrResult.outOfBandId, 'outOfBandId should be truthy')
    assert.ok(
      Array.isArray(qrResult.proofRequest?.requestedAttributes) &&
        qrResult.proofRequest.requestedAttributes.includes('studentNumber') &&
        qrResult.proofRequest.requestedAttributes.includes('enrollmentStatus'),
      'requestedAttributes should include studentNumber and enrollmentStatus',
    )

    console.log('[e2e] Proof QR generated, exchange ID:', qrResult.proofExchangeId)

    // --- Step 8: Verify the proof-request invitation is fetchable ---
    const proofOobResponse = await verifierServer.inject({
      method: 'GET',
      url: `/proof-request/${qrResult.outOfBandId}`,
    })

    assert.equal(proofOobResponse.statusCode, 200)
    console.log('[e2e] Proof-request OOB invitation fetched successfully')

    // --- Step 9: Check proof status (pending — no wallet has responded yet) ---
    const verifyResponse = await verifierServer.inject({
      method: 'POST',
      url: '/verify-proof',
      payload: { proofExchangeId: qrResult.proofExchangeId },
    })

    assert.equal(verifyResponse.statusCode, 200)

    const verifyResult = verifyResponse.json()
    assert.equal(verifyResult.status, 'pending')
    assert.equal(verifyResult.isApproved, false)
    assert.equal(verifyResult.proofExchangeId, qrResult.proofExchangeId)

    console.log('[e2e] Proof status is pending (wallet has not responded yet)')
    console.log('[e2e] Full canteen flow completed successfully')
  })
})
