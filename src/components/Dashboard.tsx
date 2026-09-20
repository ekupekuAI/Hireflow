import { useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import { CandidateCard } from './CandidateCard'
import { Badge, Button, Card, CardContent, Progress, Spinner } from './ui'
import type { Candidate, CandidateScore } from '@/lib/types'
import { cn } from '@/lib/utils'
import { EyeOff, Info, LayoutList, Layers, MessageSquare, ShieldAlert, TrendingUp } from 'lucide-react'

const TIERS = [
  { key: 'strong', label: 'Strong fit', min: 75, tone: 'text-success', dot: 'bg-success' },
  { key: 'potential', label: 'Potential', min: 55, tone: 'text-warning', dot: 'bg-warning' },
  { key: 'weak', label: 'Not a fit', min: 0, tone: 'text-danger', dot: 'bg-danger' },
] as const

function rankMap(scores: Record<string, CandidateScore>, ids: string[]): Record<string, number> {
  const ordered = [...ids].filter((id) => scores[id]).sort((a, b) => scores[b].overall - scores[a].overall)
  const m: Record<string, number> = {}
  ordered.forEach((id, i) => (m[id] = i + 1))
  return m
}

export function Dashboard() {
  const job = useStore((s) => s.job)
  const candidates = useStore((s) => s.candidates)
  const scores = useStore((s) => s.scores)
  const blindScores = useStore((s) => s.blindScores)
  const blindMode = useStore((s) => s.blindMode)
  const blindLoading = useStore((s) => s.blindLoading)
  const setBlindMode = useStore((s) => s.setBlindMode)
  const status = useStore((s) => s.status)
  const progress = useStore((s) => s.progress)
  const select = useStore((s) => s.select)
  const compareIds = useStore((s) => s.compareIds)
  const toggleCompare = useStore((s) => s.toggleCompare)
  const setView = useStore((s) => s.setView)

  const [groupMode, setGroupMode] = useState<'ranked' | 'grouped'>('ranked')

  const blindIndex = useMemo(() => {
    const m: Record<string, number> = {}
    candidates.forEach((c, i) => (m[c.id] = i))
    return m
  }, [candidates])

  const ids = candidates.map((c) => c.id)
  const normalRanks = useMemo(() => rankMap(scores, ids), [scores, ids])
  const blindRanks = useMemo(() => rankMap(blindScores, ids), [blindScores, ids])

  const activeScores = blindMode && Object.keys(blindScores).length ? blindScores : scores

  const ranked = useMemo(
    () => candidates.filter((c) => activeScores[c.id]).sort((a, b) => activeScores[b.id].overall - activeScores[a.id].overall),
    [candidates, activeScores],
  )

  // Bias summary comparing normal vs blind rankings
  const bias = useMemo(() => {
    const haveBoth = Object.keys(blindScores).length && Object.keys(scores).length
    if (!haveBoth) return null
    let movers = 0
    let biggest = { name: '', delta: 0 }
    let totalSwing = 0
    for (const c of candidates) {
      const nr = normalRanks[c.id]
      const br = blindRanks[c.id]
      if (!nr || !br) continue
      const delta = nr - br // positive: rose when blinded
      if (delta !== 0) movers++
      if (Math.abs(delta) > Math.abs(biggest.delta)) biggest = { name: c.name, delta }
      totalSwing += Math.abs((scores[c.id]?.overall ?? 0) - (blindScores[c.id]?.overall ?? 0))
    }
    return { movers, biggest, avgSwing: Math.round(totalSwing / Math.max(1, candidates.length)) }
  }, [candidates, normalRanks, blindRanks, scores, blindScores])

  const renderCard = (c: Candidate) => {
    const rank = blindMode ? blindRanks[c.id] : normalRanks[c.id]
    const delta = blindMode && normalRanks[c.id] && blindRanks[c.id] ? normalRanks[c.id] - blindRanks[c.id] : undefined
    const displayName = blindMode ? `Candidate #${String(blindIndex[c.id] + 1).padStart(2, '0')}` : c.name
    return (
      <CandidateCard
        key={c.id}
        candidate={c}
        score={activeScores[c.id]}
        rank={rank}
        rankDelta={delta}
        blinded={blindMode}
        displayName={displayName}
        onView={() => select(c.id)}
        compareActive={compareIds.includes(c.id)}
        onToggleCompare={() => toggleCompare(c.id)}
      />
    )
  }

  if (!job) return null
  const running = status === 'running'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{job.title}</h1>
          <p className="text-sm text-muted-foreground">
            {ranked.length} of {candidates.length} candidates ranked
            {job.structured && ` · ${job.structured.mustHaves.length} required skills`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!running && (
            <div className="flex items-center rounded-lg border border-border p-0.5">
              <button
                onClick={() => setGroupMode('ranked')}
                className={cn('flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors', groupMode === 'ranked' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                <LayoutList className="h-4 w-4" /> Ranked
              </button>
              <button
                onClick={() => setGroupMode('grouped')}
                className={cn('flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors', groupMode === 'grouped' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                <Layers className="h-4 w-4" /> Grouped by fit
              </button>
            </div>
          )}
          <Button variant="outline" onClick={() => setView('pool')}>
            <MessageSquare className="h-4 w-4" /> Ask the pool
          </Button>
        </div>
      </div>

      {running && (
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Spinner className="text-primary" />
            <div className="flex-1">
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="font-medium">Agents working — extracting & scoring</span>
                <span className="text-muted-foreground">{progress.done}/{progress.total}</span>
              </div>
              <Progress value={(progress.done / Math.max(1, progress.total)) * 100} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bias banner */}
      {!running && bias && (
        <Card className={blindMode ? 'border-primary/40 bg-primary/5' : ''}>
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            {blindMode ? <EyeOff className="h-5 w-5 text-primary" /> : <ShieldAlert className="h-5 w-5 text-warning" />}
            <div className="flex-1">
              {blindMode ? (
                <p className="text-sm">
                  <span className="font-semibold">Blind Mode on.</span> Removed name, gender, age & school signals.{' '}
                  {blindLoading ? (
                    <span className="inline-flex items-center gap-1 text-muted-foreground"><Spinner /> re-scoring…</span>
                  ) : bias.movers > 0 ? (
                    <>
                      <span className="font-semibold text-primary">{bias.movers} candidate{bias.movers > 1 ? 's' : ''}</span> changed rank
                      {bias.biggest.name && (
                        <> — {bias.biggest.name} {bias.biggest.delta > 0 ? 'rose' : 'fell'} {Math.abs(bias.biggest.delta)} place{Math.abs(bias.biggest.delta) > 1 ? 's' : ''}</>
                      )}. Avg score swing {bias.avgSwing} pts.
                    </>
                  ) : (
                    <>ranking unchanged — no measurable bias from those signals here.</>
                  )}
                </p>
              ) : (
                <p className="text-sm">
                  <span className="font-semibold">Fairness check available.</span> Turn on{' '}
                  <button className="font-semibold text-primary underline" onClick={() => setBlindMode(true)}>Blind Mode</button>{' '}
                  to see whether prestige/name signals are shifting your ranking.
                </p>
              )}
            </div>
            {blindMode && bias.movers > 0 && (
              <Badge variant="default"><TrendingUp className="h-3 w-3" /> bias detected</Badge>
            )}
          </CardContent>
        </Card>
      )}

      {/* Candidate list — ranked or grouped by fit tier */}
      {groupMode === 'grouped' && !running ? (
        <div className="space-y-6">
          {TIERS.map((tier, ti) => {
            const upper = ti === 0 ? 101 : TIERS[ti - 1].min
            const inTier = ranked.filter((c) => {
              const s = activeScores[c.id].overall
              return s >= tier.min && s < upper
            })
            if (!inTier.length) return null
            return (
              <div key={tier.key}>
                <div className="mb-2.5 flex items-center gap-2">
                  <span className={cn('h-2.5 w-2.5 rounded-full', tier.dot)} />
                  <h2 className={cn('text-sm font-semibold', tier.tone)}>{tier.label}</h2>
                  <Badge variant="outline">{inTier.length}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {tier.key === 'strong' ? 'score ≥ 75' : tier.key === 'potential' ? 'score 55–74' : 'score < 55'}
                  </span>
                </div>
                <div className="space-y-3">{inTier.map(renderCard)}</div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-3">{ranked.map(renderCard)}</div>
      )}

      {compareIds.length > 0 && (
        <div className="sticky bottom-4 flex justify-center">
          <div className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2 shadow-lg">
            <span className="text-sm font-medium">{compareIds.length} selected</span>
            <Button size="sm" onClick={() => setView('compare')} disabled={compareIds.length < 2}>
              Compare side-by-side
            </Button>
          </div>
        </div>
      )}

      <p className="flex items-center justify-center gap-1.5 pt-2 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5" /> HireFlow assists screening — every decision stays with you.
      </p>
    </div>
  )
}
