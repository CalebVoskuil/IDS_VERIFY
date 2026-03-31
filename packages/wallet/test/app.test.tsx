import React from 'react'
import renderer, { act } from 'react-test-renderer'

import App from '../src/App'

jest.mock('../src/agent/createWalletAgent', () => ({
  getWalletStoragePath: jest.fn(() => '/mock/wallet.sqlite'),
  initializeWalletAgent: jest.fn(() => new Promise(() => {})),
}))

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native')
  return {
    ...actual,
    NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
  }
})

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => children,
    Screen: ({ component: Component }: { component: React.ComponentType }) => <Component />,
  }),
}))

describe('App', () => {
  it('renders without crashing', async () => {
    let app: renderer.ReactTestRenderer

    await act(async () => {
      app = renderer.create(<App />)
      await Promise.resolve()
    })

    expect(app!.toJSON()).toBeTruthy()
  })
})
