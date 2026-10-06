import asyncio
import io
import os
import sqlite3
import sys
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from fastapi import FastAPI, File, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

_BACKEND_DIR = Path(__file__).resolve().parent
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

# Import our new Agentic & Multimodal modules
try:
    from agent_orchestrator import run_agentic_workflow, tool_generate_form_iv
    from telemetry_service import telemetry_manager
    from vision_inspector import analyze_mine_image
except ImportError:
    from backend.agent_orchestrator import run_agentic_workflow, tool_generate_form_iv
    from backend.telemetry_service import telemetry_manager
    from backend.vision_inspector import analyze_mine_image

# -------------------------------------------------------
# LAZY IMPORT of RAG model
# -------------------------------------------------------
agent = None


async def load_agent():
    global agent
    if agent is None:
        print("[INFO] Loading RAG agent...")
        try:
            from agent1 import ask

            agent = ask
        except Exception as e:  # noqa: BLE001
            print(f"[WARN] Could not load agent1: {e}")
            from agent import ask

            agent = ask
        print("[OK] RAG agent ready.")


# -------------------------------------------------------
# FastAPI Setup
# -------------------------------------------------------
app = FastAPI(
    title="Digital Mine Safety Officer (Agentic & Multimodal AI)",
    description="Enterprise AI platform for DGMS compliance, Multimodal Vision hazard detection, real-time IoT telemetry, and agentic response.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------
# Caching Architecture (L1 LRU + L2 SQLite)
# -------------------------------------------------------
L1_CACHE_SIZE = 100
lru_cache_store = {}


def get_from_l1(query):
    return lru_cache_store.get(query)


def set_to_l1(query, response):
    if len(lru_cache_store) >= L1_CACHE_SIZE:
        oldest_key = next(iter(lru_cache_store))
        lru_cache_store.pop(oldest_key)
    lru_cache_store[query] = response


DB_PATH = os.getenv("DB_PATH", "rag_cache.db")
conn = sqlite3.connect(DB_PATH, check_same_thread=False)
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS cache (
    query TEXT PRIMARY KEY,
    response TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)
""")
conn.commit()


def get_from_l2(query):
    cursor.execute("SELECT response FROM cache WHERE query = ?", (query,))
    row = cursor.fetchone()
    return row[0] if row else None


def set_to_l2(query, response):
    cursor.execute(
        "INSERT OR REPLACE INTO cache (query, response, timestamp) VALUES (?, ?, CURRENT_TIMESTAMP)",
        (query, response),
    )
    conn.commit()


async def cached_ask(query: str):
    await load_agent()
    result = get_from_l1(query)
    if result:
        return result
    result = get_from_l2(query)
    if result:
        set_to_l1(query, result)
        return result
    result = await asyncio.to_thread(agent, query)
    result = str(result).strip()
    set_to_l1(query, result)
    set_to_l2(query, result)
    return result


# -------------------------------------------------------
# ROUTES
# -------------------------------------------------------


@app.get("/api")
@app.get("/api/health")
async def api_info():
    return {
        "platform": "Digital Mine Safety Officer",
        "version": "2.0.0",
        "capabilities": [
            "Multimodal Vision Hazard & PPE Inspector (/inspect_image)",
            "Real-Time IoT Sensor Telemetry & Proactive Alarms (/telemetry/live)",
            "Agentic AI Multi-Agent Orchestrator (/agent/orchestrate)",
            "Statutory DGMS Form IV Report Generator (/statutory_form)",
            "Regulatory RAG Query (/query)",
            "Mining Industry & DGMS Updates (/updates)",
            "Audit Report PDF Generation (/audit_report_pdf)",
        ],
        "status": "OPERATIONAL",
    }


# --- 1. RAG Query Endpoint ---
@app.post("/query")
async def query_agent(request: Request):
    data = await request.json()
    query = data.get("query", "")
    if not query:
        return {"response": "⚠️ Query is empty."}
    response = await cached_ask(query)
    return {"response": response}


# --- 2. Multimodal Vision Hazard & PPE Inspector ---
@app.post("/inspect_image")
async def inspect_image_endpoint(
    request: Request,
    file: UploadFile | None = File(None),  # noqa: B008
):
    image_bytes = None
    filename = "uploaded_inspection.jpg"

    if file:
        image_bytes = await file.read()
        filename = file.filename or filename
    elif request:
        try:
            body = await request.json()
            if "image_base64" in body:
                import base64

                b64_str = body["image_base64"]
                if "," in b64_str:
                    b64_str = b64_str.split(",")[1]
                image_bytes = base64.b64decode(b64_str)
                filename = body.get("filename", filename)
        except Exception:  # noqa: BLE001, S110
            pass

    if not image_bytes:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": "No image file or base64 provided."},
        )

    result = analyze_mine_image(image_bytes, filename=filename)
    return result


# --- 3. IoT Real-time Telemetry Endpoints ---
@app.get("/telemetry/live")
async def get_live_telemetry():
    return telemetry_manager.get_live_readings()


@app.post("/telemetry/simulate_spike")
async def simulate_telemetry_spike(request: Request):
    data = await request.json()
    zone_id = data.get("zone_id", "ZONE-2")
    hazard_type = data.get("hazard_type", "ch4_spike")
    return telemetry_manager.simulate_anomaly(zone_id, hazard_type)


# --- 4. Agentic AI Decision Core & Tool Orchestration ---
@app.post("/agent/orchestrate")
async def orchestrate_agent(request: Request):
    data = await request.json()
    query = data.get("query", "")
    if not query:
        return {"success": False, "error": "Query required."}
    return run_agentic_workflow(query)


# --- 5. Statutory DGMS Form IV Generator ---
@app.get("/statutory_form")
@app.get("/statutory_form/{zone_id}")
async def get_statutory_form(zone_id: str | None = None):
    target_zone = zone_id or "District 2: Longwall Face 4"
    return tool_generate_form_iv(
        zone_name=target_zone,
        hazard_type="Inflammable Gas & Strata Separation",
        severity="CRITICAL",
        details="Methane concentration reached statutory alert threshold with strata bed separation exceeding 5.0mm.",
    )


@app.post("/statutory_form")
async def generate_statutory_form_endpoint(request: Request):
    data = await request.json()
    zone_name = data.get("zone_name", "District 2: Longwall Face 4")
    hazard_type = data.get("hazard_type", "Inflammable Gas & Strata Separation")
    severity = data.get("severity", "CRITICAL")
    details = data.get(
        "details",
        "Methane concentration reached 1.48% with strata bed separation exceeding 5.0mm.",
    )
    return tool_generate_form_iv(zone_name, hazard_type, severity, details)


# --- 6. DGMS Updates Endpoint ---
from rss_feed import fetch_dgms_updates


@app.get("/updates")
async def get_dgms_updates():
    updates = fetch_dgms_updates(limit=5)

    async def analyze_update(item):
        title = item.get("title", "")
        link = item.get("link", "")
        published = item.get("published", "")
        try:
            response = await asyncio.to_thread(requests.get, link, timeout=10)
            soup = BeautifulSoup(response.text, "html.parser")
            paragraphs = [p.get_text() for p in soup.find_all("p")]
            content = " ".join(paragraphs[:5]) if paragraphs else "(No text found.)"
        except Exception:  # noqa: BLE001
            content = "(Could not fetch full article text.)"

        prompt = (
            f"You are a mining safety officer. Analyze the following DGMS update "
            f"and classify the risk level (High, Medium, Low, or None), and describe "
            f"the hazard type.\n\n"
            f"Title: {title}\nPublished: {published}\nLink: {link}\n"
            f"Content: {content}"
        )

        try:
            output = await cached_ask(prompt)
        except Exception as e:  # noqa: BLE001
            output = f"⚠️ Error: {e}"

        return {
            "title": title,
            "link": link,
            "published": published,
            "danger_analysis": output,
        }

    analyzed_updates = await asyncio.gather(*[analyze_update(u) for u in updates])
    return {"updates": analyzed_updates}


# --- 7. PDF Audit Report Endpoint ---
@app.post("/audit_report_pdf")
async def generate_audit_report_pdf(request: Request):
    data = await request.json()
    state = data.get("state", "All States")
    year = data.get("year", "All Years")
    hazard_type = data.get("hazard_type", "All Hazards")

    prompt = (
        f"You are a mining safety audit assistant. Using the DGMS mining accident data, "
        f"generate a detailed safety audit report for:\n\n"
        f"State: {state}\nYear: {year}\nHazard Type: {hazard_type}\n\n"
        f"Provide insights on:\n"
        f"- Number of incidents\n"
        f"- Categories (gas leak, collapse, fire, machinery, etc.)\n"
        f"- Severity distribution\n"
        f"- Root causes\n"
        f"- Safety recommendations\n"
        f"- Trends\n"
        f"Return plain text."
    )

    report_text = await cached_ask(prompt)

    pdf_buffer = io.BytesIO()
    c = canvas.Canvas(pdf_buffer, pagesize=A4)
    _width, height = A4

    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, "🦺 Mining Safety Audit Report")

    c.setFont("Helvetica", 12)
    c.drawString(50, height - 80, f"State: {state}")
    c.drawString(50, height - 100, f"Year: {year}")
    c.drawString(50, height - 120, f"Hazard Type: {hazard_type}")

    y = height - 160
    c.setFont("Helvetica", 11)

    for line in str(report_text).splitlines():
        while len(line) > 90:
            part = line[:90]
            c.drawString(60, y, part)
            y -= 15
            line = line[90:]
        c.drawString(60, y, line)
        y -= 15
        if y < 50:
            c.showPage()
            c.setFont("Helvetica", 11)
            y = height - 50

    c.save()
    pdf_buffer.seek(0)

    filename = f"Audit_Report_{state.replace(' ', '_')}_{year}.pdf"
    with open(filename, "wb") as f:  # noqa: ASYNC230
        f.write(pdf_buffer.getvalue())

    return FileResponse(path=filename, filename=filename, media_type="application/pdf")


# Mount frontend static assets if available (Full-stack container deployment)
from fastapi.staticfiles import StaticFiles

static_dir = _BACKEND_DIR / "static"
if not static_dir.exists():
    static_dir = _BACKEND_DIR.parent / "frontend" / "dist"

if static_dir.exists() and (static_dir / "index.html").exists():
    if (static_dir / "assets").exists():
        app.mount("/assets", StaticFiles(directory=str(static_dir / "assets")), name="static_assets")

    @app.get("/")
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str = ""):
        if full_path in ("docs", "redoc", "openapi.json"):
            return None
        candidate = static_dir / full_path
        if full_path and candidate.is_file():
            return FileResponse(str(candidate))
        return FileResponse(str(static_dir / "index.html"))
else:
    @app.get("/")
    async def root_fallback():
        return await api_info()


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=True)
