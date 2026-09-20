import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Avatar, Badge, Button, Card, CardContent, Input, Spinner } from './ui'
import { MessageSquare, Quote, Send, Sparkles } from 'lucide-react'

const SUGGESTIONS = [
  'Who has the most fintech / payments experience?',
  'Which candidates have led or mentored a team?',
  'Who is strongest on AWS and Kubernetes?',
  'Which candidates have data engineering (Kafka/Spark)?',
]

export function AskThePool() {
  const messages = useStore((s) => s.poolMessages)
  const busy = useStore((s) => s.poolBusy)
  const askPool = useStore((s) => s.askPool)
  const candidates = useStore((s) => s.candidates)
  const select = useStore((s) => s.select)
  const [q, setQ] = useState('')

  const send = (text: string) => {
    const question = text.trim()
    if (!question || busy) return
    setQ('')
    void askPool(question)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ask the pool</h1>
        <p className="text-sm text-muted-foreground">Query all {candidates.length} candidates in natural language — answers cite the resumes they rely on.</p>
      </div>

      {messages.length === 0 && (
        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center gap-2 text-sm font-medium"><Sparkles className="h-4 w-4 text-primary" /> Try asking</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-lg border border-border p-3 text-left text-sm transition-colors hover:border-primary/50 hover:bg-secondary/50">
                  {s}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
            {m.role === 'user' ? (
              <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">{m.text}</div>
            ) : (
              <Card className="max-w-[90%]">
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary"><MessageSquare className="h-3.5 w-3.5" /> HireFlow</div>
                  <p className="text-sm">{m.text}</p>
                  {m.answer && m.answer.citations.length > 0 && (
                    <div className="mt-3 space-y-1.5 border-t border-border pt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sources</p>
                      {m.answer.citations.map((c, j) => (
                        <button key={j} onClick={() => select(c.candidateId)} className="flex w-full items-start gap-2 rounded-md bg-secondary/50 p-2 text-left transition-colors hover:bg-secondary">
                          <Avatar name={c.candidateName} className="h-6 w-6 text-[10px]" />
                          <div className="min-w-0">
                            <div className="text-xs font-medium">{c.candidateName}</div>
                            <div className="flex gap-1 text-xs text-muted-foreground"><Quote className="mt-0.5 h-3 w-3 shrink-0" /><span className="italic">"{c.snippet}"</span></div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner className="text-primary" /> Searching the pool…</div>
        )}
      </div>

      <form
        className="sticky bottom-4 flex gap-2"
        onSubmit={(e) => { e.preventDefault(); send(q) }}
      >
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about the candidate pool…" className="h-12 bg-card shadow-lg" />
        <Button type="submit" size="lg" disabled={busy || !q.trim()}><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  )
}
