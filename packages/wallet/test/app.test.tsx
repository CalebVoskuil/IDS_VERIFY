import React from 'react'
import { Text } from 'react-native'
import renderer, { act } from 'react-test-renderer'

import App from '../src/App'
import {
  getWalletStoragePath,
  initializeWalletAgent,
} from '../src/agent/createWalletAgent'

jest.mock('../src/agent/createWalletAgent', () => ({
  getWalletStoragePath: jest.fn(),
  initializeWalletAgent: jest.fn(),
}))

const mockedGetWalletStoragePath = jest.mocked(getWalletStoragePath)
const mockedInitializeWalletAgent = jest.mocked(initializeWalletAgent)

describe('App', () => {
  it('shows the initialized wallet status after the agent boots', async () => {
    mockedGetWalletStoragePath.mockReturnValue(
      '/data/user/0/com.vero.wallet/files/vero-wallet.sqlite',
    )
    mockedInitializeWalletAgent.mockResolvedValue({} as never)

    let app: renderer.ReactTestRenderer

    await act(async () => {
      app = renderer.create(<App />)
      await Promise.resolve()
    })

    const textContent = app!.root
      .findAllByType(Text)
      .flatMap((node) =>
        Array.isArray(node.props.children) ? node.props.children : [node.props.children],
      )
      .join(' ')

    expect(textContent).toContain('Wallet agent ready.')
    expect(textContent).toContain('/data/user/0/com.vero.wallet/files/vero-wallet.sqlite')
  })
})
