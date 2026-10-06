# Digital Mine Safety Officer (Mine-Agent)
## Implementation & Technical Architecture Log

This document serves as the single source of truth detailing all architectural features, backend services, multimodal models, agentic workflows, production containerization, and frontend interfaces implemented in the **Mine-Agent** platform.

---

## 1. System Architecture Overview

The system elevates the baseline RAG implementation into an **Agentic & Multimodal Mining Safety Intelligence Platform** designed in strict compliance with the **Directorate General of Mines Safety (DGMS)**, the **Coal Mines Regulations (CMR 2017)**, and the **Mines Act 1952**.

| Layer | Components & Input Streams | Core Processing Engine | Operational Output |
| :--- | :--- | :--- | :--- |
| **Perception Layer** | Site inspection photos, CCTV footage, mobile cameras | Multimodal Vision AI (`vision_inspector.py`) using Gemini 2.0 Flash, GPT-4o-mini, and PIL visual analysis | RMR classification, strata fractures, tension cracks, PPE compliance verification |
| **Telemetry Layer** | Continuous SCADA IoT sensors ($CH_4$, $CO$, $O_2$, Airflow, Strata) | Real-time Telemetry Service (`telemetry_service.py`) | Statutory threshold monitoring (CMR 2017 Reg 153/154), drill anomaly injection, automated circuit tripping |
| **Knowledge Layer** | Regulatory queries, DGMS circulars, Coal Mines Regulations | Hybrid RAG Engine (`agent.py`, `agent1.py`) with FAISS vectorstore & CrossEncoder reranking | Regulatory guidance, statutory citations, Overman action directives |
| **Agentic Core** | Multi-tool autonomous loop (`agent_orchestrator.py`) | Autonomous Decision Engine (`tool_evaluate_telemetry`, `tool_query_regulations`, `tool_generate_form_iv`) | Automated power cut directives, siren alerts, statutory DGMS Form IV notice generation |
| **Operations Dashboard** | React 19 + Vite frontend served via FastAPI static mounts | Client-side reactive interface (`VisionInspectorScreen.tsx`, `TelemetryScreen.tsx`, `geminiService.ts`) | Real-time sensor charts, drag-and-drop inspection, Form IV dossier download |

---

## 2. Implemented Modules & Features

### 2.1 Multimodal Vision Hazard & PPE Inspector
* **File:** [`backend/vision_inspector.py`](backend/vision_inspector.py)
* **Endpoint:** `POST /inspect_image` (Supports both `multipart/form-data` image uploads and `application/json` base64 strings).
* **Core Capabilities:**
  * **Geotechnical & Strata Assessment:**
    * Computes estimated **Rock Mass Rating (RMR)** classification (*Very Good, Good, Fair, Poor, Very Poor*).
    * Identifies sub-vertical tension cracks, bed separation along shale-sandstone contacts, joint aperture spacing, and highwall slope instability.
    * Detects groundwater seepage lubricating basal failure planes.
  * **Personal Protective Equipment (PPE) Verification:**
    * Inspects worker presence for mandatory helmets/hard hats, class-3 high-visibility reflective apparel, and respirators/dust masks.
  * **DGMS Statutory Regulatory Grounding:**
    * Automatically correlates observed hazards with exact statutes (e.g. *CMR 2017 Regulation 123 Support Plan*, *CMR 2017 Regulation 106 Highwall Safety*, *Mines Rules 1955 Rule 92*).
  * **Multi-Provider AI & Visual Heuristics:**
    * **Google Gemini:** Leverages `gemini-2.0-flash` and `gemini-1.5-flash` via modern `google.genai` Client with `google.generativeai` fallback.
    * **OpenAI:** Supports `gpt-4o-mini` and `gpt-4o` for high-accuracy visual inspection.
    * **Intelligent Visual Feature Analysis (Offline / Standalone):** Uses PIL and NumPy to compute image luminance, color spectra, fluorescent vest pixel ratios, and edge variance, ensuring reliable and nuanced hazard classification without dummy responses.
  * **Standard Benchmark Presets:**
    * `highwall_crack.jpg`: Opencast Bench 3 sub-vertical tension crack.
    * `roof_sag.jpg`: Underground Longwall delamination and roof bed separation.
    * `ppe_audit.jpg`: Shaft bank assembly PPE compliance audit.
    * `safe_gallery.jpg`: Fully compliant systematic steel arch supported gallery.

---

### 2.2 Real-Time IoT Telemetry & Proactive Alarms
* **File:** [`backend/telemetry_service.py`](backend/telemetry_service.py)
* **Endpoints:**
  * `GET /telemetry/live`: Live sensor stream with automatic threshold evaluations.
  * `POST /telemetry/simulate_spike`: Interactive injection of hazard conditions for emergency response drills.
