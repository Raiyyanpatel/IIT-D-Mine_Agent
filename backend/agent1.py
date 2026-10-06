import os
import pathlib

try:
    import faiss

    HAS_FAISS = True
except ImportError:
    HAS_FAISS = False
    print(
        "[WARN] FAISS not available in environment; using semantic fallback retrieval."
    )

import math
import pickle
import re

import google.generativeai as genai
import numpy as np
from dotenv import load_dotenv
from sentence_transformers import CrossEncoder, SentenceTransformer

# ---------------------------
# Setup
# ---------------------------
BASE_DIR = pathlib.Path(__file__).resolve().parent
VECTORSTORE_PATH = BASE_DIR / "vectorstore"
load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DEFAULT_LLM_MODEL = os.getenv("DEFAULT_LLM_MODEL", "gpt-4o-mini")

openai_client = None
if OPENAI_API_KEY:
    try:
        from openai import OpenAI

        openai_client = OpenAI(api_key=OPENAI_API_KEY)
    except Exception:  # noqa: BLE001
        openai_client = None

if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

# ---------------------------
# Models
# ---------------------------
embed_model = SentenceTransformer("all-MiniLM-L6-v2")
reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

# ---------------------------
# Load FAISS index + metadata
# ---------------------------
faiss_index_path = VECTORSTORE_PATH / "index.faiss"
faiss_meta_path = VECTORSTORE_PATH / "index.pkl"

if not faiss_index_path.exists():
    faiss_index_path = BASE_DIR / "index.faiss"
    faiss_meta_path = BASE_DIR / "index.pkl"

index = None
if HAS_FAISS and faiss_index_path.exists():
    try:
        index = faiss.read_index(str(faiss_index_path))
    except Exception as e:  # noqa: BLE001
        print(f"[WARN] Could not load FAISS index: {e}")

with open(faiss_meta_path, "rb") as f:
    meta = pickle.load(f)

documents = None

if isinstance(meta, tuple) and len(meta) == 2 and hasattr(meta[0], "search"):
    docstore, index_to_id = meta
    documents = [
        docstore.search(id_val).page_content for id_val in index_to_id.values()
    ]
elif isinstance(meta, list):
    documents = meta
elif isinstance(meta, tuple):
    for item in meta:
        if isinstance(item, list):
            documents = item
        if isinstance(item, dict) and "documents" in item:
            documents = item["documents"]
elif isinstance(meta, dict):
    documents = meta.get("documents")

if documents is None:
    raise TypeError("[ERROR] Could not locate documents in index.pkl")

print(f"[OK] Loaded {len(documents)} documents")


# ---------------------------
# Utilities
# ---------------------------
def embed(text: str):
    return np.array(embed_model.encode([text]), dtype=np.float32)


def sigmoid(x):
    return 1 / (1 + math.exp(-x))


