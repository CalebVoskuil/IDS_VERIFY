import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

import type { Agent } from '@credo-ts/core'

import { fetchGenesisTransactions, requireFinishedDid } from './bootstrap.js'
import type { IssuerAgentConfig } from './config.js'

export interface BootstrapIssuerAgentOptions {
  fetchFn?: typeof fetch
}

let isDidCommMessageJsonPatched = false

async function ensureWalletStorageDirectory(walletDbPath: string) {
  await mkdir(path.dirname(walletDbPath), { recursive: true })
}

function patchDidCommMessageJson(DidCommMessage: {
  prototype: {
    toJSON(options?: { useDidSovPrefixWhereAllowed?: boolean }): Record<string, unknown>
  }
}) {
  if (isDidCommMessageJsonPatched) {
    return
  }

  const originalToJson = DidCommMessage.prototype.toJSON

  DidCommMessage.prototype.toJSON = function toJSON(options) {
    const json = originalToJson.call(this, options)

    if (typeof json.type === 'string' && typeof json['@type'] !== 'string') {
      json['@type'] = json.type
    }

    if (typeof json.id === 'string' && typeof json['@id'] !== 'string') {
      json['@id'] = json.id
    }

    return json
  }

  isDidCommMessageJsonPatched = true
}

export async function createIssuerAgent(
  config: IssuerAgentConfig,
  options: BootstrapIssuerAgentOptions = {},
) {
  await ensureWalletStorageDirectory(config.walletDbPath)

  const require = createRequire(import.meta.url)
  const { anoncredsNodeJS } = require('@hyperledger/anoncreds-nodejs')
  const { indyVdrNodeJS } = require('@hyperledger/indy-vdr-nodejs')
  const { askarNodeJS } = require('@openwallet-foundation/askar-nodejs')

  const [
    { AnonCredsDidCommCredentialFormatService, AnonCredsModule },
    { AskarModule },
    { Agent, ConsoleLogger, DidsModule },
    { DidCommCredentialV2Protocol, DidCommHttpOutboundTransport, DidCommMessage, DidCommModule },
    {
      IndyVdrAnonCredsRegistry,
      IndyVdrIndyDidRegistrar,
      IndyVdrIndyDidResolver,
      IndyVdrModule,
      IndyVdrSovDidResolver,
    },
    { DidCommHttpInboundTransport, agentDependencies },
  ] = await Promise.all([
    import('@credo-ts/anoncreds'),
    import('@credo-ts/askar'),
    import('@credo-ts/core'),
    import('@credo-ts/didcomm'),
    import('@credo-ts/indy-vdr'),
    import('@credo-ts/node'),
  ])

  const genesisTransactions = await fetchGenesisTransactions(
    config.bcovrinGenesisUrl,
    options.fetchFn,
  )

  patchDidCommMessageJson(DidCommMessage)

  return new Agent({
    config: {
      allowInsecureHttpUrls: config.allowInsecureHttpUrls,
      logger: new ConsoleLogger(config.logLevel),
    },
    dependencies: agentDependencies,
    modules: {
      anoncreds: new AnonCredsModule({
        anoncreds: anoncredsNodeJS,
        registries: [new IndyVdrAnonCredsRegistry()],
      }),
      askar: new AskarModule({
        askar: askarNodeJS,
        store: {
          database: {
            type: 'sqlite',
            config: {
              path: config.walletDbPath,
            },
          },
          id: config.walletId,
          key: config.walletKey,
          keyDerivationMethod: config.walletKeyDerivationMethod,
        },
      }),
      didcomm: new DidCommModule({
        basicMessages: false,
        credentials: {
          credentialProtocols: [
            new DidCommCredentialV2Protocol({
              credentialFormats: [new AnonCredsDidCommCredentialFormatService()],
            }),
          ],
        },
        endpoints: [config.publicDidCommEndpoint],
        mediationRecipient: false,
        mediator: false,
        messagePickup: false,
        proofs: false,
        transports: {
          inbound: [
            new DidCommHttpInboundTransport({
              path: config.didCommPath,
              port: config.didCommPort,
            }),
          ],
          outbound: [new DidCommHttpOutboundTransport()],
        },
      }),
      dids: new DidsModule({
        registrars: [new IndyVdrIndyDidRegistrar()],
        resolvers: [new IndyVdrIndyDidResolver(), new IndyVdrSovDidResolver()],
      }),
      indyVdr: new IndyVdrModule({
        indyVdr: indyVdrNodeJS,
        networks: [
          {
            connectOnStartup: true,
            genesisTransactions,
            indyNamespace: config.indyNamespace,
            isProduction: false,
          },
        ],
      }),
    },
  })
}

export async function createBootDid(agent: Agent) {
  const didResult = await agent.dids.create({
    method: 'key',
    options: {
      createKey: {
        type: {
          crv: 'Ed25519',
          kty: 'OKP',
        },
      },
    },
  })

  return requireFinishedDid(didResult)
}

export async function bootstrapIssuerAgent(
  config: IssuerAgentConfig,
  options: BootstrapIssuerAgentOptions = {},
) {
  const agent = await createIssuerAgent(config, options)

  await agent.initialize()

  const did = await createBootDid(agent)

  return { agent, did }
}
