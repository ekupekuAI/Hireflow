# HireFlow ML backend

A real **scikit-learn** matching model served over HTTP — the "AI core" for HireFlow's
Python ML engine. No API key, runs offline.

**Model:** TF-IDF vectorization (word 1–2 grams) + cosine similarity.
- **Requirement coverage** — each job requirement is matched against the candidate's
  resume sentences; the best-matching sentence is returned as cited evidence.
- **Overall fit** — cosine similarity between the whole resume and the whole JD.
- Structured features (skills overlap, years, seniority) layer on top.

*Interpretable and fast. Upgrade path: swap `TfidfVectorizer` for sentence-transformer
embeddings in `ml.py` — the API stays identical.*

## Run

```bash
cd backend
python -m venv .venv
# Windows:  .venv\Scripts\activate      macOS/Linux:  source .venv/bin/activate
pip install -r requirements.txt
python app.py            # serves http://localhost:8077
```

Then in the HireFlow web app: **Settings → Python ML engine → on** (URL defaults to
`http://localhost:8077`). Run a screening — scoring, evidence, interview kits, pool
search and evaluations now come from this model. If the server is down, the app falls
back to its built-in local engine automatically.

## Endpoints

| Method | Path | Body → Result |
|---|---|---|
| GET | `/health` | engine status |
| POST | `/analyze-job` | `{job}` → structured requirements |
| POST | `/extract` | `{candidate}` → resume profile |
| POST | `/score` | `{job, candidate}` → scored candidate + cited evidence |
| POST | `/interview-kit` | `{job, candidate, score}` → interview questions |
| POST | `/ask-pool` | `{job, candidates, question}` → answer + citations |
| POST | `/evaluate` | `{job, candidate, notes}` → evaluation report |

## Deploy (optional)

Any Python host works — Render, Railway, Fly.io, or Hugging Face Spaces. Start command:
`gunicorn app:app` (add `gunicorn` to requirements) or `python app.py`. Then set the web
app's `VITE_ML_API_URL` to the deployed URL.
