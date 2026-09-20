import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AuditEntry,
  Candidate,
  CandidateScore,
  Evaluation,
  InterviewKit,
  Job,
  PoolAnswer,
  TraceStep,
} from './types'
import { getProvider, DEFAULT_ML_URL } from './agent'
import { DEFAULT_MODEL } from './agent/claude'
import type { ProviderMode } from './types'
import { toBlindCandidate } from './blind'
import { SAMPLE_CANDIDATES, SAMPLE_JOB } from '@/data/sampleData'
import { uid, sleep, stringToHue } from './utils'
import {
  isSupabaseConfigured,
  listScreenings,
  loadScreening,
  saveScreening,
  deleteScreening,
  type ScreeningRow,
} from './supabase'

const PRESTIGE = ['iit', 'stanford', 'mit', 'harvard', 'oxford', 'cambridge', 'berkeley', 'cmu', 'carnegie']

/** Simulated "affinity bias" an unguarded screener would apply from name/school signals.
 *  Only applied in Demo mode's non-blind score, so Blind Mode visibly removes it.
 *  (In Live mode, blinding redacts the text and the model genuinely re-scores.) */
function demoBias(candidate: Candidate): number {
  const school = (candidate.meta?.school ?? '').toLowerCase()
  const prestige = PRESTIGE.some((p) => school.includes(p)) ? 6 : 0
  const nameAffinity = (stringToHue(candidate.name) % 7) - 3 // -3..+3
  return prestige + nameAffinity
}

function applyBias(score: CandidateScore, delta: number): CandidateScore {
  const overall = Math.max(0, Math.min(100, score.overall + delta))
  return { ...score, overall, blindScored: false }
}

export type View = 'setup' | 'dashboard' | 'candidate' | 'compare' | 'pool' | 'evaluate'

export interface PoolMessage {
  role: 'user' | 'agent'
  text: string
  answer?: PoolAnswer
}

export interface Settings {
  useMl: boolean
  mlApiUrl: string
  useLive: boolean
  apiKey: string
  model: string
  theme: 'dark' | 'light'
}

/** Human-readable engine label for the audit trail. */
export function engineLabel(mode: ProviderMode, settings: Settings): string {
  if (mode === 'ml') return 'python-ml (tf-idf)'
  if (mode === 'live') return settings.model
  return 'local-engine'
}

interface State {
  job: Job | null
  candidates: Candidate[]
  scores: Record<string, CandidateScore>
  blindScores: Record<string, CandidateScore>
  kits: Record<string, InterviewKit>
  evaluations: Record<string, Evaluation>
  trace: TraceStep[]
  audit: AuditEntry[]

  view: View
  selectedId: string | null
  compareIds: string[]
  blindMode: boolean

  status: 'idle' | 'running' | 'done'
  progress: { done: number; total: number }
  blindLoading: boolean
  poolMessages: PoolMessage[]
  poolBusy: boolean
  error: string | null

  // cloud (Supabase)
  supabaseReady: boolean
  cloudScreenings: ScreeningRow[]
  cloudBusy: boolean
  savedId: string | null

  settings: Settings

  // actions
  loadSample: () => void
  setInputs: (job: Job, candidates: Candidate[]) => void
  runScreening: () => Promise<void>
  fetchCloudScreenings: () => Promise<void>
  loadCloudScreening: (id: string) => Promise<void>
  removeCloudScreening: (id: string) => Promise<void>
  ensureBlindScores: () => Promise<void>
  setBlindMode: (on: boolean) => void
  generateKit: (candidateId: string) => Promise<void>
  askPool: (question: string) => Promise<void>
  runEvaluation: (candidateId: string, notes: string) => Promise<void>
  setView: (v: View) => void
  select: (id: string | null) => void
  toggleCompare: (id: string) => void
  updateSettings: (patch: Partial<Settings>) => void
  reset: () => void
}