* **Core Capabilities:**
  * **District Coverage:**
    1. `ZONE-1`: Main Incline & Shaft Bottom (Active Haulage & Intake Air)
    2. `ZONE-2`: Longwall Face 4 (Continuous Mining & Active Cutting)
    3. `ZONE-3`: Return Airway 3-West (High Methane Layering Risk)
    4. `ZONE-4`: Depillaring Sector & Goaf Perimeter (Strata Stress Monitoring)
  * **Monitored Sensor Parameters:**
    * **Methane ($CH_4$ %):** Evaluated against CMR 2017 Reg 153/154 ($\le 0.50\%$ general body, $\le 0.75\%$ return airway, $\ge 1.25\%$ mandatory power isolation and withdrawal).
    * **Carbon Monoxide ($CO$ ppm):** Evaluated for spontaneous heating and goaf fires ($\le 10$ ppm normal, $20$ ppm warning, $\ge 50$ ppm critical evacuation).
    * **Oxygen ($O_2$ %):** Monitored against statutory minimum $19.0\%$.
    * **Airflow Velocity ($m/s$):** Enforces minimum face ventilation ($\ge 0.50$ m/s) to prevent dangerous gas accumulation.
    * **Strata Bed Separation ($mm$):** Borehole extensometer tracking ($\ge 3.0$ mm warning, $\ge 5.0$ mm critical collapse alert).
    * **Temperature ($^\circ C$):** Wet-bulb monitoring for heat stress.
  * **Autonomous Circuit Tripping:**
    * Automatically sets `power_status: TRIPPED_AUTOMATICALLY` when methane crosses the statutory $1.25\%$ threshold.

---

### 2.3 Agentic Decision Core & Tool Calling
* **File:** [`backend/agent_orchestrator.py`](backend/agent_orchestrator.py)
* **Endpoint:** `POST /agent/orchestrate`
* **Core Capabilities:**
  * Deconstructs multi-part safety emergencies using autonomous tool-calling logic:
    * `tool_evaluate_telemetry`: Polls live sensor feeds to ascertain real-time environmental context.
    * `tool_query_regulations`: Executes vector search over the DGMS FAISS database for statutory limits and technical circulars.
    * `tool_generate_form_iv`: Automatically drafts formal statutory accident reports.
  * Formulates precise operational orders for Mine Managers, Safety Officers, and Shift Sirdars with verified CMR 2017 citations.

---

### 2.4 Statutory DGMS Form IV Generator
* **File:** [`backend/agent_orchestrator.py`](backend/agent_orchestrator.py) & [`backend/main.py`](backend/main.py)
* **Endpoint:** `POST /statutory_form` and `GET /statutory_form/{zone_id}`
* **Core Capabilities:**
  * Compiles official statutory notices under **First Schedule, Regulation 8 of Coal Mines Regulations (CMR 2017)** and **Mines Act 1952 Section 23**.
  * Outputs standardized report IDs (`DGMS/F4/YYYYMM/...`), classification of occurrence, statutory provisions invoked, factual narrative, and management actions taken.

---

### 2.5 Unified FastAPI Backend Server & Static Mounting
* **File:** [`backend/main.py`](backend/main.py)
* **Container Config:** [`Dockerfile`](Dockerfile)
* **Dependencies:** [`backend/requirements.txt`](backend/requirements.txt)
* **Route Manifest:**
  * `GET /api` & `GET /api/health`: Health status & capability descriptor.
  * `GET /`: Serves compiled React SPA `index.html`.
  * `GET /assets/*`: Serves compiled Vite JS/CSS bundles.
  * `GET /samples/*`: Serves test photography benchmarks.
  * `POST /inspect_image`: Multimodal vision inspection endpoint.
  * `GET /telemetry/live`: Live SCADA telemetry feed.
  * `POST /telemetry/simulate_spike`: Interactive anomaly drill simulator.
  * `POST /agent/orchestrate`: Agentic AI multi-tool safety loop.
  * `GET/POST /statutory_form`: Statutory DGMS Form IV compiler.
  * `POST /query`: Regulatory RAG inquiry endpoint.
  * `GET /docs`: Interactive OpenAPI Swagger UI.

---

### 2.6 Frontend & API Service Architecture
* **Directory:** [`frontend/src/`](frontend/src/)
* **Build Stack:** React 19, TypeScript, Vite 6, Tailwind CSS, Framer Motion, Lucide Icons.
* **Unified API Client (`frontend/src/services/geminiService.ts`):**
  * Automatically resolves API base URL:
    * In production (Railway, cloud, custom domain): Resolves to same-origin relative URLs (`""`), ensuring zero CORS friction and eliminating failed requests to `localhost`.
    * In local Vite dev mode (`localhost:5173`): Proxies to `http://localhost:8000`.

---

## 3. Verification & Validation Report

### Automated Smoke Tests (`backend/test_smoke.py`):
1. **Multimodal Vision Engine:**
   * Tested all 4 sample benchmarks (`highwall_crack.jpg`, `ppe_audit.jpg`, `roof_sag.jpg`, `safe_gallery.jpg`).
   * Successfully classified scenes and identified hazards using live vision and offline visual feature analysis.
2. **SCADA Telemetry Service:**
   * Verified baseline status across 4 zones (`NORMAL`).
   * Simulated methane surge in `ZONE-2` (Longwall Face 4): status transitioned to `CRITICAL`, alerts triggered.
3. **Agentic Orchestrator:**
   * Executed multi-tool workflow with `tool_evaluate_telemetry` and `tool_query_regulations`.
   * Generated statutory assessment citing CMR 2017 Reg 154 and Mines Act 1952 Sec 22.
4. **Statutory Form IV:**
   * Generated report ID (`DGMS/F4/202610/...`) invoking Regulation 8(1) and Regulation 154.
5. **FastAPI TestClient:**
   * `GET /api`: `200 OK` (`OPERATIONAL`).
   * `GET /docs`: `200 OK`.
   * `GET /`: `200 OK` (Serving React SPA).
6. **Frontend Production Build:**
   * `npm run build` executed cleanly with 0 TypeScript/Vite errors.
