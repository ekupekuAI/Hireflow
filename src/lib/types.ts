// ---------- Core domain types ----------

export interface JobStructured {
  mustHaves: string[]
  niceToHaves: string[]
  seniority: string
  minYears: number
  responsibilities: string[]
  domain: string[]
}

export interface Job {
  id: string
  title: string
  rawText: string
  structured?: JobStructured
}

export interface CandidateProfile {
  skills: string[]
  yearsExperience: number
  roles: string[]
  projects: string[]
  education: string[]
  domain: string[]
  summary: string
}

export interface CandidateMeta {
  gender?: string
  age?: number
  school?: string
  location?: string
}

export interface Candidate {
  id: string
  name: string
  rawText: string
  profile?: CandidateProfile
  meta?: CandidateMeta
}

export interface Evidence {
  claim: string // what this snippet supports
  snippet: string // exact text pulled from the resume
}

export interface DimensionScore {
  name: string // e.g. "Skills match"
  score: number // 0-100
  weight: number // 0-1
  reasoning: string
  evidence: Evidence[]
}

export interface CandidateScore {
  candidateId: string
  overall: number // 0-100
  dimensions: DimensionScore[]
  strengths: string[]
  gaps: string[]
  flagsToValidate: string[]
  confidence: number // 0-1
  reasoning: string
  blindScored?: boolean
}

export interface InterviewQuestion {
  area: string
  question: string
  rationale: string
  followUps: string[]
}

export interface InterviewKit {
  candidateId: string
  questions: InterviewQuestion[]
  probeAreas: string[]
}

export interface PoolCitation {
  candidateId: string
  candidateName: string
  snippet: string
}

export interface PoolAnswer {
  answer: string
  citations: PoolCitation[]
}

export interface EvaluationMap {
  requirement: string
  evidence: string
  met: 'yes' | 'partial' | 'no'
}

export interface Evaluation {
  candidateId: string
  summary: string
  mapped: EvaluationMap[]
  gaps: string[]
  recommendation: string
}

// ---------- Agent observability ----------

export type TraceStatus = 'pending' | 'running' | 'done'

export interface TraceStep {
  id: string
  agent: string
  status: TraceStatus
  detail: string
  ts: number
}

export interface AuditEntry {
  id: string
  type: string
  summary: string
  inputsUsed: string[]
  model: string
  ts: number
}

// ---------- Provider abstraction ----------

export type ProviderMode = 'demo' | 'live' | 'ml'

export interface AgentProvider {
  mode: ProviderMode
  analyzeJob(job: Job): Promise<JobStructured>
  extractResume(candidate: Candidate): Promise<CandidateProfile>
  scoreCandidate(job: Job, candidate: Candidate): Promise<CandidateScore>
  generateInterviewKit(job: Job, candidate: Candidate, score: CandidateScore): Promise<InterviewKit>
  askPool(job: Job, candidates: Candidate[], question: string): Promise<PoolAnswer>
  evaluate(job: Job, candidate: Candidate, notes: string): Promise<Evaluation>
}
