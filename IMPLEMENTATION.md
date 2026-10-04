# Digital Mine Safety Officer (Mine-Agent)
## Implementation & Technical Architecture Log

This document serves as the single source of truth detailing all architectural features, backend services, multimodal models, agentic workflows, and frontend interfaces implemented in the **Mine-Agent** platform.

---

## 1. System Architecture Overview

The system elevates the baseline RAG implementation into an **Agentic & Multimodal Mining Safety Intelligence Platform** designed in compliance with the **Directorate General of Mines Safety (DGMS)** and the **Coal Mines Regulations (CMR 2017)**.
| Layer | Components & Input Streams | Core Processing Engine | Operational Output |
| :--- | :--- | :--- | :--- |
| **Perception Layer** | Site inspection photos, CCTV footage, mobile cameras | Multimodal Vision AI (`vision_inspector.py`) using Gemini 2.5 Flash Vision | RMR classification, strata fractures, tension cracks, PPE compliance verification |
| **Telemetry Layer** | Continuous SCADA IoT sensors ($CH_4$, $CO$, $O_2$, Airflow, Strata) | Real-time Telemetry Service (`telemetry_service.py`) | Statutory threshold monitoring (CMR 2017 Reg 153/154), drill anomaly injection |
| **Knowledge Layer** | Regulatory queries, DGMS circulars, Coal Mines Regulations | Hybrid RAG Engine (`agent.py`, `agent1.py`) with FAISS & fallback token matching | Regulatory guidance, statutory citations, Overman action directives |
| **Agentic Core** | Multi-tool autonomous loop (`agent_orchestrator.py`) | Autonomous Decision Engine (`tool_evaluate_telemetry`, `tool_query_regulations`, `tool_generate_form_iv`) | Automated power cut directives, siren alerts, statutory DGMS Form IV notice generation |

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
    * Automatically correlates observed hazards with exact statutes (e.g. *CMR 2017 Regulation 123 Support Plan*, *CMR 2017 Regulation 118 Highwall Safety*, *Mines Rules 1955 Rule 92*).
  * **Immediate Operational Directives:**
    * Generates numbered, prioritized action items for the Shift Overman / Mining Sirdar.
  * **Dual-Engine Resilience:**
    * Uses **Gemini 2.5 Flash Vision** when `GOOGLE_API_KEY` is provided.
    * Features a built-in **DGMS Geotechnical Rule Engine** as an offline fallback to ensure zero downtime during network or quota disruptions.

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
* **Endpoint:** `POST /statutory_form`
* **Core Capabilities:**
  * Compiles official statutory notices under **First Schedule, Regulation 8 of Coal Mines Regulations (CMR 2017)** and **Mines Act 1952 Section 23**.
  * Outputs standardized report IDs (`DGMS/F4/YYYYMM/...`), classification of occurrence, statutory provisions invoked, factual narrative, and management actions taken.

---

### 2.5 Unified FastAPI Backend Server
* **File:** [`backend/main.py`](backend/main.py)
* **Container Config:** [`backend/Dockerfile`](backend/Dockerfile)
* **Dependencies:** [`backend/requirements.txt`](backend/requirements.txt)
* **API Route Manifest:**

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/` | API capability manifest and health status. |
| `POST` | `/query` | Hybrid RAG + CAG safety Q&A with two-tier (L1 LRU + L2 SQLite) caching. |
| `POST` | `/inspect_image` | Multimodal AI Vision inspection for rock cracks, roof sag, and PPE compliance. |
| `GET` | `/telemetry/live` | Real-time IoT sensor telemetry stream across 4 mining districts. |
| `POST` | `/telemetry/simulate_spike` | Anomaly injection trigger ($CH_4$ surge, CO heating, strata separation). |
| `POST` | `/agent/orchestrate` | Agentic AI workflow with autonomous tool calling. |
| `POST` | `/statutory_form` | Auto-compiles statutory DGMS Form IV accident notice. |
| `GET` | `/updates` | Scrapes industry RSS feeds and classifies hazard danger via Gemini. |
| `POST` | `/audit_report_pdf` | Generates and downloads custom mining safety audit PDF reports via ReportLab. |

---

### 2.6 Modern React 19 Frontend Web Interface
* **Directory:** [`frontend/src/`](frontend/src/)
* **Build Stack:** React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide Icons, Three.js / WebGL.

#### Key Screens Implemented:
1. **Visual Hazard Inspector (`VisionInspectorScreen.tsx`):**
   * Drag-and-drop / file upload for highwall photos, roof bolting grids, and CCTV footage.
   * One-click presets:
     * *Highwall Tension Crack* (Opencast Bench 3)
     * *Underground Roof Sag* (District 2 Longwall)
     * *Shaft Bank PPE Audit* (Shift Descent)
   * Displays risk severity badge (`CRITICAL`, `HIGH`, `WARNING`, `SAFE`), RMR score, PPE checks, DGMS statutory citation, and operational action checklist.
2. **Autonomous IoT Command Center (`TelemetryScreen.tsx`):**
   * Live telemetry dashboard auto-polling every 3.5 seconds across 4 mining zones.
   * Real-time metric tiles with color-coded statutory warning thresholds.
   * Anomaly drill controls allowing safety officers to simulate gas surges and strata shifts.
   * Autonomous Agent decision log feed and statutory Form IV dossier preview.
3. **Top Navigation Bar (`TopNavBar.tsx`):**
   * Integrated navigation tabs: **Home**, **Vision AI**, **IoT Command**, **AI Chatbot**, **Risk Alerts**, and **Audit Reports**.
4. **API Integration Service (`geminiService.ts`):**
   * Resilient client communicating with local backend (`http://localhost:7860`) with seamless automatic fallback to cloud instances.

---

## 3. Verification & Validation Results

* **Backend Endpoint Validation (FastAPI TestClient):**
  * `GET /`: `200 OK` (Health status & service capability descriptor).
  * `GET /telemetry/live`: `200 OK` (Real-time telemetry streams across 4 districts).
  * `POST /telemetry/simulate_spike`: `200 OK` (Hazard anomaly injection and threshold evaluation).
  * `POST /agent/orchestrate`: `200 OK` (Autonomous agentic toolchain execution).
  * `GET /statutory_form/{zone_id}`: `200 OK` (Automated DGMS Form IV notice retrieval).
  * `POST /statutory_form`: `200 OK` (Custom DGMS Form IV notice generation).
  * `POST /inspect_image`: `200 OK` (Multimodal vision analysis with RMR and PPE checks).
* **Frontend Compilation & Build:**
  * Typecheck: `tsc --noEmit` passed with **0 errors**.
  * Production bundle: `npm run build` completed successfully (`dist/` generated with zero errors).

---

## 4. How to Run the Implemented Platform

### Step 1: Start Backend (Port 7860)
```powershell
cd c:\IIT-D\mine-agent\backend
uvicorn main:app --host 0.0.0.0 --port 7860 --reload
```

### Step 2: Start Frontend (Port 5173 / 3000)
```powershell
cd c:\IIT-D\mine-agent\frontend
npm run dev
```

Open `http://localhost:5173` in your browser to access the full platform.
