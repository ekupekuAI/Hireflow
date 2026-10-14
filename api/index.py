"""
HireFlow ML API — Flask app exposed as a Vercel Python serverless function.

- On Vercel: this file is deployed as a function; requests to /api/* are routed here
  (see vercel.json). The frontend calls it same-origin at /api/... (no CORS).
- Locally: run `python api/index.py` to serve on http://localhost:8077 and the
  frontend calls http://localhost:8077/... .

A single catch-all keys off the last path segment, so it works under either prefix
("/score" locally, "/api/score" on Vercel). The model itself lives in ml.py
(scikit-learn TF-IDF + cosine similarity).
"""
import os
import sys

from flask import Flask, request, jsonify
from flask_cors import CORS

# Make the sibling ml.py importable regardless of the working directory
# (Vercel runs functions from the project root, not from api/).
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ml  # noqa: E402

app = Flask(__name__)
# Resumes are plain text; cap request bodies so one call can't exhaust the function.
app.config["MAX_CONTENT_LENGTH"] = 2 * 1024 * 1024
CORS(app)


def _dispatch(endpoint):
    if request.method == "GET" or endpoint in ("", "health", "api", "index"):
        return jsonify({
            "status": "ok",
            "engine": "scikit-learn",
            "method": "tfidf+cosine",
            "model": "TfidfVectorizer(1,2-gram) + cosine similarity",
        })

    body = request.get_json(force=True, silent=True) or {}
    try:
        return _route(endpoint, body)
    except (KeyError, TypeError, AttributeError) as e:
        # Malformed input is the caller's fault: answer 400 instead of crashing with 500.
        return jsonify({"error": "bad request", "detail": f"missing or invalid field: {e}"}), 400


def _route(endpoint, body):
    if endpoint == "analyze-job":
        job = body["job"]
        return jsonify(ml.analyze_job(job.get("title", ""), job["rawText"]))
    if endpoint == "extract":
        return jsonify(ml.extract_profile(body["candidate"]["rawText"]))
    if endpoint == "score":
        return jsonify(ml.score_candidate(body["job"], body["candidate"]))
    if endpoint == "interview-kit":
        return jsonify(ml.interview_kit(body["job"], body["candidate"], body.get("score", {})))
    if endpoint == "ask-pool":
        return jsonify(ml.ask_pool(body["job"], body["candidates"], body["question"]))
    if endpoint == "evaluate":
        return jsonify(ml.evaluate(body["job"], body["candidate"], body["notes"]))

    return jsonify({"error": "unknown endpoint", "endpoint": endpoint}), 404


@app.route("/", defaults={"path": ""}, methods=["GET", "POST"])
@app.route("/<path:path>", methods=["GET", "POST"])
def catch_all(path):
    endpoint = path.rstrip("/").rsplit("/", 1)[-1] or "health"
    return _dispatch(endpoint)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "8077")), debug=False)
