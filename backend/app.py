"""
HireFlow ML API — Flask service exposing the scikit-learn matching model.

Run:  pip install -r requirements.txt  &&  python app.py
Serves on http://localhost:8077 . The frontend calls these endpoints when the
"Python ML engine" toggle is on (Settings), and falls back to its local engine
if this server is unreachable.
"""
from flask import Flask, request, jsonify
from flask_cors import CORS

import ml

app = Flask(__name__)
CORS(app)  # allow the browser app (localhost / Vercel) to call this API


@app.get("/health")
def health():
    return jsonify({"status": "ok", "engine": "scikit-learn", "method": "tfidf+cosine", "model": "TfidfVectorizer(1,2-gram) + cosine similarity"})


@app.post("/analyze-job")
def analyze_job():
    job = request.get_json(force=True)["job"]
    return jsonify(ml.analyze_job(job.get("title", ""), job["rawText"]))


@app.post("/extract")
def extract():
    cand = request.get_json(force=True)["candidate"]
    return jsonify(ml.extract_profile(cand["rawText"]))


@app.post("/score")
def score():
    body = request.get_json(force=True)
    return jsonify(ml.score_candidate(body["job"], body["candidate"]))


@app.post("/interview-kit")
def kit():
    body = request.get_json(force=True)
    return jsonify(ml.interview_kit(body["job"], body["candidate"], body.get("score", {})))


@app.post("/ask-pool")
def pool():
    body = request.get_json(force=True)
    return jsonify(ml.ask_pool(body["job"], body["candidates"], body["question"]))


@app.post("/evaluate")
def evaluate():
    body = request.get_json(force=True)
    return jsonify(ml.evaluate(body["job"], body["candidate"], body["notes"]))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8077, debug=False)
