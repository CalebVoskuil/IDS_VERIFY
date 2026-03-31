import type { DidCreateResult } from '@credo-ts/core'

export async function fetchGenesisTransactions(
  genesisUrl: string,
  fetchFn: typeof fetch = fetch,
): Promise<string> {
  const response = await fetchFn(genesisUrl)

  if (!response.ok) {
    throw new Error(
      `Unable to fetch genesis transactions from ${genesisUrl} (status ${response.status})`,
    )
  }

  const genesisTransactions = (await response.text()).trim()

  if (!genesisTransactions) {
    throw new Error(`Received empty genesis transactions from ${genesisUrl}`)
  }

  return genesisTransactions
}

export function requireFinishedDid(result: DidCreateResult): string {
  const { didState } = result

  if (didState.state === 'finished') {
    return didState.did
  }

  if (didState.state === 'failed') {
    throw new Error(`Issuer bootstrap DID creation failed: ${didState.reason}`)
  }

  if (didState.state === 'action') {
    throw new Error(`Issuer bootstrap DID creation requires manual action: ${didState.action}`)
  }

  throw new Error('Issuer bootstrap DID creation did not finish yet')
}
