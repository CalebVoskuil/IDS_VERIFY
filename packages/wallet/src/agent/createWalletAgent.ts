import {
  AnonCredsDidCommCredentialFormatService,
  AnonCredsDidCommProofFormatService,
  AnonCredsModule,
} from '@credo-ts/anoncreds'
import { AskarModule } from '@credo-ts/askar'
import { Agent, ConsoleLogger, DidsModule } from '@credo-ts/core'
import {
  DidCommAutoAcceptCredential,
  DidCommAutoAcceptProof,
  DidCommCredentialV2Protocol,
  DidCommHttpOutboundTransport,
  DidCommModule,
  DidCommProofV2Protocol,
} from '@credo-ts/didcomm'
import {
  IndyVdrAnonCredsRegistry,
  IndyVdrIndyDidResolver,
  IndyVdrModule,
  IndyVdrSovDidResolver,
} from '@credo-ts/indy-vdr'
import { agentDependencies } from '@credo-ts/react-native'
import { anoncreds } from '@hyperledger/anoncreds-react-native'
import { indyVdr } from '@hyperledger/indy-vdr-react-native'
import { NativeAskar } from '@openwallet-foundation/askar-react-native'
import { DocumentDirectoryPath } from 'react-native-fs'

import { createWalletAgentConfig } from './config'

let walletAgentPromise: Promise<Agent> | null = null

export function getWalletStoragePath() {
  return createWalletAgentConfig(DocumentDirectoryPath).walletDbPath
}

async function fetchGenesisTransactions(genesisUrl: string): Promise<string> {
  const response = await fetch(genesisUrl)

  if (!response.ok) {
    throw new Error(
      `Unable to fetch genesis transactions from ${genesisUrl} (status ${response.status})`,
    )
  }

  const text = (await response.text()).trim()

  if (!text) {
    throw new Error(`Received empty genesis transactions from ${genesisUrl}`)
  }

  return text
}

export async function initializeWalletAgent() {
  if (!walletAgentPromise) {
    walletAgentPromise = (async () => {
      const config = createWalletAgentConfig(DocumentDirectoryPath)

      const genesisTransactions = await fetchGenesisTransactions(
        config.bcovrinGenesisUrl,
      )

      const agent = new Agent({
        config: {
          allowInsecureHttpUrls: config.allowInsecureHttpUrls,
          logger: new ConsoleLogger(config.logLevel),
        },
        dependencies: agentDependencies,
        modules: {
          anoncreds: new AnonCredsModule({
            anoncreds,
            registries: [new IndyVdrAnonCredsRegistry()],
          }),
          askar: new AskarModule({
            askar: NativeAskar.instance,
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
            credentials: {
              credentialProtocols: [
                new DidCommCredentialV2Protocol({
                  credentialFormats: [
                    new AnonCredsDidCommCredentialFormatService(),
                  ],
                }),
              ],
              autoAcceptCredential: DidCommAutoAcceptCredential.ContentApproved,
            },
            proofs: {
              proofProtocols: [
                new DidCommProofV2Protocol({
                  proofFormats: [
                    new AnonCredsDidCommProofFormatService(),
                  ],
                }),
              ],
              autoAcceptProof: DidCommAutoAcceptProof.ContentApproved,
            },
            transports: {
              outbound: [new DidCommHttpOutboundTransport()],
            },
          }),
          dids: new DidsModule({
            registrars: [],
            resolvers: [
              new IndyVdrIndyDidResolver(),
              new IndyVdrSovDidResolver(),
            ],
          }),
          indyVdr: new IndyVdrModule({
            indyVdr,
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

      await agent.initialize()

      return agent
    })().catch((error) => {
      walletAgentPromise = null
      throw error
    })
  }

  return walletAgentPromise
}
