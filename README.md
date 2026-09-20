<div align="center">

# 🟣 HireFlow

### *The AI screener that shows its work.*

A **glass-box, bias-aware AI recruiting agent**. Upload a job description and resumes →
get an **evidence-cited** ranked shortlist, auto-generated interview kits, natural-language
Q&A over the candidate pool, and a **Blind Mode** that reveals hiring bias — with a human
in the loop the whole way.

*Built for the AI Agent Hackathon 2026 · Problem Statement 3*

</div>

---

## ✨ Why it's different

Most AI screeners are black boxes. HireFlow is built on one principle: **every machine
judgment must be auditable.**

- 🔍 **Glass-box scoring** — every score cites the exact resume snippet behind it
- 🛡️ **Blind Mode** — strips name / gender / age / school and shows *how the ranking changed*, surfacing bias
- 🧠 **Live agent trace** — watch the multi-step agent extract, match, and score in real time
- 🎯 **Interview kits** — tailored questions that probe real depth and known gaps
- 💬 **Ask the pool** — natural-language search across all candidates, with citations
- 📋 **Standardized evaluations** — map interview notes back to requirements
- 🧾 **Full audit trail** — every insight traces back to its inputs and model

## ✅ Problem Statement 3 — full coverage

| # | Requirement | Where |
|---|---|---|
| 1 | Upload a job description and candidate resumes | Setup screen (sample / paste / `.txt` upload) |
| 2 | Extract skills, experience, projects, qualifications | Resume Extractor → candidate profile |
| 3 | Map candidate experience against job requirements | Matcher/Scorer → 4 weighted dimensions |
| 4 | Identify missing / unclear information to validate | "Info to validate" flags + gaps |
| 5 | **Group candidates by relevant experience & requirements** | Shortlist → **Grouped by fit** tiers |
| 6 | Generate structured candidate summaries | Candidate cards + detail view |
| 7 | Role-specific interview questions per candidate | Interview-kit generator |
| 8 | Follow-up questions for deeper validation | Kit follow-ups + evaluation follow-ups |
| 9 | Summarize interview notes, map evidence to requirements | Evaluate → requirement coverage |
| 10 | Identify unanswered evaluation areas | Evaluate → "still unproven" |
| 11 | Standardized interview evaluation report | Evaluate report + **PDF export** |
| 12 | Query the candidate pool in natural language | Ask-the-Pool (cited answers) |
| 13 | Audit trail of information used per insight | Audit log + per-candidate audit tab |

Plus the differentiators: **glass-box evidence**, **Blind Mode + bias-delta**, and a **live agent trace**.

## 🚀 Run it

```bash
npm install
cp .env.example .env   # then add your own Supabase URL + publishable key
npm run dev
```

> No keys? No problem — the app runs fully on its local engine without any `.env`.

Open the printed URL, then click **"Load sample & run"** — a full role + 10 resumes screen
in seconds. Zero setup, no API key required (it ships with a local engine).

### Turn on real Claude AI (optional)

Click the ⚙️ **Settings** gear → toggle **Live AI** → paste an Anthropic API key and pick a
model (defaults to Claude Opus 5). Without a key, HireFlow runs its **local Demo engine**,
which fully works on any resume you paste or upload.

## 🧩 Architecture

```
                 ┌────────────────────────────────────────────┐
  JD + resumes → │  Agent pipeline (src/lib/agent)             │
                 │   JD Analyzer → Resume Extractor →          │
                 │   Matcher/Scorer → Interview-Kit Gen →      │
                 │   Pool Q&A → Evaluator                      │
                 └────────────────────────────────────────────┘
                        │ structured JSON + cited evidence
                        ▼
        Zustand store (orchestration, trace, audit, bias-delta)
                        ▼
             React + Tailwind + shadcn-style UI
```

Three interchangeable engines behind one interface (`AgentProvider`), selected in Settings
(priority: Python ML → Live Claude → local Demo; each degrades gracefully to the local engine):

| Engine | Where | What it does |
|---|---|---|
| **Python ML** | `backend/` (FastAPI-style Flask) | A real **scikit-learn** model — TF-IDF vectorization + cosine similarity for semantic resume↔JD matching, with best-sentence retrieval as cited evidence. Runs offline, no API key. |
| **Demo** (default) | `src/lib/agent/demo.ts` | A local TypeScript heuristic engine — extract, match, score, cite. Works with zero setup. |
| **Live** | `src/lib/agent/claude.ts` | Calls Claude via the Anthropic SDK for LLM-grade reasoning, with automatic fallback. |

**Tech:** Vite · React · TypeScript · Tailwind CSS · Zustand · framer-motion · lucide-react ·
**Supabase** (Postgres) · **Python + scikit-learn** (ML backend) · `@anthropic-ai/sdk` · jsPDF (lazy-loaded).

**Python ML backend:** see [`backend/README.md`](backend/README.md) — `pip install -r requirements.txt && python app.py`, then enable **Settings → Python ML engine**.

## ☁️ Cloud persistence (Supabase) — already wired

Every screening is saved to **Supabase Postgres** and reloadable from the setup screen. Setup is 3 steps:

1. **Create the table.** Open your Supabase project → **SQL Editor** → paste [`supabase/schema.sql`](supabase/schema.sql) → **Run**. (One `screenings` table + RLS policies.)
2. **Add your keys** to `.env` (copy `.env.example`): your Supabase URL + publishable key from the project's API settings. Never commit real keys — `.env` is gitignored.
3. **Done** — run a screening; it appears under "Recent screenings" and persists across reloads/devices.

If the table or keys are missing, the app silently falls back to local-only mode — it never breaks.

## 🚀 Deploy (Vercel / Netlify)

```bash
npm run build   # → dist/
```

Deploy `dist/` as a static site. Set two env vars in your host (from your Supabase
project's API settings): `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

**Hardening for real production:** move the Claude key off the browser into a **Supabase Edge
Function** proxy (holds `ANTHROPIC_API_KEY` server-side), add **Supabase Auth** for recruiter
accounts, and scope the RLS policies in `schema.sql` to `auth.uid()`.

## ⚖️ Responsible use

HireFlow **assists** screening; it does not decide. Blind Mode, confidence flags, "info to
validate," and the audit trail all exist to keep a human accountable for every hiring decision.

## 📄 License

MIT — built for a hackathon, free to learn from.
