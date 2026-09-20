# HireFlow ML API (`api/`)

A real **scikit-learn** matching model, served as a **Vercel Python serverless function**
(and runnable locally as a plain Flask app). This is HireFlow's Python ML engine — no API key,
runs offline.

**Model** (`ml.py`): TF-IDF vectorization (word 1–2 grams) + cosine similarity.
- **Requirement coverage** — each job requirement is matched against the candidate's resume
  sentences; the best-matching sentence is returned as cited evidence.
- **Overall fit** — cosine similarity between the whole resume and the whole JD.
- Structured features (skills overlap, years, seniority) layer on top.

## On Vercel (automatic)

Deploying the repo to Vercel picks up `api/index.py` as a serverless function (Python 3.12,
deps from `api/requirements.txt`). `vercel.json` routes `/api/*` to it, so the frontend calls
it **same-origin at `/api`** — no separate host, no CORS. In the live app, turn on
**Settings → Python ML engine** (its URL defaults to `/api` in production).

## Local dev

```bash
pip install -r api/requirements.txt
python api/index.py            # serves http://localhost:8077
```

Then in the web app: **Settings → Python ML engine → on** (URL defaults to
`http://localhost:8077` in dev). If the server is unreachable, the app falls back to its
built-in local engine automatically.

## Endpoints

Same handler under either prefix (`/score` locally, `/api/score` on Vercel):
`/health`, `/analyze-job`, `/extract`, `/score`, `/interview-kit`, `/ask-pool`, `/evaluate`.

*Upgrade path: swap `TfidfVectorizer` for sentence-transformer embeddings in `ml.py` — the
interface stays identical. (Not used here because it needs `torch`, which is heavier than
Vercel's serverless size limit.)*
