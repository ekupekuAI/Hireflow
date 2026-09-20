# 🎤 HireFlow — Pitch Guide

> **One-liner:** *HireFlow is the AI recruiting agent that screens resumes, writes the interview,
> and shows its work — so hiring teams move faster without handing judgment to a black box.*

---

## ⏱️ 30-second elevator pitch

> "Recruiters drown in resumes and still hire inconsistently. HireFlow reads a job description and
> a stack of resumes, then produces a ranked, **evidence-cited** shortlist — every score links to the
> exact line in the resume that justifies it. It writes tailored interview questions, answers plain-English
> questions about your whole candidate pool, and turns interview notes into a standardized scorecard.
> And with one toggle — **Blind Mode** — it strips names, gender and school and shows you how your ranking
> changes, so you can *see* bias instead of hoping it isn't there. The human still decides; HireFlow just
> makes the decision faster and defensible."

---

## 🔥 The problem (open with this)

- Every open role gets **hundreds of resumes**. Recruiters skim; signal gets missed.
- Screening is **inconsistent** — different reviewers weigh things differently, and bias creeps in.
- Interviewers **waste prep time** writing questions and reformatting notes.
- Most AI screeners are **black boxes** — you can't trust a score you can't see the reason for, and "AI bias in hiring" is now a legal and reputational risk.

**The tension:** teams want AI's speed but can't hand life-changing decisions to something unexplainable.

## 💡 The solution

HireFlow is an **agentic** recruiting assistant that keeps the human in charge:

1. Upload a JD + resumes → the agent **extracts** skills, experience, projects, qualifications.
2. It **maps** each candidate to the role's real requirements and produces a **ranked, grouped** shortlist.
3. Every score is **glass-box** — click "why?" and see the exact cited resume snippet.
4. It **writes interview kits** (questions + follow-ups) and **answers pool questions** in natural language.
5. After the interview, it **maps your notes to requirements** and generates a standardized report.
6. **Blind Mode** reveals bias; a **full audit trail** records what evidence drove every insight.

---

## 🎬 Live demo script (90 seconds — rehearse this)

1. **"Zero setup."** Click **Load sample & run**. → 10 resumes screened in seconds. *(Point at the live agent trace: "that's the agent extracting, matching, and scoring — you can watch it reason.")*
2. **"It ranks and groups."** Toggle **Grouped by fit** → Strong / Potential / Not a fit.
3. **"It shows its work."** Open the top candidate → **Score & evidence** → "Every number is backed by a quote from the resume — no black box."
4. **The money moment — "Is it fair?"** Toggle **Blind Mode** → *"Watch the ranking reshuffle. It removed name, gender and school — and this candidate dropped two places. That's prestige bias, made visible."*
5. **"It preps the interview."** Interview kit tab → **Generate** → export PDF.
6. **"Ask anything."** Ask-the-Pool → *"Who has fintech + team-lead experience?"* → answer with citations.
7. **"And it's real."** Mention: saved to Supabase, deployable, live URL.

> End on: **"Faster screening, a written interview, and a fairness check — with a human deciding every time."**

## 🏆 Why it wins (differentiators)

- **Glass-box, not black box** — evidence citations on every score. Judges & recruiters trust what they can inspect.
- **Blind Mode + bias-delta** — turns "is AI hiring fair?" from a worry into a feature. This is the shareable, memorable moment.
- **Genuinely agentic** — a multi-step pipeline (analyze → extract → score → interview → evaluate → query) with a visible reasoning trace, not a single chatbot call.
- **Human-in-the-loop by design** — confidence flags, "info to validate," and "the decision stays with you."
- **Production-real** — Supabase persistence, clean architecture, deployable today.

## 📊 Impact (say the numbers)

- Cuts first-pass screening from **hours to minutes** per role.
- **Consistent** scoring rubric across every candidate and every reviewer.
- **Defensible** hiring: an audit trail + fairness check for every decision.

## 🗺️ Roadmap (when asked "what's next")

- Supabase Auth + team workspaces; ATS integrations (Greenhouse, Lever).
- Claude API proxied via Supabase Edge Function for secure server-side AI.
- Resume PDF parsing at upload; bulk import; scheduled re-ranking.
- Bias analytics dashboard across roles over time.

## 🛡️ Responsible-AI answer (have this ready)

> "HireFlow never auto-rejects anyone. It surfaces evidence and flags what to verify; a human makes
> the call. Blind Mode and the audit trail exist specifically to keep hiring fair and accountable."

## 🤔 Tough-question prep

- **"How is this different from ChatGPT + a resume?"** → It's a stateful, multi-step agent with cited evidence, bias tooling, an audit trail, and persistence — not a one-shot prompt.
- **"Is the AI accurate?"** → Scores are transparent and evidence-backed, so a recruiter can verify each one in seconds — accuracy you can *check*, not just trust.
- **"What about privacy / bias liability?"** → Blind Mode, confidence flags, and the audit trail are built for exactly this.
- **"Does it work without an API key?"** → Yes — a local engine runs the full flow offline; live Claude is an upgrade toggle.
- **"Is it real or a mockup?"** → It's a working app: `npm run dev`, saved to Supabase, deployable to a URL.

## 🧱 Tech (one slide)

Vite + React + TypeScript + Tailwind · Zustand · Supabase (Postgres) · Anthropic Claude (with a local
fallback engine) · deployable to Vercel/Netlify. Clean provider abstraction so live AI and the local
engine are interchangeable.
