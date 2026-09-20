import { useStore, type View } from '@/lib/store'
import { Button, Switch, Badge, Tooltip } from './ui'
import { cn } from '@/lib/utils'
import {
  Activity,
  ClipboardCheck,
  GitCompare,
  MessageSquare,
  Moon,
  Settings,
  Sun,
  Users,
  Eye,
  EyeOff,
} from 'lucide-react'

const NAV: { view: View; label: string; icon: React.ElementType }[] = [
  { view: 'dashboard', label: 'Shortlist', icon: Users },
  { view: 'compare', label: 'Compare', icon: GitCompare },
  { view: 'pool', label: 'Ask the Pool', icon: MessageSquare },
  { view: 'evaluate', label: 'Evaluate', icon: ClipboardCheck },
]

export function Layout({
  children,
  onOpenTrace,
  onOpenSettings,
}: {
  children: React.ReactNode
  onOpenTrace: () => void
  onOpenSettings: () => void
}) {
  const view = useStore((s) => s.view)
  const setView = useStore((s) => s.setView)
  const status = useStore((s) => s.status)
  const hasData = useStore((s) => Object.keys(s.scores).length > 0)
  const blindMode = useStore((s) => s.blindMode)
  const setBlindMode = useStore((s) => s.setBlindMode)
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const trace = useStore((s) => s.trace)
  const live = settings.useLive && settings.apiKey.trim()

  const runningCount = trace.filter((t) => t.status === 'running').length

  return (
    <div className="min-h-screen app-bg">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4">
          {/* Logo */}
          <button className="flex items-center gap-2.5" onClick={() => setView(hasData ? 'dashboard' : 'setup')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-primary/30">
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 22V10m0 6h8m0-6v12m5-14-3 3 3 3" />
              </svg>
            </div>
            <div className="text-left leading-none">
              <div className="text-[15px] font-bold tracking-tight">HireFlow</div>
              <div className="hidden text-[11px] text-muted-foreground sm:block">shows its work</div>
            </div>
          </button>

          <Badge variant={live ? 'success' : 'secondary'} className="ml-1">
            {live ? 'Live AI' : 'Demo mode'}
          </Badge>

          {/* Nav */}
          {hasData && (
            <nav className="ml-2 hidden items-center gap-1 md:flex">
              {NAV.map((n) => (
                <button
                  key={n.view}
                  onClick={() => setView(n.view)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    view === n.view || (view === 'candidate' && n.view === 'dashboard')
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                  )}
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </button>
              ))}
            </nav>
          )}

          <div className="ml-auto flex items-center gap-2">
            {hasData && (
              <div className="hidden items-center gap-2 rounded-lg border border-border px-3 py-1.5 sm:flex">
                {blindMode ? <EyeOff className="h-4 w-4 text-primary" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                <span className="text-sm font-medium">Blind</span>
                <Switch checked={blindMode} onCheckedChange={setBlindMode} />
              </div>
            )}

            {status !== 'idle' && (
              <Tooltip label="Agent activity trace">
                <Button variant="outline" size="icon" onClick={onOpenTrace} className="relative">
                  <Activity className="h-4 w-4" />
                  {runningCount > 0 && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />}
                </Button>
              </Tooltip>
            )}

            <Tooltip label="Toggle theme">
              <Button
                variant="outline"
                size="icon"
                onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
              >
                {settings.theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </Tooltip>

            <Tooltip label="Settings">
              <Button variant="outline" size="icon" onClick={onOpenSettings}>
                <Settings className="h-4 w-4" />
              </Button>
            </Tooltip>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6">{children}</main>
    </div>
  )
}
