# Digital Mine Safety Officer (Mine-Agent)
## Technical Analysis, AI Upgrade Proposal & Roadmap

---

### Executive Summary
This document provides a concise architectural review of **Mine-Agent** (`agentksimha/mine-agent`), explores an upgrade path leveraging **Agentic & Multimodal AI**, and outlines a feature roadmap with a 6-week completion timeline.

---

### 1. Current Implementation & Functionality

The repository implements a **Digital Mine Safety Officer** with a decoupled stack:

* **Backend (`/backend`) — FastAPI & Hybrid RAG:**
  * **Vector Search:** `SentenceTransformer("all-MiniLM-L6-v2")` with a local `faiss-cpu` index containing Directorate General of Mines Safety (DGMS) accident logs and regulations.
  * **Re-Ranking & Fallback:** Uses `cross-encoder/ms-marco-MiniLM-L-6-v2` over top-15 retrieved candidates. If confidence $\ge 0.55$, answers via RAG using `gemini-2.5-flash`; if $< 0.55$, falls back to Context-Aware Generation (CAG) from first principles.
  * **Caching:** In-memory LRU (L1) + SQLite (L2) query caching to minimize LLM calls.
  * **Endpoints:** `/query` for safety Q&A, `/updates` for scraping and classifying mining RSS news, and `/audit_report_pdf` for ReportLab PDF report generation.
* **Frontend (`/frontend`) — React 19 + TypeScript:**
  * Built with Vite, Tailwind CSS, Framer Motion, and Three.js subterranean shader visuals.
  * Views: **Home** (overview), **Chat** (safety Q&A), **Alerts** (hazard feeds), and **Audit** (custom PDF generation).

**Current Limitations:** The system is text-only and passive. It lacks tool execution, automated multi-agent coordination, real-time sensor/IoT telemetry ingestion, and hands-free voice capabilities.

---

### 2. Proposed Agentic & Multimodal AI Upgrades

| Architecture Layer | Core Components | Operational Function |
| :--- | :--- | :--- |
| **1. Multimodal Inputs** | CCTV Video, Drone Photos, IoT Telemetry, Voice Audio | Ingests real-time visual, environmental, and spoken safety data. |
| **2. Agentic Engine** | LangGraph Orchestrator, DGMS Regulatory Agent, Hazard Inspector | Autonomous deliberation, tool calling, and statutory compliance checks. |
| **3. Action Dispatch** | Proactive Sirens, Webhook/SMS Alerts, DGMS Form IV/V PDF Generator | Immediate field hazard intervention and automated statutory reporting. |

#### A. Multimodal AI Integrations
1. **Rock Mass & Roof Sag Inspector:** Upload site/drone photos to evaluate rock fractures, highwall instability, roof sagging, and water seepage using Gemini Flash Vision.
2. **Automated PPE Compliance:** Real-time CCTV auditing for mandatory helmets, reflective vests, and respirators at shaft entry points.
3. **Mine Blueprint & Schematic Analysis:** Multimodal parsing of underground AutoCAD/PDF ventilation layouts and escapeways.
4. **Hands-Free Voice Officer:** Real-time speech-to-speech interaction (Gemini Live API) for workers in the field wearing gloves and protective gear.

#### B. Agentic AI Integrations
1. **Multi-Agent Orchestration (LangGraph):** Autonomous sub-agents specialized in **DGMS Compliance** (CMR 2017 & Mines Act), **Incident Investigation**, and **Evacuation Routing**.
2. **Live IoT Sensor Monitoring & Proactive Alerts:** Agent continuously evaluates telemetry streams (CH₄, CO, air velocity, strata strain) and triggers proactive alarms before critical safety thresholds are reached.
3. **Autonomous Regulatory Form Filing:** Auto-populates official DGMS Form IV/V statutory accident reports with root-cause analysis.

---

### 3. Feature Matrix & 6-Week Delivery Timeline

| Phase / Timeline | Feature Track | Deliverables |
| :--- | :--- | :--- |
| **Week 1 (Phase 1)** | **Dynamic DB & Vision** | Persistent vector store (ChromaDB) + Gemini Vision hazard & PPE detection API. |
| **Week 2 (Phase 2)** | **Agentic Engine** | LangGraph multi-agent orchestrator with DGMS statutory tool-calling. |
| **Week 3 (Phase 3)** | **IoT Telemetry & Alarms** | Real-time sensor stream simulator with automated SMS/webhook threshold alerts. |
| **Week 4 (Phase 4)** | **Statutory Reporting** | Automated DGMS Form IV/V generation and audit report PDF suite. |
| **Week 5 (Phase 5)** | **Voice & Spatial UI** | Hands-free audio interface (WebRTC) and 2D/3D sector hazard heatmap dashboard. |
| **Week 6 (Phase 6)** | **Hardening & Launch** | Security red-teaming, latency optimization, and final cloud/HF container deployment. |

---
