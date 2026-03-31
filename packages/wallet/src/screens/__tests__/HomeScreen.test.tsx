import React from 'react'
import renderer, { act, ReactTestRenderer } from 'react-test-renderer'

import { AgentProvider } from '../../context/AgentContext'
import { CredentialProvider } from '../../context/CredentialContext'
import HomeScreen from '../HomeScreen'

jest.mock('../../agent/createWalletAgent', () => ({
  initializeWalletAgent: jest.fn(() => new Promise(() => {})),
  getWalletStoragePath: jest.fn(() => '/mock/wallet.sqlite'),
}))

describe('HomeScreen', () => {
  it('renders correctly with a mock credential', () => {
    let root: ReactTestRenderer

    act(() => {
      root = renderer.create(
        <AgentProvider>
          <CredentialProvider>
            <HomeScreen />
          </CredentialProvider>
        </AgentProvider>,
      )
    })

    expect(root!.toJSON()).toMatchSnapshot()

    act(() => {
      root.unmount()
    })
  })
})
