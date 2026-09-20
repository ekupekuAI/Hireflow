"""
HireFlow ML core — a real scikit-learn matching model.

Approach: TF-IDF vectorization (word 1-2 grams) + cosine similarity.
- Requirement coverage: each job requirement is matched semantically against the
  candidate's resume sentences; the best-matching sentence becomes cited evidence.
- Overall fit: cosine similarity between the whole resume and the whole JD.
- Skill/experience/seniority signals add structured features on top.

This is a classic, interpretable ML matcher — no API key, runs offline.
(Upgrade path: swap TfidfVectorizer for sentence-transformer embeddings; the
interface below stays identical.)
"""
import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

CURRENT_YEAR = 2026

SKILL_ALIASES = {
    "Python": ["python", "py", "django", "flask", "fastapi", "pandas", "numpy"],
    "JavaScript": ["javascript", "js", "es6", "node", "nodejs", "node.js"],
    "TypeScript": ["typescript", "ts"],
    "React": ["react", "react.js", "reactjs", "next.js", "nextjs"],
    "Java": ["java", "spring", "spring boot"],
    "Go": ["golang", "go"],
    "C++": ["c++", "cpp"],
    "SQL": ["sql", "postgres", "postgresql", "mysql", "sqlite"],
    "NoSQL": ["mongodb", "dynamodb", "cassandra", "redis", "nosql"],
    "AWS": ["aws", "amazon web services", "ec2", "s3", "lambda", "cloudformation"],
    "GCP": ["gcp", "google cloud", "bigquery"],
    "Azure": ["azure"],
    "Docker": ["docker", "container"],
    "Kubernetes": ["kubernetes", "k8s"],
    "CI/CD": ["ci/cd", "jenkins", "github actions", "gitlab ci", "circleci"],
    "Terraform": ["terraform", "infrastructure as code", "iac"],
    "Machine Learning": ["machine learning", "ml", "scikit", "sklearn", "xgboost"],
    "Deep Learning": ["deep learning", "pytorch", "tensorflow", "keras", "neural network"],
    "NLP": ["nlp", "natural language", "llm", "transformers", "hugging face"],
    "Data Engineering": ["etl", "airflow", "spark", "kafka", "data pipeline", "data engineering"],
    "REST APIs": ["rest", "restful", "api", "apis", "graphql", "grpc"],
    "Microservices": ["microservice", "microservices", "distributed systems"],
    "Testing": ["unit test", "pytest", "jest", "testing", "tdd", "cypress"],
    "System Design": ["system design", "architecture", "scalab", "high availability"],
    "Leadership": ["led", "lead", "mentored", "managed", "team lead", "tech lead", "manager"],
    "Agile": ["agile", "scrum", "kanban", "sprint"],
    "Security": ["security", "oauth", "encryption", "penetration", "owasp"],
    "Product Sense": ["product", "stakeholder", "roadmap", "user research"],
    "Communication": ["communication", "presentation", "documentation", "cross-functional"],
}

DOMAIN_ALIASES = {
    "Fintech": ["fintech", "payments", "banking", "trading", "financial"],
    "Healthcare": ["healthcare", "health", "medical", "clinical", "hospital"],
    "Ecommerce": ["ecommerce", "e-commerce", "retail", "marketplace", "checkout"],
    "AI/ML": ["ai", "machine learning", "ml platform", "recommendation"],
    "SaaS": ["saas", "b2b", "enterprise software"],
    "Gaming": ["gaming", "game", "unity", "unreal"],
    "Logistics": ["logistics", "supply chain", "delivery", "fleet"],
    "EdTech": ["edtech", "education", "learning platform"],
}

_re_cache = {}


def _alias_re(alias):
    # Match the alias as a whole token: boundaries are non-alphanumeric, so
    # "aws" matches "AWS." and "AWS)" but not "awsome"; "node.js" still matches
    # (its own dot is inside the alias, not a boundary).
    esc = re.escape(alias.strip())
    return re.compile(r"(?<![a-z0-9])" + esc + r"(?![a-z0-9])", re.I)


def has_alias(text, alias):
    r = _re_cache.get(alias)
    if r is None:
        r = _alias_re(alias)
        _re_cache[alias] = r
    return bool(r.search(text))


def detect_skills(text):
    return [s for s, al in SKILL_ALIASES.items() if any(has_alias(text, a) for a in al)]


def detect_domains(text):
    return [d for d, al in DOMAIN_ALIASES.items() if any(has_alias(text, a) for a in al)]


