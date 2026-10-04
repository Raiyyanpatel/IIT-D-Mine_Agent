# Digital Mine Safety Officer: Agentic & Multimodal AI

An enterprise AI safety platform designed for Indian underground and opencast coal mining operations. The system couples Gemini 2.5 Multimodal Vision, autonomous tool-calling agentic safety workflows, real-time IoT SCADA telemetry monitoring, and Coal Mines Regulations (CMR 2017) statutory intelligence.

---

## 1. System Capabilities

| Module | Core Functionality | Statutory Grounding |
| :--- | :--- | :--- |
| **Multimodal Vision Inspector** | Deep visual analysis of mine photographs for geotechnical hazards (joint spacing, strata fractures, rockfall, highwall tension cracks) and PPE compliance (hard hats, high-vis vests, respirators, cap lamps). | CMR 2017 Reg 123 (Strata Control), Reg 106 (Opencast Highwalls), Reg 190 (PPE) |
| **IoT Telemetry SCADA** | Real-time monitoring across 4 mining districts tracking $CH_4$, $CO$, $O_2$, airflow velocity, ambient temperature, and strata bed separation with anomaly injection drills. | CMR 2017 Reg 153 & 154 (Ventilation Standards, Gas Limits), Reg 123 (Roof Extensometers) |
| **Agentic AI Orchestrator** | Autonomous reasoning loop with multi-step statutory tool calling (`tool_evaluate_telemetry`, `tool_query_regulations`, `tool_generate_form_iv`) to detect hazards, cross-reference regulations, and trigger containment. | CMR 2017 Reg 153(2), Reg 123(4), Mines Act 1952 Sec 23 |
| **Statutory Form IV Generator** | Automated generation of DGMS Form IV (Notice of Accident & Dangerous Occurrence) with exact legal coordinates, sensor readings, and immediate emergency directives. | Mines Act 1952 Section 23; DGMS Statutory Circulars |
| **Regulatory RAG Assistant** | Dense semantic retrieval over indexed DGMS regulations, circulars, and CMR 2017 handbooks with hybrid vector search and semantic keyword fallbacks. | Coal Mines Regulations 2017 Complete Corpus |

---

## 2. Architecture & Workflow

The platform operates across three coordinated layers:

### A. Sensory & Data Ingestion Layer
- **Visual Capture**: Field engineers upload high-resolution inspection photos via web UI or mobile field camera.
- **SCADA Telemetry**: Background telemetry worker continuously simulates and monitors live environmental and geomechanical sensors across:
  - District 1: Longwall Face 4 (Production face)
  - District 2: Tailgate Return Airway (High gas accumulation risk)
  - District 3: Main Intake Drift & Conveyor Transfer (High dust and airflow transit)
  - District 4: Opencast Pit Bench 3A (Highwall slope stability)

### B. Agentic Intelligence & Decision Core
- **FastAPI Backend (`backend/`)**: Serves RESTful endpoints, coordinates Gemini 2.5 Flash Vision API calls, and hosts local RAG retrieval.
- **Agent Orchestrator (`backend/agent_orchestrator.py`)**: Uses autonomous tool calling to evaluate sensor thresholds against statutory limits. When an anomaly is detected, it automatically queries the DGMS knowledge base for mandatory actions and drafts emergency notices.
- **Dual-Tier Cache**: Queries and RAG answers are memoized through an L1 in-memory LRU cache and an L2 persistent SQLite store (`rag_cache.db`).

### C. Enterprise Operations Dashboard
- **React 18 + Vite + Tailwind CSS (`frontend/`)**: Modern UI featuring:
  - **Vision AI Tab**: Visual hazard analysis with Rock Mass Rating (RMR) calculation, PPE detection checklist, and DGMS action directives.
  - **IoT Command Tab**: Real-time multi-district sensor dashboard, anomaly simulation controls, agent decision stream, and DGMS Form IV notice preview.
  - **RAG Assistant**: Interactive regulatory consultation for shift supervisors and safety managers.

---

## 3. Repository Structure

| Path | Purpose |
| :--- | :--- |
| `backend/main.py` | FastAPI application entry point, routing, L1/L2 caching, and endpoint definitions. |
| `backend/vision_inspector.py` | Multimodal visual inspection engine powered by Gemini 2.5 Flash with DGMS offline fallback. |
| `backend/telemetry_service.py` | Real-time multi-zone IoT sensor simulator and anomaly management engine. |
| `backend/agent_orchestrator.py`| Autonomous Agentic AI decision engine and statutory toolchain. |
| `backend/agent.py` & `agent1.py`| Semantic RAG search engines with FAISS vectorstore and token-matching fallbacks. |
| `backend/requirements.txt` | Python runtime dependencies. |
| `backend/Dockerfile` | Production container definition for backend deployment. |
| `frontend/src/App.tsx` | Main React layout with navigation and view switching. |
| `frontend/src/components/VisionInspectorScreen.tsx` | Visual inspection UI with drag-and-drop image upload and preset test cases. |
| `frontend/src/components/TelemetryScreen.tsx` | Real-time SCADA dashboard, anomaly injection triggers, and Form IV preview. |
| `frontend/src/services/geminiService.ts` | Frontend API client with automatic cloud and local failover. |
| `IMPLEMENTATION.md` | Implementation tracking log and engineering progress audit. |
| `PROJECT_ANALYSIS_AND_PROPOSAL.md` | Architectural proposal and competitive analysis document. |
| `.env.example` | Template for environment variable configuration. |

