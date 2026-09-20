import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Avatar, Badge, Button, Card, CardContent, CardHeader, CardTitle, Textarea, Spinner } from './ui'
import { cn } from '@/lib/utils'
import { CircleCheck, CircleAlert, CircleMinus, ClipboardCheck, Download, HelpCircle, Sparkles } from 'lucide-react'

const MET_STYLE = {
  yes: { icon: CircleCheck, cls: 'text-success', label: 'Met' },
  partial: { icon: CircleAlert, cls: 'text-warning', label: 'Partial' },
  no: { icon: CircleMinus, cls: 'text-danger', label: 'Not met' },
} as const

export function Evaluate() {
  const candidates = useStore((s) => s.candidates)
  const scores = useStore((s) => s.scores)
  const evaluations = useStore((s) => s.evaluations)
  const runEvaluation = useStore((s) => s.runEvaluation)

  const ranked = [...candidates].filter((c) => scores[c.id]).sort((a, b) => scores[b.id].overall - scores[a.id].overall)
  const [selId, setSelId] = useState<string>(ranked[0]?.id ?? '')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)

  const evalResult = selId ? evaluations[selId] : undefined
  const candidate = candidates.find((c) => c.id === selId)

  const run = async () => {
    if (!selId) return
    setBusy(true)
    await runEvaluation(selId, notes)
    setBusy(false)
  }

  const recTone = (r: string) => (/advance|next round/i.test(r) ? 'success' : /do not|reject/i.test(r) ? 'danger' : 'warning')

  // PS3: follow-up questions for areas the interview did not fully validate.
  const followUps = evalResult
    ? evalResult.mapped
        .filter((m) => m.met !== 'yes')
        .map((m) => `On ${m.requirement}: walk me through a specific end-to-end example, including what went wrong and how you handled it.`)
    : []

  const exportReport = async () => {
    if (!evalResult || !candidate) return
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    let y = 16
    const line = (t: string, size = 11, bold = false) => {
      doc.setFontSize(size)
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      for (const w of doc.splitTextToSize(t, 180)) {
        if (y > 280) { doc.addPage(); y = 16 }
        doc.text(w, 14, y)
        y += size * 0.6
      }
    }
    line('HireFlow — Interview Evaluation', 16, true)
    line(candidate.name, 12)
    line(`Recommendation: ${evalResult.recommendation}`, 11, true)
    y += 2
    line('Summary', 12, true)
    line(evalResult.summary, 10)
    y += 2
    line('Requirement coverage', 12, true)
    evalResult.mapped.forEach((m) => {
      line(`[${m.met.toUpperCase()}] ${m.requirement}`, 10, true)
      line(`   ${m.evidence}`, 10)
    })
    if (followUps.length) {
      y += 2
      line('Recommended follow-ups', 12, true)
      followUps.forEach((f) => line(`- ${f}`, 10))
    }
    doc.save(`HireFlow-${candidate.name.replace(/\s+/g, '_')}-evaluation.pdf`)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Interview evaluation</h1>
        <p className="text-sm text-muted-foreground">Paste interview notes — HireFlow maps them to the role's requirements and produces a standardized report.</p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">Candidate</label>
            <div className="flex flex-wrap gap-2">
              {ranked.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelId(c.id)}
                  className={cn('flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors', selId === c.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-secondary')}
                >
                  <Avatar name={c.name} className="h-5 w-5 text-[9px]" /> {c.name}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Interview notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Strong on Python and AWS — walked through a Lambda-based payment pipeline. Confirmed PostgreSQL schema design. Did not demonstrate Kubernetes depth. Good communication…"
              className="min-h-[140px]"
            />
          </div>
          <Button onClick={run} disabled={!selId || busy}>
            {busy ? <><Spinner /> Evaluating…</> : <><Sparkles className="h-4 w-4" /> Generate evaluation</>}
          </Button>
        </CardContent>
      </Card>

      {evalResult && candidate && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>{candidate.name} — evaluation</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={recTone(evalResult.recommendation)}>{evalResult.recommendation}</Badge>
                <Button variant="outline" size="sm" onClick={exportReport}>
                  <Download className="h-4 w-4" /> Export report
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="rounded-lg bg-secondary/50 p-3 text-sm">{evalResult.summary}</p>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Requirement coverage</p>
              <div className="space-y-1.5">
                {evalResult.mapped.map((m, i) => {
                  const st = MET_STYLE[m.met]
                  return (
                    <div key={i} className="flex items-start gap-2.5 rounded-lg border border-border p-2.5">
                      <st.icon className={cn('mt-0.5 h-4 w-4 shrink-0', st.cls)} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{m.requirement}</span>
                          <Badge variant={m.met === 'yes' ? 'success' : m.met === 'partial' ? 'warning' : 'danger'}>{st.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{m.evidence}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {evalResult.gaps.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-danger">Still unproven</p>
                {evalResult.gaps.map((g, i) => <p key={i} className="text-sm text-muted-foreground">• {g}</p>)}
              </div>
            )}

            {followUps.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary">Recommended follow-up questions</p>
                <div className="space-y-1.5">
                  {followUps.map((f, i) => (
                    <div key={i} className="flex gap-1.5 text-sm text-muted-foreground">
                      <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!evalResult && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ClipboardCheck className="h-3.5 w-3.5" /> The final hiring decision always stays with you.
        </p>
      )}
    </div>
  )
}