def sentences(text):
    parts = re.split(r"[\n\r]+|(?<=[.;])\s+", text)
    return [p.strip(" -•*\t") for p in parts if len(p.strip()) > 3]


def years_from_text(text):
    ex = [int(m) for m in re.findall(r"(\d{1,2})\+?\s*years", text, re.I)]
    ex = [y for y in ex if 0 < y < 45]
    if ex:
        return min(max(ex), 45)
    yrs = [int(y) for y in re.findall(r"\b(20\d{2})\b", text)]
    if yrs:
        mx = CURRENT_YEAR if re.search(r"present|current", text, re.I) else max(yrs)
        return min(mx - min(yrs), 45)
    return 0


def seniority(text):
    t = text.lower()
    if re.search(r"principal|staff", t):
        return "Staff/Principal"
    if re.search(r"senior|sr\.", t):
        return "Senior"
    if re.search(r"lead|manager", t):
        return "Lead"
    if re.search(r"junior|jr\.|intern|graduate", t):
        return "Junior"
    return "Mid"


ROLE_RE = re.compile(r"engineer|developer|scientist|manager|architect|lead|analyst|intern|consultant", re.I)
EDU_RE = re.compile(r"b\.?s\.?|b\.?tech|b\.?eng|m\.?s\.?|ph\.?d|bachelor|master|university|college|institute|iit|nit", re.I)
PROJ_RE = re.compile(r"built|designed|architected|led|developed|implemented|created|owned|migrat|optimi", re.I)


def _search(text, pat):
    m = re.search(pat, text, re.I)
    return m.start() if m else -1


def extract_profile(text):
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    skills = detect_skills(text)
    domain = detect_domains(text)
    yrs = years_from_text(text)
    roles = []
    for l in lines:
        if ROLE_RE.search(l) and (l.startswith("-") or re.search(r"\d{4}", l) or "," in l):
            r = re.split(r"[,(]", l.lstrip("-•* "))[0].strip()
            if 3 < len(r) < 60 and r not in roles:
                roles.append(r)
    roles = roles[:5]
    projects = [l.lstrip("-•* ")[:180] for l in lines if PROJ_RE.search(l)][:5]
    education = [l.lstrip("-•* ") for l in lines if EDU_RE.search(l)][:3]
    summary = ""
    for i, l in enumerate(lines):
        if re.match(r"summary", l, re.I) and i + 1 < len(lines):
            summary = lines[i + 1]
            break
    if not summary:
        summary = next((l for l in lines if len(l) > 40), lines[1] if len(lines) > 1 else (lines[0] if lines else ""))
    return {
        "skills": skills, "yearsExperience": yrs, "roles": roles, "projects": projects,
        "education": education, "domain": domain, "summary": summary[:240],
    }


def analyze_job(title, text):
    low = text.lower()
    req_i = _search(low, r"required|must have|qualifications")
    nice_i = _search(low, r"nice to have|preferred|bonus")
    resp_i = _search(low, r"responsibilities|what you.ll do|the role")
    end_req = nice_i if nice_i >= 0 else (resp_i if resp_i >= 0 else len(text))
    req_text = text[req_i:end_req] if req_i >= 0 else text
    nice_text = text[nice_i:(resp_i if resp_i >= 0 else len(text))] if nice_i >= 0 else ""
    resp_text = text[resp_i:] if resp_i >= 0 else ""
    must = detect_skills(req_text)
    nice = [s for s in detect_skills(nice_text) if s not in must]
    m = re.search(r"(\d{1,2})\+?\s*years", req_text, re.I)
    min_years = int(m.group(1)) if m else 3
    resp = [l.lstrip("-•* ") for l in resp_text.split("\n") if re.match(r"\s*[-•*]", l)][:6]
    return {
        "mustHaves": must, "niceToHaves": nice, "seniority": seniority(title + " " + req_text),
        "minYears": min_years, "responsibilities": resp, "domain": detect_domains(text),
    }


# ---------------- the ML model: TF-IDF + cosine ----------------

def _vectorize(texts):
    vec = TfidfVectorizer(lowercase=True, ngram_range=(1, 2), stop_words="english", min_df=1)
    return vec.fit_transform(texts)


def _coverage(reqs, sents):
    """For each requirement, the best semantically-matching resume sentence."""
    if not reqs or not sents:
        return 0.0, []
    X = _vectorize(reqs + sents)
    R, S = X[:len(reqs)], X[len(reqs):]
    sims = cosine_similarity(R, S)
    evidence, maxes = [], []
    for i, req in enumerate(reqs):
        j = int(np.argmax(sims[i]))
        m = float(sims[i][j])
        maxes.append(m)
        if m > 0.05:
            evidence.append({"claim": f"{req} (required)", "snippet": sents[j][:220], "_m": m})
    evidence.sort(key=lambda e: -e["_m"])
    for e in evidence:
        e.pop("_m", None)
    return (float(np.mean(maxes)) if maxes else 0.0), evidence


