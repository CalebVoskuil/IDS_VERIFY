import React, { useCallback } from 'react'
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { useCredential } from '../context/CredentialContext'

const MOCK_PROOF_REQUEST = {
  verifierLabel: 'UCT Canteen — Upper Campus',
  requestedAttributes: [
    'studentNumber',
    'enrollmentStatus',
    'validFrom',
    'validUntil',
  ],
}

export default function ApprovalScreen() {
  const { credential, pendingProof, setPendingProof } = useCredential()

  const request = pendingProof ?? {
    id: 'mock-proof-001',
    verifierLabel: MOCK_PROOF_REQUEST.verifierLabel,
    requestedAttributes: MOCK_PROOF_REQUEST.requestedAttributes,
    receivedAt: new Date().toISOString(),
  }

  const handleApprove = useCallback(() => {
    Alert.alert(
      'Proof Shared',
      'Your student credential has been shared with the verifier.',
    )
    setPendingProof(null)
  }, [setPendingProof])

  const handleDeny = useCallback(() => {
    Alert.alert('Denied', 'The proof request was declined.')
    setPendingProof(null)
  }, [setPendingProof])

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>🔐</Text>
        </View>

        <Text style={styles.heading}>Verification Request</Text>
        <Text style={styles.verifierName}>{request.verifierLabel}</Text>
        <Text style={styles.subtitle}>
          is requesting access to the following information:
        </Text>

        <View style={styles.attributeList}>
          {request.requestedAttributes.map((attr) => {
            const displayValue =
              credential && attr in credential
                ? String(credential[attr as keyof typeof credential])
                : '—'

            return (
              <View key={attr} style={styles.attributeRow}>
                <View style={styles.attrLabelContainer}>
                  <View style={styles.checkCircle}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                  <Text style={styles.attrLabel}>{attr}</Text>
                </View>
                <Text style={styles.attrValue} numberOfLines={1}>
                  {displayValue}
                </Text>
              </View>
            )
          })}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.denyButton]}
          onPress={handleDeny}
        >
          <Text style={styles.denyButtonText}>Deny</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.approveButton]}
          onPress={handleApprove}
        >
          <Text style={styles.approveButtonText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f1ea',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 32,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  verifierName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  attributeList: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  attributeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  attrLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '700',
  },
  attrLabel: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  attrValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
    maxWidth: 160,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  denyButton: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  denyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
  },
  approveButton: {
    backgroundColor: '#3b82f6',
  },
  approveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
})
