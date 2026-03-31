import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { useAgent } from '../context/AgentContext'
import { useCredential } from '../context/CredentialContext'

function AgentStatusBadge({ status }: { status: string }) {
  const color =
    status === 'ready' ? '#16a34a' : status === 'failed' ? '#dc2626' : '#ca8a04'
  const label =
    status === 'ready' ? 'Connected' : status === 'failed' ? 'Offline' : 'Connecting...'

  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  )
}

export default function HomeScreen() {
  const { status: agentStatus } = useAgent()
  const { credential } = useCredential()

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vero Wallet</Text>
        <AgentStatusBadge status={agentStatus} />
      </View>

      {credential ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>UCT Student Credential</Text>
          <View style={styles.cardDivider} />
          <View style={styles.cardRow}>
            <Text style={styles.fieldLabel}>Name</Text>
            <Text style={styles.fieldValue}>{credential.fullName}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.fieldLabel}>Student Number</Text>
            <Text style={styles.fieldValue}>{credential.studentNumber}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.fieldLabel}>Faculty</Text>
            <Text style={styles.fieldValue}>{credential.faculty}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.fieldLabel}>Enrollment</Text>
            <Text style={[styles.fieldValue, styles.enrollmentActive]}>
              {credential.enrollmentStatus}
            </Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.fieldLabel}>Valid</Text>
            <Text style={styles.fieldValue}>
              {credential.validFrom} to {credential.validUntil}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎓</Text>
          <Text style={styles.emptyTitle}>No credential yet</Text>
          <Text style={styles.emptySubtitle}>
            Scan an issuer QR code to receive your UCT student credential.
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f1ea',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  enrollmentActive: {
    color: '#16a34a',
    textTransform: 'capitalize',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 32,
  },
})
