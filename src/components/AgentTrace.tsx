import { useStore } from '@/lib/store'
import { Badge, Spinner } from './ui'
import { cn, formatTime } from '@/lib/utils'
import { Activity, Check, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function AgentTrace({ open, onClose }: { open: boolean; onClose: () => void }) {
  const trace = useStore((s) => s.trace)
  const audit = useStore((s) => s.audit)
  const settings = useStore((s) => s.settings)
  const live = settings.useLive && settings.apiKey.trim()
  const engineTag = settings.useMl ? 'python-ml · tf-idf' : live ? `live · ${settings.model}` : 'local engine'

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          >
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Agent activity</h2>
                <Badge variant={settings.useMl || live ? 'success' : 'secondary'}>{engineTag}</Badge>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reasoning trace</h3>
                <div className="space-y-1.5">
                  {trace.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
                  {trace.map((t) => (
                    <div key={t.id} className="flex items-start gap-2.5 rounded-lg border border-border p-2.5">
                      <div className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full', t.status === 'done' ? 'bg-success/20 text-success' : 'bg-primary/20 text-primary')}>
                        {t.status === 'done' ? <Check className="h-3 w-3" /> : <Spinner className="h-3 w-3" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{t.agent}</span>
                          <span className="text-[10px] text-muted-foreground">{formatTime(t.ts)}</span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{t.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Audit log ({audit.length})</h3>
                <div className="space-y-1.5">
                  {audit.slice(0, 40).map((a) => (
                    <div key={a.id} className="rounded-lg border border-border p-2.5">
                      <div className="mb-0.5 flex items-center gap-2">
                        <Badge variant="outline">{a.type}</Badge>
                        <span className="text-[10px] text-muted-foreground">{a.model}</span>
                      </div>
                      <p className="text-xs">{a.summary}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
