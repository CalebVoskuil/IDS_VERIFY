import React from 'react'
import renderer, { act, ReactTestRenderer } from 'react-test-renderer'

import { CredentialProvider } from '../../context/CredentialContext'
import ApprovalScreen from '../ApprovalScreen'

describe('ApprovalScreen', () => {
  it('renders correctly with mock proof request', () => {
    let root: ReactTestRenderer

    act(() => {
      root = renderer.create(
        <CredentialProvider>
          <ApprovalScreen />
        </CredentialProvider>,
      )
    })

    expect(root!.toJSON()).toMatchSnapshot()

    act(() => {
      root.unmount()
    })
  })
})
