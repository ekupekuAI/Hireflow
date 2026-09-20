import { useStore } from '@/lib/store'
import { Dialog, Button, Input, Switch, Badge } from './ui'
import { MODEL_OPTIONS } from '@/lib/agent'
import { KeyRound, RotateCcw, Cpu, Server } from 'lucide-react'

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const reset = useStore((s) => s.reset)

  const liveReady = settings.useLive && settings.apiKey.trim()
  const engineName = settings.useMl ? 'Python ML engine' : liveReady ? 'Live AI ready' : 'Demo mode active'

  return (
    <Dialog open={open} onClose={onClose}>
      <h2 className="text-lg font-semibold">Settings</h2>
      <p className="mt-1 text-sm text-muted-foreground">HireFlow runs fully in your browser. Demo mode uses a local engine; Live mode calls Claude with your key.</p>

      <div className="mt-5 space-y-5">
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium"><Server className="h-4 w-4" /> Python ML engine</div>
            <p className="text-xs text-muted-foreground">scikit-learn backend (TF-IDF semantic matching). Takes priority over Live AI.</p>
          </div>
          <Switch checked={settings.useMl} onCheckedChange={(v) => updateSettings({ useMl: v })} />
        </div>

        {settings.useMl && (
          <div className="space-y-2">
            <label className="text-sm font-medium">ML backend URL</label>
            <Input value={settings.mlApiUrl} onChange={(e) => updateSettings({ mlApiUrl: e.target.value })} placeholder="http://localhost:8077" />
            <p className="text-xs text-muted-foreground">
              Local: run <code>python api/index.py</code>. On Vercel it's already live at <code>/api</code>. If unreachable, the app falls back to the local engine.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium"><Cpu className="h-4 w-4" /> Live AI (Claude)</div>
            <p className="text-xs text-muted-foreground">Off = local demo engine (works offline).</p>
          </div>
          <Switch checked={settings.useLive} onCheckedChange={(v) => updateSettings({ useLive: v })} />
        </div>

        {settings.useLive && (
          <>
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium"><KeyRound className="h-4 w-4" /> Anthropic API key</label>
              <Input
                type="password"
                value={settings.apiKey}
                onChange={(e) => updateSettings({ apiKey: e.target.value })}
                placeholder="sk-ant-…"
              />
              <p className="text-xs text-muted-foreground">
                Stored only in your browser (localStorage). For a public deployment, proxy this through a backend — see the README.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Model</label>
              <div className="grid gap-2">
                {MODEL_OPTIONS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => updateSettings({ model: m.id })}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm ${settings.model === m.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-secondary'}`}
                  >
                    {m.label}
                    {settings.model === m.id && <Badge>selected</Badge>}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex items-center justify-between">
          <Badge variant={settings.useMl || liveReady ? 'success' : 'secondary'}>{engineName}</Badge>
          <Button variant="outline" size="sm" onClick={() => { reset(); onClose() }}>
            <RotateCcw className="h-4 w-4" /> Reset all data
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
