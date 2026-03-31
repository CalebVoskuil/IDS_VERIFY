import React from 'react'
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { useCredential, type Transaction } from '../context/CredentialContext'

function formatCurrency(amount: number) {
  const prefix = amount >= 0 ? '+' : ''
  return `${prefix}R ${Math.abs(amount).toFixed(2)}`
}

function formatDate(isoString: string) {
  const date = new Date(isoString)
  const day = date.getDate()
  const month = date.toLocaleString('en-ZA', { month: 'short' })
  return `${day} ${month}`
}

function TransactionRow({ item }: { item: Transaction }) {
  const isCredit = item.amount >= 0

  return (
    <View style={styles.txRow}>
      <View style={styles.txLeft}>
        <View
          style={[
            styles.txIcon,
            { backgroundColor: isCredit ? '#dcfce7' : '#fee2e2' },
          ]}
        >
          <Text style={styles.txIconText}>{isCredit ? '↑' : '↓'}</Text>
        </View>
        <View>
          <Text style={styles.txLabel}>{item.label}</Text>
          <Text style={styles.txDate}>{formatDate(item.timestamp)}</Text>
        </View>
      </View>
      <Text
        style={[
          styles.txAmount,
          { color: isCredit ? '#16a34a' : '#dc2626' },
        ]}
      >
        {formatCurrency(item.amount)}
      </Text>
    </View>
  )
}

export default function WalletScreen() {
  const { balance, transactions } = useCredential()

  const handleTopUp = () => {
    Alert.alert('Top Up', 'Payment integration is not yet connected.')
  }

  return (
    <View style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>R {balance.toFixed(2)}</Text>
        <TouchableOpacity style={styles.topUpButton} onPress={handleTopUp}>
          <Text style={styles.topUpText}>Top Up</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.txSection}>
        <Text style={styles.txSectionTitle}>Recent Transactions</Text>
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TransactionRow item={item} />}
          scrollEnabled={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No transactions yet.</Text>
          }
        />
      </View>
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
  balanceCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 16,
  },
  topUpButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 12,
  },
  topUpText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  txSection: {
    flex: 1,
  },
  txSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  txIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txIconText: {
    fontSize: 16,
    fontWeight: '700',
  },
  txLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  txDate: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
})
