import React, { useCallback, useState } from 'react'
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { useAgent } from '../context/AgentContext'

export default function ScanScreen() {
  const { status: agentStatus } = useAgent()
  const [lastScanned, setLastScanned] = useState<string | null>(null)

  const handleMockScan = useCallback(() => {
    const mockInvitationUrl =
      'http://localhost:3000/oob/mock-invitation-id'

    setLastScanned(mockInvitationUrl)

    if (agentStatus !== 'ready') {
      Alert.alert(
        'Agent not ready',
        'The wallet agent is still initializing. Please wait and try again.',
      )
      return
    }

    Alert.alert(
      'QR Code Scanned',
      `Invitation URL:\n${mockInvitationUrl}\n\nIn a live build, the agent would process this OOB invitation automatically.`,
    )
  }, [agentStatus])

  return (
    <View style={styles.container}>
      <View style={styles.cameraPlaceholder}>
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <Text style={styles.placeholderText}>
          Camera preview will appear here
        </Text>
        <Text style={styles.placeholderSubtext}>
          Point your camera at an issuer or verifier QR code
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.mockButton} onPress={handleMockScan}>
          <Text style={styles.mockButtonText}>Simulate QR Scan</Text>
        </TouchableOpacity>

        {lastScanned && (
          <Text style={styles.lastScannedText} numberOfLines={2}>
            Last scanned: {lastScanned}
          </Text>
        )}
      </View>
    </View>
  )
}

const CORNER_SIZE = 24
const CORNER_BORDER = 3

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e293b',
  },
  scanFrame: {
    width: 240,
    height: 240,
    marginBottom: 24,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_BORDER,
    borderLeftWidth: CORNER_BORDER,
    borderColor: '#fff',
    borderTopLeftRadius: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_BORDER,
    borderRightWidth: CORNER_BORDER,
    borderColor: '#fff',
    borderTopRightRadius: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_BORDER,
    borderLeftWidth: CORNER_BORDER,
    borderColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_BORDER,
    borderRightWidth: CORNER_BORDER,
    borderColor: '#fff',
    borderBottomRightRadius: 4,
  },
  placeholderText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderSubtext: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  footer: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  mockButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  mockButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  lastScannedText: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
})
