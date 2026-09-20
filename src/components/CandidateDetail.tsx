import { useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import { Avatar, Badge, Button, Card, CardContent, CardHeader, CardTitle, ScoreRing, Spinner, Empty } from './ui'
import type { DimensionScore } from '@/lib/types'
import { cn, escapeRegExp, formatTime } from '@/lib/utils'
import {
  ArrowLeft, Quote, Download, ListChecks, FileText, ScrollText, Sparkles,
  CircleCheck, CircleAlert, CircleHelp, ChevronDown,
} from 'lucide-react'

type Tab = 'overview' | 'kit' | 'resume' | 'audit'

function DimensionRow({ d }: { d: DimensionScore }) {
  const [open, setOpen] = useState(d.evidence.length > 0)
  const color = d.score >= 80 ? 'hsl(var(--success))' : d.score >= 60 ? 'hsl(var(--warning))' : 'hsl(var(--danger))'
  return (
    <div className="rounded-lg border border-border">
      <button className="flex w-full items-center gap-3 p-3 text-left" onClick={() => setOpen((o) => !o)}>
        <div className="flex-1">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-medium">{d.name}</span>
            <span className="text-sm font-semibold tabular-nums">{d.score}<span className="text-xs text-muted-foreground">/100 · w{Math.round(d.weight * 100)}%</span></span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full transition-all" style={{ width: `${d.score}%`, background: color }} />
          </div>
        </div>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="space-y-2 border-t border-border p-3">
          <p className="text-sm text-muted-foreground">{d.reasoning}</p>
          {d.evidence.length > 0 ? (
            d.evidence.map((e, i) => (
              <div key={i} className="rounded-md bg-secondary/60 p-2.5">
                <div className="mb-1 text-xs font-medium text-primary">{e.claim}</div>
                <div className="flex gap-1.5 text-sm">
                  <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="italic">"{e.snippet}"</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No direct evidence — flagged for interview validation.</p>
          )}
        </div>
      )}
    </div>
  )
}

function highlight(text: string, snippets: string[]) {
  const clean = snippets.map((s) => s.trim()).filter((s) => s.length > 8)
  if (!clean.length) return text
  const re = new RegExp(`(${clean.map(escapeRegExp).join('|')})`, 'gi')
  const parts = text.split(re)
  return parts.map((p, i) =>
    clean.some((s) => s.toLowerCase() === p.toLowerCase()) ? <mark key={i} className="evidence">{p}</mark> : <span key={i}>{p}</span>,
  )
}

export function CandidateDetail() {
  const selectedId = useStore((s) => s.selectedId)
  const candidates = useStore((s) => s.candidates)
  const scores = useStore((s) => s.scores)
  const kits = useStore((s) => s.kits)
  const audit = useStore((s) => s.audit)
  const job = useStore((s) => s.job)
  const select = useStore((s) => s.select)
  const generateKit = useStore((s) => s.generateKit)
  const setView = useStore((s) => s.setView)

  const [tab, setTab] = useState<Tab>('overview')
  const [kitBusy, setKitBusy] = useState(false)

  const candidate = candidates.find((c) => c.id === selectedId)
  const score = selectedId ? scores[selectedId] : undefined
  const kit = selectedId ? kits[selectedId] : undefined

  const snippets = useMemo(() => (score ? score.dimensions.flatMap((d) => d.evidence.map((e) => e.snippet)) : []), [score])
  const candidateAudit = useMemo(
    () => (candidate ? audit.filter((a) => a.inputsUsed.some((i) => i.includes(candidate.name)) || a.summary.includes(candidate.name)) : []),
    [audit, candidate],
  )

  if (!candidate || !score) return null

  const onGenerateKit = async () => {
    setKitBusy(true)
    await generateKit(candidate.id)
    setKitBusy(false)
    setTab('kit')
  }

  const exportKit = async () => {
    if (!kit) return
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    let y = 16
    const line = (t: string, size = 11, bold = false) => {
      doc.setFontSize(size)
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      for (const wrapped of doc.splitTextToSize(t, 180)) {
        if (y > 280) { doc.addPage(); y = 16 }
        doc.text(wrapped, 14, y)
        y += size * 0.55
      }
    }
    line('HireFlow — Interview Kit', 16, true)
    line(`${candidate.name} · ${job?.title ?? ''}`, 11)
    line(`Overall match: ${score.overall}/100`, 11)
    y += 4
    kit.questions.forEach((q, i) => {
      line(`${i + 1}. [${q.area}] ${q.question}`, 11, true)
      line(`Why: ${q.rationale}`, 10)
      q.followUps.forEach((f) => line(`   ↳ ${f}`, 10))
      y += 2
    })
    doc.save(`HireFlow-${candidate.name.replace(/\s+/g, '_')}-interview-kit.pdf`)
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Score & evidence', icon: Sparkles },
    { id: 'kit', label: 'Interview kit', icon: ListChecks },
    { id: 'resume', label: 'Resume', icon: FileText },
    { id: 'audit', label: 'Audit trail', icon: ScrollText },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Button variant="ghost" size="sm" onClick={() => { select(null); setView('dashboard') }}>
        <ArrowLeft className="h-4 w-4" /> Back to shortlist
      </Button>

      {/* Header */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-5">
          <Avatar name={candidate.name} className="h-14 w-14 text-lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold">{candidate.name}</h1>
            <p className="text-sm text-muted-foreground">{candidate.profile?.roles[0] ?? candidate.profile?.summary}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {candidate.profile?.skills.slice(0, 6).map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <ScoreRing score={score.overall} size={72} stroke={6} />
            <span className="mt-1 text-xs text-muted-foreground">confidence {Math.round(score.confidence * 100)}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              tab === t.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-3 md:col-span-2">
            <p className="rounded-lg bg-secondary/50 p-3 text-sm">{score.reasoning}</p>
            {score.dimensions.map((d) => <DimensionRow key={d.name} d={d} />)}
          </div>
          <div className="space-y-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-success">Strengths</CardTitle></CardHeader>
              <CardContent className="space-y-1.5">
                {score.strengths.length ? score.strengths.map((s, i) => (
                  <div key={i} className="flex gap-1.5 text-sm"><CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />{s}</div>
                )) : <p className="text-sm text-muted-foreground">—</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-danger">Gaps</CardTitle></CardHeader>
              <CardContent className="space-y-1.5">
                {score.gaps.length ? score.gaps.map((g, i) => (
                  <div key={i} className="flex gap-1.5 text-sm"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" />{g}</div>
                )) : <p className="text-sm text-muted-foreground">None detected</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-warning">Validate in interview</CardTitle></CardHeader>
              <CardContent className="space-y-1.5">
                {score.flagsToValidate.length ? score.flagsToValidate.map((f, i) => (
                  <div key={i} className="flex gap-1.5 text-sm"><CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-warning" />{f}</div>
                )) : <p className="text-sm text-muted-foreground">—</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === 'kit' && (
        <div className="space-y-3">
          {!kit ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <ListChecks className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Generate a tailored interview kit for {candidate.name}.</p>
              <Button onClick={onGenerateKit} disabled={kitBusy}>
                {kitBusy ? <><Spinner /> Generating…</> : <><Sparkles className="h-4 w-4" /> Generate interview kit</>}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{kit.questions.length} questions · tailored to strengths & gaps</p>
                <Button variant="outline" size="sm" onClick={exportKit}><Download className="h-4 w-4" /> Export PDF</Button>
              </div>
              {kit.questions.map((q, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="mb-1.5 flex items-center gap-2">
                      <Badge>{q.area}</Badge>
                      <span className="text-xs text-muted-foreground">Q{i + 1}</span>
                    </div>
                    <p className="font-medium">{q.question}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Why: {q.rationale}</p>
                    {q.followUps.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {q.followUps.map((f, j) => <li key={j} className="text-sm text-muted-foreground">↳ {f}</li>)}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      {tab === 'resume' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Resume — highlighted spans are cited as evidence</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{highlight(candidate.rawText, snippets)}</pre>
          </CardContent>
        </Card>
      )}

      {tab === 'audit' && (
        <div className="space-y-2">
          {candidateAudit.length ? candidateAudit.map((a) => (
            <div key={a.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
              <Badge variant="outline">{a.type}</Badge>
              <div className="flex-1">
                <p className="text-sm">{a.summary}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Inputs: {a.inputsUsed.join(', ')} · {a.model} · {formatTime(a.ts)}
                </p>
              </div>
            </div>
          )) : <Empty icon={ScrollText} title="No audit entries yet" />}
        </div>
      )}
    </div>
  )
}
