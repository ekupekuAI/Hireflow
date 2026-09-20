import type { Candidate, CandidateScore } from '@/lib/types'
import { Avatar, Badge, Button, ScoreRing } from './ui'
import { cn } from '@/lib/utils'
import { ArrowDown, ArrowUp, Check, ChevronRight, GitCompare } from 'lucide-react'
import { motion } from 'framer-motion'

export function CandidateCard({
  candidate,
  score,
  rank,
  rankDelta,
  blinded,
  displayName,
  onView,
  compareActive,
  onToggleCompare,
}: {
  candidate: Candidate
  score: CandidateScore
  rank: number
  rankDelta?: number
  blinded: boolean
  displayName: string
  onView: () => void
  compareActive: boolean
  onToggleCompare: () => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'group flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-primary/50',
        compareActive ? 'border-primary' : 'border-border',
      )}
    >
      {/* Rank */}
      <div className="flex w-8 shrink-0 flex-col items-center">
        <span className={cn('text-lg font-bold tabular-nums', rank <= 3 ? 'text-primary' : 'text-muted-foreground')}>{rank}</span>
        {rankDelta !== undefined && rankDelta !== 0 && (
          <span className={cn('flex items-center text-[11px] font-semibold', rankDelta > 0 ? 'text-success' : 'text-danger')}>
            {rankDelta > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {Math.abs(rankDelta)}
          </span>
        )}
      </div>

      <Avatar name={candidate.name} blinded={blinded} className="h-11 w-11 text-sm" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold">{displayName}</span>
          {score.confidence < 0.6 && <Badge variant="warning">low confidence</Badge>}
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          {score.strengths.slice(0, 3).map((s, i) => (
            <Badge key={i} variant="success" className="font-normal">{s}</Badge>
          ))}
          {score.gaps.slice(0, 1).map((g, i) => (
            <Badge key={i} variant="danger" className="font-normal">{g}</Badge>
          ))}
        </div>
      </div>

      {/* Dimension mini-bars */}
      <div className="hidden w-40 shrink-0 space-y-1.5 lg:block">
        {score.dimensions.slice(0, 4).map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <span className="w-24 truncate text-[11px] text-muted-foreground">{d.name}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full"
                style={{ width: `${d.score}%`, background: d.score >= 80 ? 'hsl(var(--success))' : d.score >= 60 ? 'hsl(var(--warning))' : 'hsl(var(--danger))' }}
              />
            </div>
          </div>
        ))}
      </div>

      <ScoreRing score={score.overall} size={54} />

      <div className="flex shrink-0 flex-col gap-1.5">
        <Button size="sm" onClick={onView}>
          View <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant={compareActive ? 'primary' : 'outline'} onClick={onToggleCompare}>
          {compareActive ? <Check className="h-3.5 w-3.5" /> : <GitCompare className="h-3.5 w-3.5" />} Compare
        </Button>
      </div>
    </motion.div>
  )
}
