import type { DidCreateResult } from '@credo-ts/core'

import { fetchGenesisTransactions, requireFinishedDid } from '../src/bootstrap.js'

describe('fetchGenesisTransactions', () => {
  test('returns a trimmed genesis string', async () => {
    const genesisTransactions = await fetchGenesisTransactions(
      'http://example.test/genesis',
      async () =>
        new Response('  {"txn":"1"}\n', {
          status: 200,
        }),
    )

    expect(genesisTransactions).toBe('{"txn":"1"}')
  })

  test('throws when the remote call is unsuccessful', async () => {
    await expect(
      fetchGenesisTransactions(
        'http://example.test/genesis',
        async () =>
          new Response('not found', {
            status: 404,
            statusText: 'Not Found',
          }),
      ),
    ).rejects.toThrow(
      'Unable to fetch genesis transactions from http://example.test/genesis (status 404)',
    )
  })
})

describe('requireFinishedDid', () => {
  test('returns the created did for a finished result', () => {
    const did = requireFinishedDid({
      didDocumentMetadata: {},
      didRegistrationMetadata: {},
      didState: {
        did: 'did:key:z6Mkexample',
        didDocument: {} as never,
        state: 'finished',
      },
    } as DidCreateResult)

    expect(did).toBe('did:key:z6Mkexample')
  })

  test('throws the underlying failure reason', () => {
    expect(() =>
      requireFinishedDid({
        didDocumentMetadata: {},
        didRegistrationMetadata: {},
        didState: {
          reason: 'wallet is locked',
          state: 'failed',
        },
      } as DidCreateResult),
    ).toThrow('Issuer bootstrap DID creation failed: wallet is locked')
  })
})