def _doc_similarity(a, b):
    try:
        X = _vectorize([a, b])
        return float(cosine_similarity(X[0], X[1])[0][0])
    except Exception:
        return 0.0


def _clamp(x):
    return int(max(0, min(100, round(x))))


def score_candidate(job, candidate):
    jt = job["rawText"]
    js = job.get("structured") or analyze_job(job.get("title", ""), jt)
    ctext = candidate["rawText"]
    profile = candidate.get("profile") or extract_profile(ctext)
    csents = sentences(ctext)

    must, nice = js["mustHaves"], js["niceToHaves"]
    matched_must = [s for s in must if s in profile["skills"]]
    missing_must = [s for s in must if s not in profile["skills"]]
    matched_nice = [s for s in nice if s in profile["skills"]]
    kw = (len(matched_must) / len(must)) if must else 0.5
    cov, evidence = _coverage(must if must else [job.get("title", "role")], csents)
    skills_score = _clamp(0.6 * kw * 100 + 0.4 * cov * 100)

    exp_score = _clamp((profile["yearsExperience"] / max(1, js["minYears"])) * 80 + 20)

    sim = _doc_similarity(jt, ctext)
    dom_overlap = [d for d in js["domain"] if d in profile["domain"]]
    domain_score = _clamp(sim * 70 + (30 if dom_overlap else 0))

    has_lead = ("Leadership" in profile["skills"]) or bool(re.search(r"mentor|led a team|managed", ctext, re.I))
    sen_match = 100 if js["seniority"] == seniority(ctext) else (75 if re.search(r"senior|staff|principal|lead", ctext, re.I) else 55)
    sen_score = _clamp(sen_match * 0.7 + (30 if has_lead else 10))

    exp_ev = [{"claim": f"{profile['yearsExperience']} yrs experience (role asks {js['minYears']}+)", "snippet": profile["summary"]}] if profile["summary"] else []
    dims = [
        {"name": "Skills match", "score": skills_score, "weight": 0.35,
         "reasoning": f"Matches {len(matched_must)}/{len(must)} required skills; TF-IDF requirement coverage {round(cov * 100)}%." + (f" +{len(matched_nice)} nice-to-have." if matched_nice else ""),
         "evidence": evidence[:4]},
        {"name": "Experience", "score": exp_score, "weight": 0.25,
         "reasoning": f"{profile['yearsExperience']} years vs {js['minYears']}+ required.", "evidence": exp_ev},
        {"name": "Domain fit", "score": domain_score, "weight": 0.20,
         "reasoning": (f"Direct experience in {', '.join(dom_overlap)}." if dom_overlap else f"Semantic (TF-IDF) match to the role: {round(sim * 100)}%."),
         "evidence": []},
        {"name": "Seniority & leadership", "score": sen_score, "weight": 0.20,
         "reasoning": ("Demonstrated leadership/mentoring." if has_lead else "Limited leadership signal."), "evidence": []},
    ]
    overall = _clamp(sum(d["score"] * d["weight"] for d in dims))
    strengths = [f"Strong {s}" for s in matched_must[:3]]
    if dom_overlap:
        strengths.append(f"{dom_overlap[0]} domain experience")
    if has_lead:
        strengths.append("Leadership experience")
    gaps = [f"No clear evidence of {s}" for s in missing_must]
    if profile["yearsExperience"] < js["minYears"]:
        gaps.append(f"Only {profile['yearsExperience']} yrs (role asks {js['minYears']}+)")
    flags = [f"Confirm hands-on {s} in interview" for s in missing_must[:2]]
    if not dom_overlap and js["domain"]:
        flags.append(f"Probe transferability into {js['domain'][0]}")
    confidence = _clamp(40 + min(40, len(ctext) / 40) + len(evidence[:4]) * 5) / 100.0
    reasoning = (strengths[0] if strengths else "Partial match against the role") + ("." if not gaps else f", but {gaps[0].lower()}.")
    return {
        "candidateId": candidate["id"], "overall": overall, "dimensions": dims,
        "strengths": strengths[:4], "gaps": gaps[:4], "flagsToValidate": flags[:3],
        "confidence": confidence, "reasoning": reasoning,
    }