---

## 4. Environment Configuration

Copy `.env.example` to `.env` in both the repository root and `backend/`:

```bash
cp .env.example .env
cp .env.example backend/.env
```

### Environment Variables Reference

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `GOOGLE_API_KEY` | Recommended | None | Google Gemini API key from Google AI Studio. Required for online Gemini 2.5 Flash Vision & Agentic reasoning. If omitted, the system seamlessly falls back to offline DGMS heuristics. |
| `GEMINI_API_KEY` | Optional | None | Alias for `GOOGLE_API_KEY`. |
| `HOST` | No | `0.0.0.0` | Host IP interface for FastAPI server. |
| `PORT` | No | `7860` | Network port for FastAPI server. |
| `DB_PATH` | No | `rag_cache.db` | SQLite cache file location. |
| `VITE_BACKEND_URL` | No | `http://localhost:7860` | URL used by React frontend to connect to FastAPI backend. |
| `VITE_FALLBACK_BACKEND_URL` | No | `https://krishnasimha-mine-agent.hf.space` | Fallback cloud API endpoint. |

---

## 5. Installation and Setup

### Prerequisites
- **Python**: Version 3.10, 3.11, 3.12, 3.13, or 3.14.
- **Node.js**: Version 18.x or 20.x with `npm`.
- **Operating System**: Windows, Linux, or macOS.

---

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment**:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the FastAPI server**:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 7860 --reload
   ```
   The backend API will be available at `http://localhost:7860` and the interactive OpenAPI documentation at `http://localhost:7860/docs`.

---

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install node dependencies**:
   ```bash
   npm install
   ```

3. **Start local development server**:
   ```bash
   npm run dev
   ```
   The web application will open at `http://localhost:5173`.

4. **Build for production**:
   ```bash
   npm run build
   ```

---

### Docker Deployment

To build and run the entire backend containerized:

```bash
cd backend
docker build -t digital-mine-safety-officer .
docker run -p 7860:7860 -e GOOGLE_API_KEY=your_key_here digital-mine-safety-officer
```

---

## 6. API Reference

| Method | Endpoint | Description | Request Payload | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Health check and active system version. | None | `{"status": "ok", "app": "Digital Mine Safety Officer", "version": "2.0.0"}` |
| `POST` | `/inspect_image` | Inspects mining image for geotechnical hazards and PPE. | `multipart/form-data` with `file` OR JSON `{ "image_base64": "..." }` | Geological assessment, RMR score, PPE status, statutory alerts, recommendations. |
| `GET` | `/telemetry/live` | Fetches real-time sensor readings across all 4 districts. | None | JSON object keyed by district with sensor values, units, and status. |
| `POST` | `/telemetry/simulate_spike` | Injects an anomaly drill into a specific district. | `{"zone_id": "DISTRICT_2_TAILGATE", "hazard_type": "methane_buildup"}` | Updated zone status with statutory alert flag. |
| `POST` | `/agent/orchestrate` | Triggers autonomous multi-step safety agent evaluation. | `{"query": "Evaluate District 2 hazard", "zone_id": "DISTRICT_2_TAILGATE"}` | Execution steps, tool call traces, statutory breaches, and containment directives. |
| `GET` | `/statutory_form/{zone_id}` | Generates formal DGMS Form IV notice for a district. | Optional path param `zone_id` | Statutory Form IV record with incident details and directives. |
| `POST` | `/statutory_form` | Custom generation of DGMS Form IV notice. | `{"zone_name": "...", "hazard_type": "...", "severity": "...", "details": "..."}` | Form IV payload. |
| `POST` | `/query` | Regulatory RAG question answering over CMR 2017. | `{"query": "What is the maximum permissible methane in return airway?"}` | Answer with confidence score. |
| `GET` | `/updates` | Scrapes and analyzes recent DGMS notices and circulars. | None | List of recent updates with risk classification. |

---

## 7. Statutory Compliance Matrix (CMR 2017)

| Hazard Parameter | Statutory Threshold | Regulated Action | Platform Automated Response |
| :--- | :--- | :--- | :--- |
| **Methane ($CH_4$)** | $> 0.50\%$ at general body<br>$> 1.25\%$ at return airway | CMR 2017 Reg 153(2): Cut electrical power, withdraw personnel, improve ventilation. | Sensor triggers `CRITICAL_ALERT`, cuts virtual power grid, drafts Form IV. |
| **Carbon Monoxide ($CO$)** | $> 50\text{ ppm}$ | CMR 2017 Reg 154: Spontaneous combustion warning; investigate immediately. | Flags spontaneous heating warning, directs seal inspection. |
| **Oxygen ($O_2$)** | $< 19.00\%$ | CMR 2017 Reg 153(1): Asphyxiation hazard; mandatory withdrawal. | Triggers evacuation horn, orders emergency ventilation increase. |
| **Strata Bed Separation** | $> 5.0\text{ mm}$ | CMR 2017 Reg 123: Imminent roof fall risk; stop face operations. | Directs supplemental rock bolting, halts coal cutter, logs dangerous occurrence. |
| **Airflow Velocity** | $< 0.50\text{ m/s}$ in face | CMR 2017 Reg 153: Inadequate ventilation to dilute noxious gases. | Flags auxiliary fan inspection, restricts blasting operations. |
