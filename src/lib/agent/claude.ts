import Anthropic from '@anthropic-ai/sdk'
import type {
  AgentProvider,
  Candidate,
  CandidateProfile,
  CandidateScore,
  DimensionScore,
  Evaluation,
  InterviewKit,
  Job,
  JobStructured,
  PoolAnswer,
} from '@/lib/types'
import * as P from './prompts'
import { _sync } from './demo'

export const DEFAULT_MODEL = 'claude-opus-5'
export const MODEL_OPTIONS = [
  { id: 'claude-opus-5', label: 'Claude Opus 5 (most capable)' },
  { id: 'claude-sonnet-5', label: 'Claude Sonnet 5 (fast)' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 (fastest)' },
]

/** Tolerant JSON extraction from a model response that should be pure JSON. */
function extractJSON(text: string): any {
  const trimmed = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1))
    }
    throw new Error('No JSON found in model response')
  }
}

function asArray<T>(v: any, fallback: T[] = []): T[] {
  return Array.isArray(v) ? v : fallback
}
function asNum(v: any, fallback = 0): number {
  const n = typeof v === 'string' ? parseFloat(v) : v
  return Number.isFinite(n) ? n : fallback
}

function normalizeScore(candidate: Candidate, raw: any): CandidateScore {
  const dimensions: DimensionScore[] = asArray<any>(raw.dimensions).map((d) => ({
    name: String(d?.name ?? 'Dimension'),
    score: Math.round(asNum(d?.score)),
    weight: asNum(d?.weight, 0.25),
    reasoning: String(d?.reasoning ?? ''),
    evidence: asArray<any>(d?.evidence).map((e) => ({
      claim: String(e?.claim ?? ''),
      snippet: String(e?.snippet ?? ''),
    })),
  }))
  return {
    candidateId: candidate.id,
    overall: Math.round(asNum(raw.overall)),
    dimensions: dimensions.length ? dimensions : _sync.scoreSync({ id: '', title: '', rawText: '' } as Job, candidate).dimensions,
    strengths: asArray<string>(raw.strengths).map(String),
    gaps: asArray<string>(raw.gaps).map(String),
    flagsToValidate: asArray<string>(raw.flagsToValidate).map(String),
    confidence: Math.max(0, Math.min(1, asNum(raw.confidence, 0.7))),
    reasoning: String(raw.reasoning ?? ''),
  }
}

export function createLiveProvider(apiKey: string, model: string = DEFAULT_MODEL): AgentProvider {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  async function call(system: string, user: string, maxTokens = 2000): Promise<any> {
    const res = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    })
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
    return extractJSON(text)
  }

  return {
    mode: 'live',

    async analyzeJob(job: Job): Promise<JobStructured> {
      try {
        const r = await call(P.JOB_SYSTEM, P.jobUser(job), 1200)
        return {
          mustHaves: asArray<string>(r.mustHaves).map(String),
          niceToHaves: asArray<string>(r.niceToHaves).map(String),
          seniority: String(r.seniority ?? 'Senior'),
          minYears: asNum(r.minYears, 3),
          responsibilities: asArray<string>(r.responsibilities).map(String),
          domain: asArray<string>(r.domain).map(String),
        }
      } catch (e) {
        console.warn('[live] analyzeJob fell back to local engine:', e)
        return _sync.analyzeJobSync(job)
      }
    },

    async extractResume(candidate: Candidate): Promise<CandidateProfile> {
      try {
        const r = await call(P.EXTRACT_SYSTEM, P.extractUser(candidate), 1200)
        return {
          skills: asArray<string>(r.skills).map(String),
          yearsExperience: asNum(r.yearsExperience),
          roles: asArray<string>(r.roles).map(String),
          projects: asArray<string>(r.projects).map(String),
          education: asArray<string>(r.education).map(String),
          domain: asArray<string>(r.domain).map(String),
          summary: String(r.summary ?? ''),
        }
      } catch (e) {
        console.warn('[live] extractResume fell back to local engine:', e)
        return _sync.extractProfile(candidate)
      }
    },

    async scoreCandidate(job: Job, candidate: Candidate): Promise<CandidateScore> {
      try {
        const r = await call(P.SCORE_SYSTEM, P.scoreUser(job, candidate), 2200)
        return normalizeScore(candidate, r)
      } catch (e) {
        console.warn('[live] scoreCandidate fell back to local engine:', e)
        return _sync.scoreSync(job, candidate)
      }
    },

    async generateInterviewKit(job: Job, candidate: Candidate, score: CandidateScore): Promise<InterviewKit> {
      try {
        const r = await call(P.KIT_SYSTEM, P.kitUser(job, candidate, score), 2000)
        return {
          candidateId: candidate.id,
          questions: asArray<any>(r.questions).map((q) => ({
            area: String(q?.area ?? ''),
            question: String(q?.question ?? ''),
            rationale: String(q?.rationale ?? ''),
            followUps: asArray<string>(q?.followUps).map(String),
          })),
          probeAreas: asArray<string>(r.probeAreas).map(String),
        }
      } catch (e) {
        console.warn('[live] generateInterviewKit fell back to local engine:', e)
        return _sync.interviewKitSync(job, candidate, score)
      }
    },

    async askPool(job: Job, candidates: Candidate[], question: string): Promise<PoolAnswer> {
      try {
        const r = await call(P.POOL_SYSTEM, P.poolUser(job, candidates, question), 1500)
        return {
          answer: String(r.answer ?? ''),
          citations: asArray<any>(r.citations).map((c) => ({
            candidateId: String(c?.candidateId ?? ''),
            candidateName: String(c?.candidateName ?? ''),
            snippet: String(c?.snippet ?? ''),
          })),
        }
      } catch (e) {
        console.warn('[live] askPool fell back to local engine:', e)
        return _sync.askPoolSync(job, candidates, question)
      }
    },

    async evaluate(job: Job, candidate: Candidate, notes: string): Promise<Evaluation> {
      try {
        const r = await call(P.EVAL_SYSTEM, P.evalUser(job, candidate, notes), 1800)
        return {
          candidateId: candidate.id,
          summary: String(r.summary ?? ''),
          mapped: asArray<any>(r.mapped).map((m) => ({
            requirement: String(m?.requirement ?? ''),
            evidence: String(m?.evidence ?? ''),
            met: (['yes', 'partial', 'no'].includes(m?.met) ? m.met : 'partial') as 'yes' | 'partial' | 'no',
          })),
          gaps: asArray<string>(r.gaps).map(String),
          recommendation: String(r.recommendation ?? ''),
        }
      } catch (e) {
        console.warn('[live] evaluate fell back to local engine:', e)
        return _sync.evaluateSync(job, candidate, notes)
      }
    },
  }
}