def interview_kit(job, candidate, score):
    profile = candidate.get("profile") or extract_profile(candidate["rawText"])
    questions = []
    for skill in profile["skills"][:3]:
        questions.append({
            "area": skill,
            "question": f"Walk me through the most complex {skill} problem you've solved in production. What tradeoff are you least proud of?",
            "rationale": f"Candidate lists {skill}; validate depth beyond the keyword.",
            "followUps": ["How did you measure success?", "What would you do differently at 10x scale?"],
        })
    for flag in score.get("flagsToValidate", []):
        area = re.sub(r"^Confirm hands-on |^Probe ", "", flag)
        area = re.sub(r" in interview$", "", area)
        questions.append({
            "area": area,
            "question": f"The role needs {area}. Tell me about a specific time you used it end to end.",
            "rationale": "Flagged as unclear from the resume — needs validation.",
            "followUps": ["What went wrong, and how did you recover?"],
        })
    probe = (score.get("gaps", []) + score.get("flagsToValidate", []))[:5]
    return {"candidateId": candidate["id"], "questions": questions[:6], "probeAreas": probe}


def ask_pool(job, candidates, question):
    want_sk = detect_skills(question)
    want_dm = detect_domains(question)
    lead_wanted = bool(re.search(r"lead|manage|mentor", question, re.I))
    ranked = []
    for c in candidates:
        prof = c.get("profile") or extract_profile(c["rawText"])
        sim = _doc_similarity(question, c["rawText"])
        skh = [s for s in want_sk if s in prof["skills"]]
        dmh = [d for d in want_dm if d in prof["domain"]]
        lead = lead_wanted and bool(re.search(r"mentor|led|managed|lead", c["rawText"], re.I))
        rel = sim + 0.15 * len(skh) + 0.15 * len(dmh) + (0.1 if lead else 0)
        ranked.append((rel, c, prof, skh, dmh))
    ranked.sort(key=lambda x: -x[0])
    top = [r for r in ranked if r[0] > 0.03][:4]
    citations = []
    for rel, c, prof, skh, dmh in top:
        sents = sentences(c["rawText"])
        snip = prof["summary"]
        if sents:
            X = _vectorize([question] + sents)
            sims = cosine_similarity(X[0], X[1:])[0]
            snip = sents[int(np.argmax(sims))][:220]
        citations.append({"candidateId": c["id"], "candidateName": c["name"], "snippet": snip})
    names = [c["name"] for rel, c, *_ in top[:3]]
    criteria = ", ".join(want_sk + want_dm) or "your query"
    if names:
        best = top[0]
        why = " + ".join(best[3] + best[4]) or "relevant background"
        answer = f"{len(top)} candidate(s) match {criteria}: {', '.join(names)}. {best[1]['name']} is the strongest — {why}."
    else:
        answer = f"No candidate clearly matches {criteria}. Try broadening the criteria."
    return {"answer": answer, "citations": citations}


def evaluate(job, candidate, notes):
    js = job.get("structured") or analyze_job(job.get("title", ""), job["rawText"])
    note_sents = sentences(notes) or [notes]
    resume = candidate["rawText"]
    mapped = []
    for req in js["mustHaves"]:
        aliases = SKILL_ALIASES.get(req, [req.lower()])
        in_notes = any(has_alias(notes, a) for a in aliases)
        in_resume = any(has_alias(resume, a) for a in aliases)
        met = "yes" if in_notes else ("partial" if in_resume else "no")
        # evidence: best-matching interview-note sentence for this requirement
        ev = "No evidence found"
        if note_sents:
            X = _vectorize([req] + note_sents)
            sims = cosine_similarity(X[0], X[1:])[0]
            j = int(np.argmax(sims))
            if float(sims[j]) > 0.05 or in_notes:
                ev = note_sents[j][:200]
            elif in_resume:
                ev = "On resume, not confirmed in interview"
        mapped.append({"requirement": req, "evidence": ev, "met": met})
    gaps = [f"{m['requirement']} — not demonstrated" for m in mapped if m["met"] == "no"]
    yes = sum(1 for m in mapped if m["met"] == "yes")
    ratio = yes / len(mapped) if mapped else 0
    rec = "Advance to next round" if ratio >= 0.7 else ("Borderline — needs a second interview on gaps" if ratio >= 0.4 else "Do not advance")
    summary = f"Confirmed {yes}/{len(mapped)} required areas in the interview. " + (f"{len(gaps)} area(s) still unproven." if gaps else "All required areas addressed.")
    return {"candidateId": candidate["id"], "summary": summary, "mapped": mapped, "gaps": gaps, "recommendation": rec}
