import { AskarModule } from '@credo-ts/askar'
import { Agent, ConsoleLogger } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/react-native'
import { NativeAskar } from '@openwallet-foundation/askar-react-native'
import { DocumentDirectoryPath } from 'react-native-fs'

import { createWalletAgentConfig } from './config'

let walletAgentPromise: Promise<Agent> | null = null

export function getWalletStoragePath() {
  return createWalletAgentConfig(DocumentDirectoryPath).walletDbPath
}

export async function initializeWalletAgent() {
  if (!walletAgentPromise) {
    walletAgentPromise = (async () => {
      const config = createWalletAgentConfig(DocumentDirectoryPath)

      const agent = new Agent({
        config: {
          allowInsecureHttpUrls: config.allowInsecureHttpUrls,
          logger: new ConsoleLogger(config.logLevel),
        },
        dependencies: agentDependencies,
        modules: {
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
