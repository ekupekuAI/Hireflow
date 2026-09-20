import type { Candidate, CandidateScore, Job } from '@/lib/types'

// Each prompt asks the model to return ONLY JSON matching an explicit shape.
// The live provider parses it and falls back to the local engine on any failure.

export const JOB_SYSTEM = `You are an expert technical recruiter. Analyze a job description and extract structured requirements. Respond with ONLY valid JSON, no prose, no markdown fences.`

export function jobUser(job: Job): string {
  return `Job title: ${job.title}

Job description:
"""
${job.rawText}
"""

Return JSON exactly in this shape:
{
  "mustHaves": ["required skill", ...],
  "niceToHaves": ["preferred skill", ...],
  "seniority": "Junior|Mid|Senior|Lead|Staff/Principal",
  "minYears": <number>,
  "responsibilities": ["...", ...],
  "domain": ["e.g. Fintech", ...]
}`
}

export const EXTRACT_SYSTEM = `You extract structured profiles from resumes. Be faithful to the text; do not invent skills. Respond with ONLY valid JSON, no prose.`

export function extractUser(candidate: Candidate): string {
  return `Resume:
"""
${candidate.rawText}
"""

Return JSON exactly in this shape:
{
  "skills": ["..."],
  "yearsExperience": <number>,
  "roles": ["Job Title", ...],
  "projects": ["short description", ...],
  "education": ["..."],
  "domain": ["..."],
  "summary": "one-sentence summary"
}`
}

export const SCORE_SYSTEM = `You are a fair, evidence-driven screening assistant. Score a candidate against a job.
CRITICAL: every claim must be backed by an exact snippet quoted from the resume. Never fabricate evidence.
If information is missing, lower confidence and add it to flagsToValidate. Respond with ONLY valid JSON.`

export function scoreUser(job: Job, candidate: Candidate): string {
  return `JOB TITLE: ${job.title}
JOB REQUIREMENTS:
"""
${job.rawText}
"""

CANDIDATE: ${candidate.name}
RESUME:
"""
${candidate.rawText}
"""

Score on four dimensions with these weights: Skills match (0.35), Experience (0.25), Domain fit (0.20), Seniority & leadership (0.20).
Return JSON exactly in this shape:
{
  "overall": <0-100>,
  "dimensions": [
    { "name": "Skills match", "score": <0-100>, "weight": 0.35, "reasoning": "...", "evidence": [ { "claim": "...", "snippet": "exact quote from resume" } ] },
    { "name": "Experience", "score": <0-100>, "weight": 0.25, "reasoning": "...", "evidence": [ ... ] },
    { "name": "Domain fit", "score": <0-100>, "weight": 0.20, "reasoning": "...", "evidence": [ ... ] },
    { "name": "Seniority & leadership", "score": <0-100>, "weight": 0.20, "reasoning": "...", "evidence": [ ... ] }
  ],
  "strengths": ["..."],
  "gaps": ["..."],
  "flagsToValidate": ["things to confirm in interview"],
  "confidence": <0-1>,
  "reasoning": "one-sentence overall justification"
}`
}

export const KIT_SYSTEM = `You are an interview coach. Generate targeted, role-specific interview questions that validate the candidate's real depth and probe their gaps. Respond with ONLY valid JSON.`

export function kitUser(job: Job, candidate: Candidate, score: CandidateScore): string {
  return `JOB: ${job.title}
CANDIDATE: ${candidate.name}
RESUME:
"""
${candidate.rawText}
"""
KNOWN GAPS / FLAGS: ${[...score.gaps, ...score.flagsToValidate].join('; ') || 'none'}

Return JSON exactly in this shape:
{
  "questions": [
    { "area": "topic", "question": "...", "rationale": "why ask this", "followUps": ["...", "..."] }
  ],
  "probeAreas": ["areas that still need validation"]
}
Generate 5-6 questions. At least two must target the gaps/flags.`
}

export const POOL_SYSTEM = `You answer recruiter questions about a pool of candidates. Only use the provided resumes. Cite the candidates you rely on with an exact snippet. Respond with ONLY valid JSON.`

export function poolUser(job: Job, candidates: Candidate[], question: string): string {
  const pool = candidates
    .map((c) => `### ${c.name} (id: ${c.id})\n${c.rawText}`)
    .join('\n\n')
  return `RECRUITER QUESTION: ${question}

CANDIDATE POOL:
"""
${pool}
"""

Return JSON exactly in this shape:
{
  "answer": "concise answer naming the best-matching candidates",
  "citations": [ { "candidateId": "id", "candidateName": "name", "snippet": "exact quote" } ]
}`
}

export const EVAL_SYSTEM = `You produce a standardized post-interview evaluation. Map each job requirement to evidence from the resume and interview notes, and mark whether it was met. Respond with ONLY valid JSON.`

export function evalUser(job: Job, candidate: Candidate, notes: string): string {
  return `JOB: ${job.title}
REQUIREMENTS:
"""
${job.rawText}
"""
CANDIDATE: ${candidate.name}
RESUME:
"""
${candidate.rawText}
"""
INTERVIEW NOTES:
"""
${notes}
"""

Return JSON exactly in this shape:
{
  "summary": "2-3 sentence summary",
  "mapped": [ { "requirement": "...", "evidence": "...", "met": "yes|partial|no" } ],
  "gaps": ["..."],
  "recommendation": "Advance to next round | Borderline ... | Do not advance"
}`
}