function pushTrace(get: () => State, set: (s: Partial<State>) => void, agent: string, detail: string): string {
  const id = uid('trace')
  set({ trace: [...get().trace, { id, agent, status: 'running', detail, ts: Date.now() }] })
  return id
}
function doneTrace(get: () => State, set: (s: Partial<State>) => void, id: string, detail?: string) {
  set({
    trace: get().trace.map((t) => (t.id === id ? { ...t, status: 'done', detail: detail ?? t.detail } : t)),
  })
}
function pushAudit(get: () => State, set: (s: Partial<State>) => void, entry: Omit<AuditEntry, 'id' | 'ts'>) {
  set({ audit: [{ ...entry, id: uid('audit'), ts: Date.now() }, ...get().audit] })
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      job: null,
      candidates: [],
      scores: {},
      blindScores: {},
      kits: {},
      evaluations: {},
      trace: [],
      audit: [],

      view: 'setup',
      selectedId: null,
      compareIds: [],
      blindMode: false,

      status: 'idle',
      progress: { done: 0, total: 0 },
      blindLoading: false,
      poolMessages: [],
      poolBusy: false,
      error: null,

      supabaseReady: isSupabaseConfigured,
      cloudScreenings: [],
      cloudBusy: false,
      savedId: null,

      settings: { useMl: false, mlApiUrl: DEFAULT_ML_URL, useLive: false, apiKey: '', model: DEFAULT_MODEL, theme: 'dark' },

      loadSample: () => {
        set({
          job: SAMPLE_JOB,
          candidates: SAMPLE_CANDIDATES.map((c) => ({ ...c })),
          scores: {},
          blindScores: {},
          kits: {},
          evaluations: {},
          trace: [],
          audit: [],
          status: 'idle',
          selectedId: null,
          compareIds: [],
          poolMessages: [],
          error: null,
        })
      },

      setInputs: (job, candidates) => {
        set({
          job,
          candidates,
          scores: {},
          blindScores: {},
          kits: {},
          evaluations: {},
          trace: [],
          audit: [],
          status: 'idle',
          selectedId: null,
          compareIds: [],
          poolMessages: [],
          error: null,
        })
      },

      runScreening: async () => {
        const { job, candidates, settings } = get()
        if (!job || candidates.length === 0) return
        const provider = getProvider(settings)
        const isDemo = provider.mode === 'demo'

        set({
          status: 'running',
          view: 'dashboard',
          trace: [],
          audit: [],
          scores: {},
          blindScores: {},
          progress: { done: 0, total: candidates.length },
          error: null,
        })

        try {
          // 1. Analyze the job
          const t0 = pushTrace(get, set, 'JD Analyzer', `Parsing "${job.title}"`)
          const structured = await provider.analyzeJob(job)
          set({ job: { ...job, structured } })
          doneTrace(get, set, t0, `${structured.mustHaves.length} required, ${structured.niceToHaves.length} nice-to-have`)
          pushAudit(get, set, {
            type: 'JD analysis',
            summary: `Extracted ${structured.mustHaves.length} required skills`,
            inputsUsed: [job.title],
            model: engineLabel(provider.mode, settings),
          })

          const updatedJob = { ...job, structured }
          const nextCandidates: Candidate[] = []
          const nextScores: Record<string, CandidateScore> = {}
          const nextBlind: Record<string, CandidateScore> = {}

          // 2. Extract + score each candidate
          for (let i = 0; i < candidates.length; i++) {
            const c = candidates[i]
            const tx = pushTrace(get, set, 'Resume Extractor', `Reading ${c.name}`)
            const profile = await provider.extractResume(c)
            const withProfile: Candidate = { ...c, profile }
            nextCandidates.push(withProfile)
            doneTrace(get, set, tx, `${profile.skills.length} skills, ${profile.yearsExperience} yrs`)

            const ts = pushTrace(get, set, 'Matcher / Scorer', `Scoring ${c.name}`)
            let score = await provider.scoreCandidate(updatedJob, withProfile)
            if (isDemo) score = applyBias(score, demoBias(c))
            nextScores[c.id] = score
            doneTrace(get, set, ts, `${c.name}: ${score.overall}/100`)
            pushAudit(get, set, {
              type: 'Candidate score',
              summary: `${c.name} scored ${score.overall}/100 with ${score.dimensions.reduce((n, d) => n + d.evidence.length, 0)} cited snippets`,
              inputsUsed: [`${c.name} resume`, job.title],
              model: engineLabel(provider.mode, settings),
            })

            // In demo mode, compute the blind score immediately (fast + local).
            if (isDemo) {
              const blind = await provider.scoreCandidate(updatedJob, { ...toBlindCandidate(c, i), profile })
              nextBlind[c.id] = { ...blind, blindScored: true }
            }

            set({
              candidates: [...nextCandidates, ...candidates.slice(i + 1)],
              scores: { ...nextScores },
              blindScores: { ...nextBlind },
              progress: { done: i + 1, total: candidates.length },
            })
          }

          set({ status: 'done', candidates: nextCandidates })

          // Persist the screening to Supabase (best-effort; app works without it).
          if (isSupabaseConfigured) {
            const s = get()
            const id = await saveScreening({
              job: s.job!,
              candidates: s.candidates,
              scores: s.scores,
              blindScores: s.blindScores,
              kits: s.kits,
              evaluations: s.evaluations,
              audit: s.audit,
            })
            if (id) {
              set({ savedId: id })
              void get().fetchCloudScreenings()
            }
          }
        } catch (e: any) {
          set({ status: 'done', error: e?.message ?? 'Screening failed' })
        }
      },

      fetchCloudScreenings: async () => {
        if (!isSupabaseConfigured) return
        set({ cloudBusy: true })
        try {
          set({ cloudScreenings: await listScreenings() })
        } finally {
          set({ cloudBusy: false })
        }
      },

      loadCloudScreening: async (id) => {
        const snap = await loadScreening(id)
        if (!snap) return
        set({
          job: snap.job,
          candidates: snap.candidates,
          scores: snap.scores,
          blindScores: snap.blindScores ?? {},
          kits: snap.kits ?? {},
          evaluations: snap.evaluations ?? {},
          audit: snap.audit ?? [],
          trace: [],
          status: 'done',
          view: 'dashboard',
          selectedId: null,
          compareIds: [],
          blindMode: false,
          poolMessages: [],
          savedId: id,
          error: null,
        })
      },

      removeCloudScreening: async (id) => {
        await deleteScreening(id)
        set({ cloudScreenings: get().cloudScreenings.filter((s) => s.id !== id) })
      },

      ensureBlindScores: async () => {
        const { job, candidates, blindScores, settings } = get()
        if (!job) return
        const missing = candidates.some((c) => !blindScores[c.id])
        if (!missing) return
        const provider = getProvider(settings)
        set({ blindLoading: true })
        try {
          const next: Record<string, CandidateScore> = { ...blindScores }
          for (let i = 0; i < candidates.length; i++) {
            const c = candidates[i]
            if (next[c.id]) continue
            const blind = await provider.scoreCandidate(job, { ...toBlindCandidate(c, i), profile: c.profile })
            next[c.id] = { ...blind, blindScored: true }
            set({ blindScores: { ...next } })
          }
        } finally {
          set({ blindLoading: false })
        }
      },

      setBlindMode: (on) => {
        set({ blindMode: on })
        if (on) void get().ensureBlindScores()
      },

      generateKit: async (candidateId) => {
        const { job, candidates, scores, kits, settings } = get()
        if (!job || kits[candidateId]) return
        const c = candidates.find((x) => x.id === candidateId)
        const score = scores[candidateId]
        if (!c || !score) return
        const provider = getProvider(settings)
        const t = pushTrace(get, set, 'Interview-Kit Generator', `Building kit for ${c.name}`)
        const kit = await provider.generateInterviewKit(job, c, score)
        set({ kits: { ...get().kits, [candidateId]: kit } })
        doneTrace(get, set, t, `${kit.questions.length} questions`)
        pushAudit(get, set, {
          type: 'Interview kit',
          summary: `Generated ${kit.questions.length} questions for ${c.name}`,
          inputsUsed: [`${c.name} resume`, `${c.name} score`],
          model: engineLabel(provider.mode, settings),
        })
      },

      askPool: async (question) => {
        const { job, candidates, settings } = get()
        if (!job) return
        const provider = getProvider(settings)
        set({ poolMessages: [...get().poolMessages, { role: 'user', text: question }], poolBusy: true })
        const t = pushTrace(get, set, 'Pool Q&A', question.slice(0, 48))
        try {
          const ans = await provider.askPool(job, candidates, question)
          set({ poolMessages: [...get().poolMessages, { role: 'agent', text: ans.answer, answer: ans }] })
          doneTrace(get, set, t, `${ans.citations.length} citations`)
          pushAudit(get, set, {
            type: 'Pool query',
            summary: question,
            inputsUsed: ans.citations.map((c) => c.candidateName),
            model: engineLabel(provider.mode, settings),
          })
        } finally {
          set({ poolBusy: false })
        }
      },

      runEvaluation: async (candidateId, notes) => {
        const { job, candidates, settings } = get()
        if (!job) return
        const c = candidates.find((x) => x.id === candidateId)
        if (!c) return
        const provider = getProvider(settings)
        const t = pushTrace(get, set, 'Evaluator', `Evaluating ${c.name}`)
        const ev = await provider.evaluate(job, c, notes)
        set({ evaluations: { ...get().evaluations, [candidateId]: ev } })
        doneTrace(get, set, t, ev.recommendation)
        pushAudit(get, set, {
          type: 'Evaluation',
          summary: `${c.name}: ${ev.recommendation}`,
          inputsUsed: [`${c.name} resume`, 'interview notes'],
          model: engineLabel(provider.mode, settings),
        })
      },

      setView: (v) => set({ view: v }),
      select: (id) => set({ selectedId: id, view: id ? 'candidate' : get().view }),
      toggleCompare: (id) => {
        const cur = get().compareIds
        if (cur.includes(id)) set({ compareIds: cur.filter((x) => x !== id) })
        else if (cur.length < 3) set({ compareIds: [...cur, id] })
      },
      updateSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
      reset: () =>
        set({
          job: null,
          candidates: [],
          scores: {},
          blindScores: {},
          kits: {},
          evaluations: {},
          trace: [],
          audit: [],
          view: 'setup',
          selectedId: null,
          compareIds: [],
          blindMode: false,
          status: 'idle',
          poolMessages: [],
          error: null,
        }),
    }),
    {
      name: 'hireflow-settings',
      partialize: (s) => ({ settings: s.settings }) as any,
    },
  ),
)
