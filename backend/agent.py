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

import pickle
import warnings

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

import google.generativeai as genai
import numpy as np
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

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

# Embeddings model
embed_model = SentenceTransformer("all-MiniLM-L6-v2")

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

# ------ FIXED, PERMANENT METADATA LOADING ------
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
            break
        if isinstance(item, dict) and "documents" in item:
            documents = item["documents"]
            break
elif isinstance(meta, dict):
    if "documents" in meta:
        documents = meta["documents"]

if documents is None:
    raise TypeError("[ERROR] Could not locate any list of documents inside index.pkl.")

print(f"[OK] Loaded {len(documents)} documents from index.pkl")


# ---------------------------
# Utility: Embed a query
# ---------------------------
def embed(text: str):
    return np.array(embed_model.encode([text]), dtype=np.float32)


# ---------------------------
# RAG Search
# ---------------------------
def search_faiss(query: str, k=5):
    if index is not None:
        q_emb = embed(query)
        _distances, indices = index.search(q_emb, k)
        hits = [documents[i] for i in indices[0] if i != -1 and i < len(documents)]
        return hits
    else:
        q_words = set(query.lower().split())
        matched = []
        for doc in documents:
            overlap = sum(1 for w in q_words if len(w) > 2 and w in doc.lower())
            if overlap > 0:
                matched.append((doc, overlap))
        matched.sort(key=lambda x: x[1], reverse=True)
        return [doc for doc, _ in matched[:k]] or documents[:k]


# ---------------------------
# Generate Final Answer (Gemini)
# ---------------------------
def generate_answer(query: str, context_docs: list):
    context = "\n\n".join(context_docs)

    prompt = f"""
You are an expert mining assistant.

User question:
{query}

Relevant mining documents:
{context}

Answer concisely, factually, and directly.
"""

    if openai_client:
        try:
            resp = openai_client.chat.completions.create(
                model=DEFAULT_LLM_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert mining assistant under DGMS and CMR 2017.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
            )
            return (resp.choices[0].message.content or "").strip()
        except Exception:  # noqa: BLE001, S110
            pass

    if GOOGLE_API_KEY:
        for m in ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]:
            try:
                response = genai.GenerativeModel(m).generate_content(prompt)
                if response.text:
                    return response.text
            except Exception:  # noqa: BLE001, S110
                continue

    context_preview = (
        "\n- ".join(context_docs[:3]) if context_docs else "No direct DGMS match."
    )
    return (
        f"**[DGMS Safety Knowledge Retrieval]**\nRelevant statutory excerpts retrieved:\n"
        f"- {context_preview}"
    )


# ---------------------------
# Full RAG Pipeline
# ---------------------------
def ask(query: str):
    context_docs = search_faiss(query, k=5)
    answer = generate_answer(query, context_docs)
    return answer


# ---------------------------
# CLI testing
# ---------------------------
if __name__ == "__main__":
    while True:
        q = input("\n[QUERY] Ask me anything about mining: ")
        print("\n[SEARCHING FAISS]...")
        print("[ANSWER]:", ask(q))
