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
import { AlertTriangle, X } from 'lucide-react'

export default function App() {
  const view = useStore((s) => s.view)
  const job = useStore((s) => s.job)
  const theme = useStore((s) => s.settings.theme)
  const error = useStore((s) => s.error)
  const clearError = useStore((s) => s.clearError)

  const [traceOpen, setTraceOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const showSetup = !job || view === 'setup'

  return (
    <Layout onOpenTrace={() => setTraceOpen(true)} onOpenSettings={() => setSettingsOpen(true)}>
      {error && (
        <div role="alert" className="mb-4 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <span className="flex-1">{error}</span>
          <button onClick={clearError} aria-label="Dismiss" className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
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
