import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

export interface StoredCredential {
  id: string
  studentNumber: string
  fullName: string
  faculty: string
  enrollmentStatus: string
  validFrom: string
  validUntil: string
  issuedAt: string
}

export interface Transaction {
  id: string
  label: string
  amount: number
  timestamp: string
}

export interface PendingProofRequest {
  id: string
  verifierLabel: string
  requestedAttributes: string[]
  receivedAt: string
}

interface CredentialContextValue {
  balance: number
  credential: StoredCredential | null
  pendingProof: PendingProofRequest | null
  transactions: Transaction[]
  setCredential: (c: StoredCredential | null) => void
  setPendingProof: (p: PendingProofRequest | null) => void
  addTransaction: (t: Transaction) => void
}

const MOCK_CREDENTIAL: StoredCredential = {
  id: 'mock-cred-001',
  studentNumber: '20260042',
  fullName: 'Thabo Mokoena',
  faculty: 'Engineering & the Built Environment',
  enrollmentStatus: 'active',
  validFrom: '2026-01-15',
  validUntil: '2026-12-15',
  issuedAt: '2026-01-15T08:00:00Z',
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', label: 'Canteen lunch', amount: -45.00, timestamp: '2026-03-30T12:30:00Z' },
  { id: 'tx-2', label: 'Top-up', amount: 200.00, timestamp: '2026-03-28T09:15:00Z' },
  { id: 'tx-3', label: 'Coffee', amount: -22.00, timestamp: '2026-03-27T14:00:00Z' },
  { id: 'tx-4', label: 'Canteen lunch', amount: -45.00, timestamp: '2026-03-26T12:45:00Z' },
  { id: 'tx-5', label: 'Top-up', amount: 500.00, timestamp: '2026-03-25T08:00:00Z' },
]

const INITIAL_BALANCE = 588.00

const CredentialContext = createContext<CredentialContextValue>({
  balance: INITIAL_BALANCE,
  credential: MOCK_CREDENTIAL,
  pendingProof: null,
  transactions: MOCK_TRANSACTIONS,
  setCredential: () => {},
  setPendingProof: () => {},
  addTransaction: () => {},
})

export function useCredential() {
  return useContext(CredentialContext)
}

export function CredentialProvider({ children }: { children: React.ReactNode }) {
  const [credential, setCredential] = useState<StoredCredential | null>(MOCK_CREDENTIAL)
  const [pendingProof, setPendingProof] = useState<PendingProofRequest | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS)
  const [balance, setBalance] = useState(INITIAL_BALANCE)

  const addTransaction = useCallback((t: Transaction) => {
    setTransactions((prev) => [t, ...prev].slice(0, 5))
    setBalance((prev) => prev + t.amount)
  }, [])

  const value = useMemo(
    () => ({
      balance,
      credential,
      pendingProof,
      transactions,
      setCredential,
      setPendingProof,
      addTransaction,
    }),
    [balance, credential, pendingProof, transactions, addTransaction],
  )

  return (
    <CredentialContext.Provider value={value}>
      {children}
    </CredentialContext.Provider>
  )
}
