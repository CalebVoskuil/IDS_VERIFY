import React, { useEffect, useState } from 'react'
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native'

import {
  getWalletStoragePath,
  initializeWalletAgent,
} from './agent/createWalletAgent'

type WalletBootState =
  | {
      detail: string
      status: 'starting'
      title: string
    }
  | {
      detail: string
      status: 'ready'
      title: string
    }
  | {
      detail: string
      status: 'failed'
      title: string
    }

export default function App(): React.JSX.Element {
  const [bootState, setBootState] = useState<WalletBootState>({
    status: 'starting',
    title: 'Starting wallet agent...',
    detail: getWalletStoragePath(),
  })

  useEffect(() => {
    let isActive = true

    void initializeWalletAgent()
      .then(() => {
        if (!isActive) {
          return
        }

        setBootState({
          status: 'ready',
          title: 'Wallet agent ready.',
          detail: getWalletStoragePath(),
        })
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return
        }

        const errorMessage =
          error instanceof Error ? error.message : 'Unknown wallet bootstrap error'

        setBootState({
          status: 'failed',
          title: 'Wallet agent failed to start.',
          detail: errorMessage,
        })
      })

    return () => {
      isActive = false
    }
  }, [])

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <Text style={styles.title}>Vero Wallet</Text>
        <Text style={styles.statusTitle}>{bootState.title}</Text>
        <Text style={styles.subtitle}>{bootState.detail}</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f1ea',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#f4f1ea',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
  },
})
