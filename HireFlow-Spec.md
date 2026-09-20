# HireFlow — Design Spec
### *"The AI screener that shows its work."*
AI Agent Hackathon 2026 · Problem Statement 3 (HireFlow) · Solo build

---

## 1. Positioning

An AI recruitment-intelligence agent that screens resumes against a job description,
produces an **evidence-cited** ranked shortlist, auto-generates interview kits, and
answers natural-language questions about the candidate pool — while keeping the human
hiring decision at the center.

**The differentiator (why we win Innovation + LinkedIn):** HireFlow is a **glass-box**
agent. Every score cites the exact resume snippet behind it, and a one-click **Blind Mode**
strips name / gender / age / school and shows *how the ranking changed* — turning the
project into a shareable statement on the #1 debate in AI hiring: *is it fair?*

## 2. Problem understanding (rubric: 15%)

Recruiters review large volumes of resumes; signal is scattered across resumes, portfolios,
and notes; manual screening is slow and inconsistent; interviewers spend prep time instead of
talking to people. HireFlow compresses screen → rank → interview-prep → evaluate into minutes,
and — critically — makes every machine judgment *auditable* so a human can trust or overrule it.

## 3. Feature set (tiered for a solo timeline)

**Tier 1 — Core (maps 1:1 to PS3):**
1. Upload JD + bulk resume upload (or one-click sample dataset)
2. AI extraction per resume: skills, experience, projects, education, seniority
3. JD analysis: must-haves vs nice-to-haves, seniority, responsibilities
4. Match scoring with dimension breakdown (skills / experience / domain / seniority)
5. Ranked shortlist / leaderboard
6. Structured candidate summary cards
7. Auto-generated, role-specific interview questions per candidate
8. Follow-up questions for weak/unclear areas
9. "Info to validate" flags per candidate
10. Natural-language query over the pool
11. **Audit trail** — every insight cites the exact source snippet

**Tier 2 — Differentiators (Innovation 15% + the viral hook):**
12. **Glass-box "why?"** on every score (evidence + reasoning)
13. **Blind Mode** + bias-delta ("ranking changed when blinded")
14. Human-in-the-loop: agent flags low confidence and asks
15. **Live "agent thinking" trace** panel (makes AI depth visible to judges)

**Tier 3 — Wow / polish (LinkedIn 25% + UX 20%):**
16. Side-by-side candidate comparison
17. One-click interview-kit export (PDF)
18. Interview-note summarizer → maps evidence to requirements
19. Standardized evaluation report
20. Preloaded sample dataset → instant demo, zero setup
21. Polished dashboard, dark/light, animated score reveals

## 4. AI architecture (rubric: 25%) — the agent pipeline

A multi-step agent, each step emitting **structured JSON** and recording the inputs it used:

- **JD Analyzer** → `{ mustHaves[], niceToHaves[], seniority, responsibilities[] }`
- **Resume Extractor** → per resume `{ skills[], years, roles[], projects[], education[] }` + source spans
- **Matcher / Scorer** → per candidate: dimension scores + overall, each with `evidence[]` (cited snippets), `reasoning`, `confidence`, `flags[]`
- **Interview-Kit Generator** → role+candidate questions, follow-ups, probe areas
- **Pool Q&A (retrieval-lite)** → NL answers over structured profiles + resume text, with citations
- **Evaluator** → post-interview: summarize notes, map evidence → requirements, gaps, recommendation

Cross-cutting: **Blind transform** (pre-processing), **confidence flags** (human-in-the-loop),
**audit log** (every output records the inputs + model used).

**Provider:** Claude via `@anthropic-ai/sdk` (browser mode) using a user-supplied key stored
locally. **Demo Mode** ships cached, realistic outputs so the demo is flawless offline and for
judges without a key. Both sit behind one `agent` interface so the code shows real integration.

## 5. Data model

```
Job        { id, title, rawText, structured }
Candidate  { id, name, rawText, blindText, profile, sources }
Score      { candidateId, dimensions, overall, evidence[], reasoning, confidence, flags[] }
InterviewKit { candidateId, questions[], followUps[], probeAreas[] }
Evaluation { candidateId, notes, mappedEvidence[], gaps[], recommendation }
AuditEntry { insightId, type, inputsUsed[], model, timestamp }
```

## 6. Screens / UX flow

1. **Setup** — upload JD + resumes, or "Load sample dataset"
2. **Shortlist dashboard** — ranked leaderboard, filters, Blind Mode toggle, bias-delta banner
3. **Candidate detail** — profile, score breakdown w/ "why?" evidence, interview kit, audit trail
4. **Compare** — side-by-side candidates
5. **Ask the Pool** — chat with citations
6. **Evaluate** — paste interview notes → evaluation report
7. **Agent trace** — live reasoning drawer
8. **Settings** — API key, demo mode

## 7. Tech stack

Vite + React + TypeScript · Tailwind + shadcn/ui · lucide-react · framer-motion · recharts ·
Zustand (state) + localStorage · `@anthropic-ai/sdk` (browser) · pdfjs-dist (resume parsing) ·
jsPDF (exports). Deploy: Vercel/Netlify (shareable URL for LinkedIn).

## 8. Build plan (solo, phased vertical slices)

- **Phase 0** — Scaffold, design system, sample dataset (JD + ~10 resumes)
- **Phase 1** — Setup → extraction + JD analysis → ranked shortlist + cards *(demo-complete core loop)*
- **Phase 2** — Candidate detail: glass-box "why?" + audit trail + interview kit
- **Phase 3** — Blind Mode + bias-delta + live agent trace *(the differentiators)*
- **Phase 4** — Ask-the-pool + compare + evaluation report *(stretch)*
- **Phase 5** — Polish, animation, deploy, LinkedIn assets

## 9. LinkedIn content plan (rubric: 25%)

- **Brand kit** (logo, colors) + **launch carousel** (problem → glass-box → blind mode → results)
  + **demo GIF** (blind-mode toggle reshuffling the ranking) — all via the design skills.
- **Post 1 (hook):** "Is AI hiring biased? I built one that shows its work — solo."
- **Post 2 (build-in-public):** architecture breakdown.
- **Post 3 (demo):** walkthrough video + shareable link + a question to drive comments.
- Cross-post to HR / recruiting / AI communities; add a poll; reply fast to seed engagement.

## 10. Demo script (60–90s)

Load sample → watch the agent extract & score 10 resumes with citations (trace panel) →
open top candidate, "why 91%?" evidence → toggle **Blind Mode**, ranking reshuffles + bias-delta →
generate & export interview kit → ask the pool "who has fintech + team-lead experience?" → share link.
