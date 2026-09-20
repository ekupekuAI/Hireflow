import type {
  AgentProvider,
  Candidate,
  CandidateScore,
  Evaluation,
  InterviewKit,
  Job,
  JobStructured,
  PoolAnswer,
  CandidateProfile,
} from '@/lib/types'
import { _sync } from './demo'

export const DEFAULT_ML_URL = 'http://localhost:8077'

/**
 * Talks to the Python scikit-learn backend (backend/app.py). Each method calls
 * the matching endpoint and, if the server is unreachable, transparently falls
 * back to the local engine so the app never breaks.
 */
export function createMlProvider(baseUrl: string = DEFAULT_ML_URL): AgentProvider {
  const base = (baseUrl || DEFAULT_ML_URL).replace(/\/$/, '')

  async function post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`ML backend ${path} → ${res.status}`)
    return (await res.json()) as T
  }

  return {
    mode: 'ml',

    async analyzeJob(job: Job): Promise<JobStructured> {
      try {
        return await post<JobStructured>('/analyze-job', { job })
      } catch (e) {
        console.warn('[ml] analyzeJob fell back to local engine:', e)
        return _sync.analyzeJobSync(job)
      }
    },

    async extractResume(candidate: Candidate): Promise<CandidateProfile> {
      try {
        return await post<CandidateProfile>('/extract', { candidate })
      } catch (e) {
        console.warn('[ml] extractResume fell back to local engine:', e)
        return _sync.extractProfile(candidate)
      }
    },

    async scoreCandidate(job: Job, candidate: Candidate): Promise<CandidateScore> {
      try {
        return await post<CandidateScore>('/score', { job, candidate })
      } catch (e) {
        console.warn('[ml] scoreCandidate fell back to local engine:', e)
        return _sync.scoreSync(job, candidate)
      }
    },

    async generateInterviewKit(job: Job, candidate: Candidate, score: CandidateScore): Promise<InterviewKit> {
      try {
        return await post<InterviewKit>('/interview-kit', { job, candidate, score })
      } catch (e) {
        console.warn('[ml] generateInterviewKit fell back to local engine:', e)
        return _sync.interviewKitSync(job, candidate, score)
      }
    },

    async askPool(job: Job, candidates: Candidate[], question: string): Promise<PoolAnswer> {
      try {
        return await post<PoolAnswer>('/ask-pool', { job, candidates, question })
      } catch (e) {
        console.warn('[ml] askPool fell back to local engine:', e)
        return _sync.askPoolSync(job, candidates, question)
      }
    },

    async evaluate(job: Job, candidate: Candidate, notes: string): Promise<Evaluation> {
      try {
        return await post<Evaluation>('/evaluate', { job, candidate, notes })
      } catch (e) {
        console.warn('[ml] evaluate fell back to local engine:', e)
        return _sync.evaluateSync(job, candidate, notes)
      }
    },
  }
}

/** Quick reachability probe for the Settings UI. */
export async function pingMlBackend(baseUrl: string = DEFAULT_ML_URL): Promise<boolean> {
  try {
    const res = await fetch(`${(baseUrl || DEFAULT_ML_URL).replace(/\/$/, '')}/health`)
    return res.ok
  } catch {
    return false
  }
}
