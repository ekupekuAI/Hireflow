import type {
  AgentProvider,
  Candidate,
  CandidateProfile,
  CandidateScore,
  DimensionScore,
  Evaluation,
  Evidence,
  InterviewKit,
  Job,
  JobStructured,
  PoolAnswer,
  PoolCitation,
} from '@/lib/types'
import { SKILL_ALIASES, detectDomains, detectSkills, textHasAlias } from '@/lib/skills'
import { sleep } from '@/lib/utils'

const CURRENT_YEAR = 2026

function lines(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

/** Find the first line/sentence in `text` that mentions any alias of `skill`. */
function findSnippet(text: string, skill: string): string {
  const aliases = SKILL_ALIASES[skill] ?? [skill.toLowerCase()]
  for (const line of lines(text)) {
    if (aliases.some((a) => textHasAlias(line, a))) {
      return line.replace(/^[-•*]\s*/, '').slice(0, 220)
    }
  }
  return ''
}

function yearsFromText(text: string): number {
  // Prefer an explicitly stated "N years" (the summary line) — most reliable.
  const explicit = [...text.matchAll(/(\d{1,2})\+?\s*years/gi)].map((m) => parseInt(m[1], 10)).filter((n) => n > 0 && n < 45)
  if (explicit.length) return Math.min(Math.max(...explicit), 45)

  // Fall back to spanning employment date ranges (ignoring stray years otherwise).
  const yearTokens = [...text.matchAll(/\b(20\d{2})\b/g)].map((m) => parseInt(m[1], 10))
  if (yearTokens.length) {
    const min = Math.min(...yearTokens)
    const max = /present|current/i.test(text) ? CURRENT_YEAR : Math.max(...yearTokens)
    return Math.min(max - min, 45)
  }
  return 0
}

function detectSeniority(text: string): string {
  const t = text.toLowerCase()
  if (/(principal|staff)/.test(t)) return 'Staff/Principal'
  if (/(senior|sr\.)/.test(t)) return 'Senior'
  if (/(lead|manager)/.test(t)) return 'Lead'
  if (/(junior|jr\.|intern|graduate)/.test(t)) return 'Junior'
  return 'Mid'
}

const ROLE_RE = /(engineer|developer|scientist|manager|architect|lead|analyst|intern|consultant)/i
const EDU_RE = /(b\.?s\.?|b\.?tech|b\.?eng|m\.?s\.?|ph\.?d|bachelor|master|university|college|institute|iit|nit)/i
const PROJECT_RE = /(built|designed|architected|led|developed|implemented|created|owned|migrat|optimi[sz]ed)/i

function extractProfile(candidate: Candidate): CandidateProfile {
  const text = candidate.rawText
  const ls = lines(text)

  const skills = detectSkills(text)
  const domain = detectDomains(text)
  const yearsExperience = yearsFromText(text)

  const roles = Array.from(
    new Set(
      ls
        .filter((l) => ROLE_RE.test(l) && (l.startsWith('-') || /\d{4}/.test(l) || /,/.test(l)))
        .map((l) => l.replace(/^[-•*]\s*/, '').split(/[,(]/)[0].trim())
        .filter((r) => r.length > 3 && r.length < 60),
    ),
  ).slice(0, 5)

  const projects = ls
    .filter((l) => PROJECT_RE.test(l))
    .map((l) => l.replace(/^[-•*]\s*/, '').slice(0, 180))
    .slice(0, 5)

  const education = ls.filter((l) => EDU_RE.test(l)).map((l) => l.replace(/^[-•*]\s*/, '')).slice(0, 3)

  let summary = ''
  const sumIdx = ls.findIndex((l) => /^summary/i.test(l))
  if (sumIdx >= 0 && ls[sumIdx + 1]) summary = ls[sumIdx + 1]
  else summary = ls.find((l) => l.length > 40) ?? ls[1] ?? ''

  return { skills, yearsExperience, roles, projects, education, domain, summary: summary.slice(0, 240) }
}

function analyzeJobSync(job: Job): JobStructured {
  const text = job.rawText
  const lower = text.toLowerCase()

  const reqStart = lower.search(/required|must have|qualifications/)
  const niceStart = lower.search(/nice to have|preferred|bonus/)
  const respStart = lower.search(/responsibilities|what you.ll do|the role/)

  const requiredText =
    reqStart >= 0 ? text.slice(reqStart, niceStart >= 0 ? niceStart : respStart >= 0 ? respStart : undefined) : text
  const niceText = niceStart >= 0 ? text.slice(niceStart, respStart >= 0 ? respStart : undefined) : ''
  const respText = respStart >= 0 ? text.slice(respStart) : ''

  const mustHaves = detectSkills(requiredText)
  const niceToHaves = detectSkills(niceText).filter((s) => !mustHaves.includes(s))

  const minYearsMatch = requiredText.match(/(\d{1,2})\+?\s*years/i)
  const minYears = minYearsMatch ? parseInt(minYearsMatch[1], 10) : 3

  const responsibilities = lines(respText)
    .filter((l) => /^[-•*]/.test(l))
    .map((l) => l.replace(/^[-•*]\s*/, ''))
    .slice(0, 6)

  return {
    mustHaves,
    niceToHaves,
    seniority: detectSeniority(job.title + ' ' + requiredText),
    minYears,
    responsibilities,
    domain: detectDomains(text),
  }
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

function scoreSync(job: Job, candidate: Candidate): CandidateScore {
  const jd = job.structured ?? analyzeJobSync(job)
  const profile = candidate.profile ?? extractProfile(candidate)
  const text = candidate.rawText

  // --- Skills match ---
  const matchedMust = jd.mustHaves.filter((s) => profile.skills.includes(s))
  const matchedNice = jd.niceToHaves.filter((s) => profile.skills.includes(s))
  const missingMust = jd.mustHaves.filter((s) => !profile.skills.includes(s))
  const mustRatio = jd.mustHaves.length ? matchedMust.length / jd.mustHaves.length : 0.5
  const niceRatio = jd.niceToHaves.length ? matchedNice.length / jd.niceToHaves.length : 0
  const skillsScore = clamp(mustRatio * 85 + niceRatio * 15)

  const skillsEvidence: Evidence[] = matchedMust
    .map((s) => ({ claim: `${s} (required)`, snippet: findSnippet(text, s) }))
    .filter((e) => e.snippet)
    .slice(0, 4)

  // --- Experience ---
  const expScore = clamp((profile.yearsExperience / Math.max(1, jd.minYears)) * 80 + 20)
  const expEvidence: Evidence[] = [
    {
      claim: `${profile.yearsExperience} yrs experience (role asks ${jd.minYears}+)`,
      snippet: profile.summary || profile.roles[0] || '',
    },
  ].filter((e) => e.snippet)

  // --- Domain fit ---
  const domainOverlap = jd.domain.filter((d) => profile.domain.includes(d))
  const domainScore = jd.domain.length
    ? clamp((domainOverlap.length / jd.domain.length) * 100)
    : 60
  const domainEvidence: Evidence[] = domainOverlap
    .map((d) => ({ claim: `${d} domain`, snippet: findSnippet(text, d) || `Experience in ${d}` }))
    .slice(0, 2)

  // --- Seniority / leadership ---
  const hasLeadership = profile.skills.includes('Leadership') || /mentor|led a team|managed/i.test(text)
  const seniorityMatch =
    jd.seniority === detectSeniority(text) ? 100 : /senior|staff|principal|lead/i.test(text) ? 75 : 55
  const seniorityScore = clamp(seniorityMatch * 0.7 + (hasLeadership ? 30 : 10))
  const seniorityEvidence: Evidence[] = [
    { claim: 'Leadership / mentoring', snippet: hasLeadership ? findSnippet(text, 'Leadership') || 'Led / mentored a team' : '' },
  ].filter((e) => e.snippet)

  const dimensions: DimensionScore[] = [
    { name: 'Skills match', score: skillsScore, weight: 0.35, reasoning: `Matches ${matchedMust.length}/${jd.mustHaves.length} required skills` + (matchedNice.length ? ` and ${matchedNice.length} nice-to-have.` : '.'), evidence: skillsEvidence },
    { name: 'Experience', score: expScore, weight: 0.25, reasoning: `${profile.yearsExperience} years vs ${jd.minYears}+ required.`, evidence: expEvidence },
    { name: 'Domain fit', score: domainScore, weight: 0.2, reasoning: domainOverlap.length ? `Direct experience in ${domainOverlap.join(', ')}.` : 'No direct domain overlap detected.', evidence: domainEvidence },
    { name: 'Seniority & leadership', score: seniorityScore, weight: 0.2, reasoning: hasLeadership ? 'Demonstrated leadership/mentoring.' : 'Limited leadership signal.', evidence: seniorityEvidence },
  ]

  const overall = clamp(dimensions.reduce((sum, d) => sum + d.score * d.weight, 0))

  const strengths = [
    ...matchedMust.slice(0, 3).map((s) => `Strong ${s}`),
    ...(domainOverlap.length ? [`${domainOverlap[0]} domain experience`] : []),
    ...(hasLeadership ? ['Leadership experience'] : []),
  ].slice(0, 4)

  const gaps = [
    ...missingMust.map((s) => `No clear evidence of ${s}`),
    ...(profile.yearsExperience < jd.minYears ? [`Only ${profile.yearsExperience} yrs (role asks ${jd.minYears}+)`] : []),
  ].slice(0, 4)

  const flagsToValidate = [
    ...missingMust.slice(0, 2).map((s) => `Confirm hands-on ${s} in interview`),
    ...(domainOverlap.length === 0 && jd.domain.length ? [`Probe transferability into ${jd.domain[0]}`] : []),
  ].slice(0, 3)

  // Confidence reflects how much signal we had to work with.
  const confidence = clamp(40 + Math.min(40, text.length / 40) + skillsEvidence.length * 5) / 100

  return {
    candidateId: candidate.id,
    overall,
    dimensions,
    strengths,
    gaps,
    flagsToValidate,
    confidence,
    reasoning: `${strengths[0] ?? 'Partial match against the role'}${gaps.length ? `, but ${gaps[0].toLowerCase()}` : ''}.`,
  }
}

function interviewKitSync(job: Job, candidate: Candidate, score: CandidateScore): InterviewKit {
  const profile = candidate.profile ?? extractProfile(candidate)
  const topSkills = profile.skills.slice(0, 3)

  const questions: InterviewKit['questions'] = []

  for (const skill of topSkills) {
    questions.push({
      area: skill,
      question: `Walk me through the most complex ${skill} problem you've solved in production. What was the tradeoff you're least proud of?`,
      rationale: `Candidate lists ${skill}; validate depth beyond keyword.`,
      followUps: [`How did you measure success?`, `What would you do differently at 10x scale?`],
    })
  }

  for (const flag of score.flagsToValidate) {
    const area = flag.replace(/^Confirm hands-on |^Probe /i, '').replace(/ in interview$/, '')
    questions.push({
      area,
      question: `The role needs ${area}. Tell me about a specific time you used it end to end.`,
      rationale: `Flagged as unclear from the resume — needs validation.`,
      followUps: [`What went wrong and how did you recover?`],
    })
  }

  return {
    candidateId: candidate.id,
    questions: questions.slice(0, 6),
    probeAreas: [...score.gaps, ...score.flagsToValidate].slice(0, 5),
  }
}

function askPoolSync(job: Job, candidates: Candidate[], question: string): PoolAnswer {
  const q = question.toLowerCase()
  const wantedSkills = detectSkills(question)
  const wantedDomains = detectDomains(question)

  const scored = candidates
    .map((c) => {
      const profile = c.profile ?? extractProfile(c)
      const skillHits = wantedSkills.filter((s) => profile.skills.includes(s))
      const domainHits = wantedDomains.filter((d) => profile.domain.includes(d))
      const leadershipWanted = /lead|manage|mentor/.test(q)
      const leadershipHit = leadershipWanted && /mentor|led|managed|lead/i.test(c.rawText)
      const relevance = skillHits.length * 2 + domainHits.length * 2 + (leadershipHit ? 2 : 0)
      return { c, profile, skillHits, domainHits, leadershipHit, relevance }
    })
    .filter((r) => r.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)

  const citations: PoolCitation[] = scored.slice(0, 4).map((r) => {
    const key = r.skillHits[0] ?? r.domainHits[0] ?? 'experience'
    return {
      candidateId: r.c.id,
      candidateName: r.c.name,
      snippet: findSnippet(r.c.rawText, key) || r.profile.summary,
    }
  })

  const names = scored.slice(0, 3).map((r) => r.c.name)
  const criteria = [...wantedSkills, ...wantedDomains].join(', ') || 'your query'
  const answer = names.length
    ? `${names.length} candidate${names.length > 1 ? 's' : ''} match ${criteria}: ${names.join(', ')}. ${scored[0].c.name} is the strongest — ${scored[0].skillHits.concat(scored[0].domainHits).join(' + ') || 'relevant background'}.`
    : `No candidate clearly matches ${criteria}. Try broadening the criteria.`

  return { answer, citations }
}

function evaluateSync(job: Job, candidate: Candidate, notes: string): Evaluation {
  const jd = job.structured ?? analyzeJobSync(job)
  const haystack = `${candidate.rawText}\n${notes}`.toLowerCase()

  const mapped = jd.mustHaves.map((req) => {
    const aliases = SKILL_ALIASES[req] ?? [req.toLowerCase()]
    const inNotes = aliases.some((a) => notes.toLowerCase().includes(a))
    const inResume = aliases.some((a) => haystack.includes(a))
    const met: 'yes' | 'partial' | 'no' = inNotes ? 'yes' : inResume ? 'partial' : 'no'
    const evidence = inNotes
      ? findSnippet(notes, req) || 'Mentioned in interview notes'
      : inResume
        ? findSnippet(candidate.rawText, req) || 'On resume, not confirmed in interview'
        : 'No evidence found'
    return { requirement: req, evidence, met }
  })

  const gaps = mapped.filter((m) => m.met === 'no').map((m) => `${m.requirement} — not demonstrated`)
  const yesCount = mapped.filter((m) => m.met === 'yes').length
  const ratio = mapped.length ? yesCount / mapped.length : 0
  const recommendation =
    ratio >= 0.7 ? 'Advance to next round' : ratio >= 0.4 ? 'Borderline — needs a second interview on gaps' : 'Do not advance'

  return {
    candidateId: candidate.id,
    summary: `Confirmed ${yesCount}/${mapped.length} required areas in the interview. ${gaps.length ? `${gaps.length} area(s) still unproven.` : 'All required areas addressed.'}`,
    mapped,
    gaps,
    recommendation,
  }
}

/** Local heuristic provider — no network. Works on any pasted/uploaded text. */
export const demoProvider: AgentProvider = {
  mode: 'demo',
  async analyzeJob(job) {
    await sleep(250)
    return analyzeJobSync(job)
  },
  async extractResume(candidate) {
    await sleep(180)
    return extractProfile(candidate)
  },
  async scoreCandidate(job, candidate) {
    await sleep(220)
    return scoreSync(job, candidate)
  },
  async generateInterviewKit(job, candidate, score) {
    await sleep(300)
    return interviewKitSync(job, candidate, score)
  },
  async askPool(job, candidates, question) {
    await sleep(400)
    return askPoolSync(job, candidates, question)
  },
  async evaluate(job, candidate, notes) {
    await sleep(400)
    return evaluateSync(job, candidate, notes)
  },
}

// Exported for reuse by the live provider as a fallback shape.
export const _sync = { analyzeJobSync, extractProfile, scoreSync, interviewKitSync, askPoolSync, evaluateSync }
