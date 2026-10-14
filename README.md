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
model (defaults to Claude Opus 5.5). Without a key, HireFlow runs its **local Demo engine**,
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
| **Python ML** | `api/` (Flask; Vercel serverless) | A real **scikit-learn** model — TF-IDF vectorization + cosine similarity for semantic resume↔JD matching, with best-sentence retrieval as cited evidence. Runs offline, no API key. |
| **Demo** (default) | `src/lib/agent/demo.ts` | A local TypeScript heuristic engine — extract, match, score, cite. Works with zero setup. |
| **Live** | `src/lib/agent/claude.ts` | Calls Claude via the Anthropic SDK for LLM-grade reasoning, with automatic fallback. |

**Tech:** Vite · React · TypeScript · Tailwind CSS · Zustand · framer-motion · lucide-react ·
**Supabase** (Postgres) · **Python + scikit-learn** (ML backend) · `@anthropic-ai/sdk` · jsPDF (lazy-loaded).

**Python ML backend:** see [`api/README.md`](api/README.md). Local: `pip install -r api/requirements.txt && python api/index.py` (serves `http://localhost:8077`), then enable **Settings → Python ML engine**. On Vercel it deploys automatically as a serverless function at `/api` (same project, same origin).

## ☁️ Cloud persistence (Supabase) — already wired

Every screening is saved to **Supabase Postgres** and reloadable from the setup screen. Setup is 3 steps:

1. **Create the table.** Open your Supabase project → **SQL Editor** → paste [`supabase/schema.sql`](supabase/schema.sql) → **Run**. (One `screenings` table, owned per user, with RLS scoped to `auth.uid()`. Re-running it upgrades the old public table.)
2. **Enable anonymous sign-ins:** Authentication → Sign In / Providers → **Allow anonymous sign-ins**. Each browser gets its own private workspace — nobody else can list, open or delete its screenings.
3. **Add your keys** to `.env` (copy `.env.example`): your Supabase URL + anon/publishable key from Project Settings → API. Never commit real keys — `.env` is gitignored.
4. **Done** — run a screening; it appears under "Recent screenings", and interview kits / evaluations you add later are saved into it too.

If the table, keys or anonymous sign-in are missing, the app keeps working locally and shows a short notice explaining what to enable.

| Env var | Required | Where to get it |
|---|---|---|
| `VITE_SUPABASE_URL` | for cloud save | Supabase → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | for cloud save | Supabase → Project Settings → API → anon / publishable key |
| `VITE_ML_API_URL` | no | Only to override the ML backend URL (defaults: `http://localhost:8077` dev, `/api` prod) |

The Anthropic key for Live AI is entered per user in ⚙️ Settings (stored in that browser only) — it is deliberately not an env var, because `VITE_*` values ship in the public bundle.

## 🚀 Deploy (Vercel / Netlify)

```bash
npm run build   # → dist/
```

On **Vercel**, importing this repo deploys **both** the Vite frontend *and* the Python ML model:
`api/index.py` is picked up as a serverless function (deps from `api/requirements.txt`) and served at
`/api` on the same origin (see `vercel.json`). No separate backend host, no CORS. Then turn on
**Settings → Python ML engine** on the live site — its URL defaults to `/api` in production.

Set two env vars in your host (from your Supabase project's API settings):
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

**Hardening for real production:** move the Claude key off the browser into a **Supabase Edge
Function** proxy (holds `ANTHROPIC_API_KEY` server-side), and swap anonymous sign-in for real
recruiter accounts (email / SSO) so a workspace follows the user across devices.

## 🔧 Fixes in this version

- **Data isolation:** saved screenings (candidate PII) were readable and deletable by anyone holding the public anon key. Rows are now owned per user with RLS on `auth.uid()` (anonymous auth per browser).
- **Blind Mode leaks:** the candidate detail, Compare, Evaluate and Ask-the-Pool views showed real names, unredacted resumes and non-blind scores. They now stay blinded.
- **JD parsing:** when "About the role" came before "Required", nice-to-have skills came out empty and every bullet was treated as a responsibility. Sections are now split correctly.
- **Interview evaluation:** "Did not demonstrate X" was marked as *Met*, and loose substring matching meant "go" matched "good". Notes are now judged sentence by sentence, with negation and whole-word matching.
- **Silent failures:** errors were stored but never shown, and Live AI / ML fallbacks were invisible (a bad API key gave no feedback). Both now surface as a dismissible banner; spinners no longer stick on error.
- **Navigation:** there was no way back to start a new screening, and on phones the nav and Blind toggle were hidden. Added a New-screening button, a mobile nav bar and a header that fits phone widths.
- **Cloud sync:** kits and evaluations made after a screening were never saved, so reloading lost them.
- **Misc:** outdated Claude model IDs (old saved settings are migrated); the Python API now loads `ml.py` reliably on Vercel and returns 400 on malformed input instead of 500; removed the unused `VITE_ANTHROPIC_API_KEY`.

## ⚖️ Responsible use

HireFlow **assists** screening; it does not decide. Blind Mode, confidence flags, "info to
validate," and the audit trail all exist to keep a human accountable for every hiring decision.

## 📄 License

MIT — built for a hackathon, free to learn from.
