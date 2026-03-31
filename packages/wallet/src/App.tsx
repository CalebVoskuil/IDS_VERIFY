import React from 'react'
import { StatusBar } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { AgentProvider } from './context/AgentContext'
import { CredentialProvider } from './context/CredentialContext'
import AppNavigator from './navigation/AppNavigator'

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#f4f1ea" />
      <AgentProvider>
        <CredentialProvider>
          <AppNavigator />
        </CredentialProvider>
      </AgentProvider>
    </SafeAreaProvider>
  )
}
