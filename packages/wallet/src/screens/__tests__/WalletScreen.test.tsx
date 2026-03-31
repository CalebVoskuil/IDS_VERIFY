import React from 'react'
import renderer, { act, ReactTestRenderer } from 'react-test-renderer'
import { View } from 'react-native'

import { CredentialProvider } from '../../context/CredentialContext'
import WalletScreen from '../WalletScreen'

jest.mock('react-native/Libraries/Lists/FlatList', () => {
  const RealView = jest.requireActual('react-native').View
  return {
    __esModule: true,
    default: ({ data, renderItem, ListEmptyComponent, keyExtractor }: any) => {
      if (!data || data.length === 0) {
        return ListEmptyComponent ?? null
      }
      const getKey = keyExtractor ?? ((_: any, i: number) => String(i))
      return (
        <RealView testID="flat-list-mock">
          {data.map((item: any, index: number) => (
            <RealView key={getKey(item, index)}>
              {renderItem({ item, index, separators: {} })}
            </RealView>
          ))}
        </RealView>
      )
    },
  }
})

describe('WalletScreen', () => {
  it('renders correctly with mock transactions', () => {
    let root: ReactTestRenderer

    act(() => {
      root = renderer.create(
        <CredentialProvider>
          <WalletScreen />
        </CredentialProvider>,
      )
    })

    expect(root!.toJSON()).toMatchSnapshot()

    act(() => {
      root.unmount()
    })
  })
})
