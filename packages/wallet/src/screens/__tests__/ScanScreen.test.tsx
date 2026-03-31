import React from 'react'
import renderer, { act, ReactTestRenderer } from 'react-test-renderer'

import { AgentProvider } from '../../context/AgentContext'
import ScanScreen from '../ScanScreen'

jest.mock('../../agent/createWalletAgent', () => ({
  initializeWalletAgent: jest.fn(() => new Promise(() => {})),
  getWalletStoragePath: jest.fn(() => '/mock/wallet.sqlite'),
}))

describe('ScanScreen', () => {
  it('renders correctly', () => {
    let root: ReactTestRenderer

    act(() => {
      root = renderer.create(
        <AgentProvider>
          <ScanScreen />
        </AgentProvider>,
      )
    })

    expect(root!.toJSON()).toMatchSnapshot()

    act(() => {
      root.unmount()
    })
  })
})
