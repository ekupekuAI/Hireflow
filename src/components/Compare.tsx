import { useStore } from '@/lib/store'
import { Avatar, Badge, Button, Card, CardContent, ScoreRing, Empty } from './ui'
import { cn } from '@/lib/utils'
import { GitCompare, X } from 'lucide-react'

export function Compare() {
  const candidates = useStore((s) => s.candidates)
  const scores = useStore((s) => s.scores)
  const compareIds = useStore((s) => s.compareIds)
  const toggleCompare = useStore((s) => s.toggleCompare)
  const select = useStore((s) => s.select)
  const setView = useStore((s) => s.setView)

  const cols = compareIds.map((id) => ({ c: candidates.find((x) => x.id === id)!, s: scores[id] })).filter((x) => x.c && x.s)

  if (cols.length < 2) {
    return (
      <div className="mx-auto max-w-2xl">
        <Empty icon={GitCompare} title="Pick at least 2 candidates to compare" hint="Go to the shortlist and tap Compare on the candidates you want side-by-side." />
        <div className="mt-4 text-center">
          <Button onClick={() => setView('dashboard')}>Back to shortlist</Button>
        </div>
      </div>
    )
  }

  const dimNames = cols[0].s.dimensions.map((d) => d.name)
  const best = (dim: string) => Math.max(...cols.map((x) => x.s.dimensions.find((d) => d.name === dim)?.score ?? 0))
  const bestOverall = Math.max(...cols.map((x) => x.s.overall))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Compare candidates</h1>
        <Button variant="outline" onClick={() => setView('dashboard')}>Back to shortlist</Button>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0,1fr))` }}>
        {cols.map(({ c, s }) => (
          <Card key={c.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <Avatar name={c.name} className="h-11 w-11 text-sm" />
                <button onClick={() => toggleCompare(c.id)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <h3 className="mt-2 font-semibold">{c.name}</h3>
              <p className="truncate text-xs text-muted-foreground">{c.profile?.roles[0]}</p>
              <div className="my-3 flex justify-center">
                <ScoreRing score={s.overall} size={64} />
              </div>
              {s.overall === bestOverall && <Badge variant="success" className="w-full justify-center">Top overall</Badge>}

              <div className="mt-4 space-y-2">
                {dimNames.map((dn) => {
                  const d = s.dimensions.find((x) => x.name === dn)!
                  const isBest = d.score === best(dn)
                  return (
                    <div key={dn}>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{dn}</span>
                        <span className={cn('font-semibold', isBest && 'text-success')}>{d.score}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full" style={{ width: `${d.score}%`, background: isBest ? 'hsl(var(--success))' : 'hsl(var(--primary))' }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 space-y-1">
                <p className="text-xs font-semibold text-success">Strengths</p>
                {s.strengths.slice(0, 3).map((x, i) => <p key={i} className="text-xs text-muted-foreground">+ {x}</p>)}
                <p className="pt-1 text-xs font-semibold text-danger">Gaps</p>
                {s.gaps.length ? s.gaps.slice(0, 3).map((x, i) => <p key={i} className="text-xs text-muted-foreground">– {x}</p>) : <p className="text-xs text-muted-foreground">None</p>}
              </div>

              <Button size="sm" className="mt-4 w-full" onClick={() => select(c.id)}>View detail</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
