import React from 'react'
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native'

export default function App(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <Text style={styles.title}>Vero Wallet</Text>
        <Text style={styles.subtitle}>Phase 6 bootstrap in progress.</Text>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
  },
})