def clean_text(text: str) -> str:
    text = text.replace("#", "")
    text = re.sub(r"\n+", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


# ---------------------------
# FAISS + Re-ranking
# ---------------------------
def search_faiss_reranked(query: str, k=5, fetch_k=15):
    if index is not None:
        q_emb = embed(query)
        _, indices = index.search(q_emb, fetch_k)
        candidates = [
            documents[i] for i in indices[0] if i != -1 and i < len(documents)
        ]
    else:
        q_words = set(query.lower().split())
        matched = []
        for doc in documents:
            overlap = sum(1 for w in q_words if len(w) > 2 and w in doc.lower())
            if overlap > 0:
                matched.append((doc, overlap))
        matched.sort(key=lambda x: x[1], reverse=True)
        candidates = [doc for doc, _ in matched[:fetch_k]] or documents[:fetch_k]

    if not candidates:
        return [], []

    pairs = [(query, doc) for doc in candidates]
    raw_scores = reranker.predict(pairs)

    ranked = sorted(zip(candidates, raw_scores), key=lambda x: x[1], reverse=True)

    top_docs = [doc for doc, _ in ranked[:k]]
    top_scores = [sigmoid(float(score)) for _, score in ranked[:k]]

    return top_docs, top_scores


# ---------------------------
# Confidence Score (0–1)
# ---------------------------
def compute_confidence(scores):
    if not scores:
        return 0.0
    max_score = max(scores)
    avg_score = sum(scores) / len(scores)
    confidence = 0.7 * max_score + 0.3 * avg_score
    return round(confidence, 3)


# ---------------------------
# RAG Generator
# ---------------------------
def generate_answer_rag(query: str, context_docs: list):
    context = "\n\n".join(context_docs)

    prompt = f"""
You are an expert mining engineer.

Answer ONLY using the provided documents.
If the documents do not contain the answer, say so clearly.

Question:
{query}

Documents:
{context}

Answer concisely and factually.
"""

    if openai_client:
        try:
            resp = openai_client.chat.completions.create(
                model=DEFAULT_LLM_MODEL,
                messages=[
                    {"role": "system", "content": "You are an expert mining engineer."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
            )
            return (resp.choices[0].message.content or "").strip()
        except Exception:  # noqa: BLE001, S110
            pass

    if GOOGLE_API_KEY:
        try:
            response = genai.GenerativeModel("gemini-2.5-flash").generate_content(
                prompt
            )
            return response.text
        except Exception:  # noqa: BLE001, S110
            pass

    return f"**[DGMS Statutory Extract]**\n{context[:600]}"


# ---------------------------
# CAG Generator (Fallback)
# ---------------------------
def generate_answer_cag(query: str):
    prompt = f"""
You are an expert mining engineer and researcher.

The knowledge base may not contain sufficient information.
Use engineering principles and reasoning carefully.

Question:
{query}

Provide a careful, assumption-aware answer.
"""

    if openai_client:
        try:
            resp = openai_client.chat.completions.create(
                model=DEFAULT_LLM_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert mining engineer and researcher.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
            )
            return (resp.choices[0].message.content or "").strip()
        except Exception:  # noqa: BLE001, S110
            pass

    if GOOGLE_API_KEY:
        try:
            response = genai.GenerativeModel("gemini-2.5-flash").generate_content(
                prompt
            )
            return response.text
        except Exception:  # noqa: BLE001, S110
            pass

    return f"Query recorded: {query}. (Please consult direct DGMS circulars or activate LLM API key)."


# ---------------------------
# Full Hybrid Pipeline
# ---------------------------
def ask(query: str):
    docs, scores = search_faiss_reranked(query, k=5)
    confidence = compute_confidence(scores)

    if not openai_client and not GOOGLE_API_KEY:
        context_preview = "\n- ".join(docs[:3]) if docs else "No direct DGMS match."
        return {
            "answer": f"**[DGMS Safety Knowledge Retrieval]**\nRelevant statutory excerpts retrieved:\n- {context_preview}\n\n*(Note: Set OPENAI_API_KEY or GOOGLE_API_KEY in .env for full conversational synthesis.)*",
            "confidence": confidence,
        }

    try:
        if confidence < 0.55 or not docs:
            raw_answer = generate_answer_cag(query)
        else:
            raw_answer = generate_answer_rag(query, docs)
    except Exception as e:  # noqa: BLE001
        context_preview = "\n- ".join(docs[:3]) if docs else "No direct DGMS match."
        raw_answer = f"**[DGMS Safety Knowledge Retrieval]**\nRelevant statutory excerpts retrieved:\n- {context_preview}\n\n*(LLM API offline: {e})*"

    answer = clean_text(raw_answer)
    return {"answer": answer, "confidence": confidence}


# ---------------------------
# CLI
# ---------------------------
if __name__ == "__main__":
    while True:
        q = input("\n[QUERY] Ask me anything about mining: ")

        res = ask(q)
        answer = res["answer"]
        confidence = res["confidence"]

        print("\n[ANSWER]:")
        print(answer)

        print("\n[CONFIDENCE SCORE]:", confidence)
