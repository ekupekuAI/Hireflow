import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { Layout } from '@/components/Layout'
import { SetupScreen } from '@/components/SetupScreen'
import { Dashboard } from '@/components/Dashboard'
import { CandidateDetail } from '@/components/CandidateDetail'
import { Compare } from '@/components/Compare'
import { AskThePool } from '@/components/AskThePool'
import { Evaluate } from '@/components/Evaluate'
import { AgentTrace } from '@/components/AgentTrace'
import { SettingsDialog } from '@/components/SettingsDialog'

export default function App() {
  const view = useStore((s) => s.view)
  const job = useStore((s) => s.job)
  const theme = useStore((s) => s.settings.theme)

  const [traceOpen, setTraceOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const showSetup = !job || view === 'setup'

  return (
    <Layout onOpenTrace={() => setTraceOpen(true)} onOpenSettings={() => setSettingsOpen(true)}>
      {showSetup ? (
        <SetupScreen />
      ) : view === 'dashboard' ? (
        <Dashboard />
      ) : view === 'candidate' ? (
        <CandidateDetail />
      ) : view === 'compare' ? (
        <Compare />
      ) : view === 'pool' ? (
        <AskThePool />
      ) : view === 'evaluate' ? (
        <Evaluate />
      ) : (
        <Dashboard />
      )}

      <AgentTrace open={traceOpen} onClose={() => setTraceOpen(false)} />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </Layout>
  )
}
