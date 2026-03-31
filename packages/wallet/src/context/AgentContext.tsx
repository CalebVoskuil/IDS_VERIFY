import type { Agent } from '@credo-ts/core'
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { initializeWalletAgent } from '../agent/createWalletAgent'

export type AgentStatus = 'initializing' | 'ready' | 'failed'

interface AgentContextValue {
  agent: Agent | null
  error: string | null
  status: AgentStatus
}

const AgentContext = createContext<AgentContextValue>({
  agent: null,
  error: null,
  status: 'initializing',
})

export function useAgent() {
  return useContext(AgentContext)
}

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [status, setStatus] = useState<AgentStatus>('initializing')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    void initializeWalletAgent()
      .then((a) => {
        if (!active) return
        setAgent(a)
        setStatus('ready')
      })
      .catch((err: unknown) => {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Unknown error')
        setStatus('failed')
      })

    return () => {
      active = false
    }
  }, [])

  const value = useMemo(
    () => ({ agent, error, status }),
    [agent, error, status],
  )

  return (
    <AgentContext.Provider value={value}>{children}</AgentContext.Provider>
  )
}
