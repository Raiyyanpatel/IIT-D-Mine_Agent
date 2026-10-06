import io
import json
import os
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from main import app
from vision_inspector import analyze_mine_image
from telemetry_service import telemetry_manager
from agent_orchestrator import run_agentic_workflow, tool_generate_form_iv

client = TestClient(app)
root_dir = backend_dir.parent
samples_dir = root_dir / "frontend" / "public" / "samples"

print("=================================================================")
print("DIGITAL MINE SAFETY OFFICER - COMPREHENSIVE SYSTEM VERIFICATION")
print("=================================================================\n")

passed = 0
failed = 0

def check(name: str, condition: bool, details: str = ""):
    global passed, failed
    if condition:
        passed += 1
        print(f" [PASS] {name} {f'({details})' if details else ''}")
    else:
        failed += 1
        print(f" [FAIL] {name} {f'({details})' if details else ''}")

# TEST 1: Health Check & Capabilities Manifest
r_api = client.get("/api")
check("Health Check Endpoint (/api)", r_api.status_code == 200 and r_api.json().get("status") == "OPERATIONAL", f"Status: {r_api.status_code}")

# TEST 2: OpenAPI Docs Availability
r_docs = client.get("/docs")
check("Interactive OpenAPI Docs (/docs)", r_docs.status_code == 200, f"Status: {r_docs.status_code}")

# TEST 3: Static SPA Route
r_spa = client.get("/")
check("SPA Root Route (/)", r_spa.status_code == 200 and "html" in r_spa.headers.get("content-type", "").lower())

# TEST 4: Telemetry Live Feed
r_telemetry = client.get("/telemetry/live")
tel_data = r_telemetry.json()
check("SCADA Telemetry Stream (/telemetry/live)", r_telemetry.status_code == 200 and len(tel_data.get("zones", [])) == 4, f"Zones: {len(tel_data.get('zones', []))}")

# TEST 5: Telemetry Anomaly Drills
for h_type in ["ch4_spike", "fire_co", "strata_collapse"]:
    r_spike = client.post("/telemetry/simulate_spike", json={"zone_id": "ZONE-2", "hazard_type": h_type})
    spike_data = r_spike.json()
    check(f"Anomaly Drill: {h_type}", r_spike.status_code == 200 and spike_data.get("success") is True)

# TEST 6: Statutory Circuit Tripping
tel_after_spike = telemetry_manager.get_live_readings()
zone2 = next((z for z in tel_after_spike["zones"] if z["id"] == "ZONE-2"), None)
check("Statutory Power Circuit Breaker", zone2 and zone2.get("power_status") == "TRIPPED_AUTOMATICALLY", f"Power status: {zone2.get('power_status') if zone2 else 'N/A'}")

# TEST 7: Agentic Autonomous Tool Calling
r_agent = client.post("/agent/orchestrate", json={"query": "Evaluate live methane spike in District 2 and recommend statutory actions"})
agent_data = r_agent.json()
check("Agentic AI Multi-Tool Orchestration (/agent/orchestrate)", 
      r_agent.status_code == 200 and agent_data.get("success") is True and len(agent_data.get("tools_executed", [])) >= 2,
      f"Tools: {agent_data.get('tools_executed')}")

# TEST 8: DGMS Form IV Generation
r_form = client.get("/statutory_form/District 2: Longwall Face 4")
form_data = r_form.json()
check("DGMS Form IV Notice (/statutory_form)", 
      r_form.status_code == 200 and "DGMS" in form_data.get("statutory_form", "") and form_data.get("report_id"),
      f"Report ID: {form_data.get('report_id')}")

# TEST 9: Multimodal Vision - Architecture Diagram / Non-Mining Validation
# Create a synthetic white digital diagram in memory
from PIL import Image, ImageDraw
diag_img = Image.new("RGB", (600, 300), color=(255, 255, 255))
d = ImageDraw.Draw(diag_img)
d.rectangle([(40, 40), (220, 140)], outline=(30, 144, 255), width=3)
d.text((50, 80), "SYSTEM ARCHITECTURE - CLOUD DB", fill=(0, 0, 0))
d.rectangle([(320, 40), (540, 140)], outline=(30, 144, 255), width=3)
d.text((340, 80), "FRONTEND CLIENT", fill=(0, 0, 0))
d.line([(220, 90), (320, 90)], fill=(100, 100, 100), width=3)

diag_buf = io.BytesIO()
diag_img.save(diag_buf, format="JPEG")
diag_bytes = diag_buf.getvalue()

diag_res = analyze_mine_image(diag_bytes, filename="system_architecture_flowchart.png")
check("VLM Non-Mining Image Validation (Architecture Diagram)", 
      diag_res.get("risk_level") == "SAFE" and diag_res.get("geotechnical_analysis", {}).get("detected") is False,
      f"Risk: {diag_res.get('risk_level')}, Scene: {diag_res.get('scene_type')}")

# TEST 10: Multimodal Vision - Benchmark Test Photos
sample_files = list(samples_dir.glob("*.jpg"))
check("Sample Benchmarks Present", len(sample_files) == 4, f"Found {len(sample_files)} sample photos")
for s_file in sorted(sample_files):
    s_bytes = s_file.read_bytes()
    s_res = analyze_mine_image(s_bytes, filename=s_file.name)
    check(f"Vision Analysis: {s_file.name}", 
          s_res.get("success") is True and s_res.get("risk_level") in ["CRITICAL", "HIGH", "WARNING", "SAFE"],
          f"Risk: {s_res.get('risk_level')}, Provider: {s_res.get('provider')}")

# TEST 11: In-Memory PDF Audit Generation
r_pdf = client.post("/audit_report_pdf", json={"state": "Jharkhand", "year": "2024", "hazard_type": "Methane Accumulation"})
check("In-Memory PDF Generation (/audit_report_pdf)", 
      r_pdf.status_code == 200 and "application/pdf" in r_pdf.headers.get("content-type", ""),
      f"PDF size: {len(r_pdf.content)} bytes")

print("\n=================================================================")
print(f"VERIFICATION SUMMARY: {passed} PASSED, {failed} FAILED")
print("=================================================================")

if failed > 0:
    sys.exit(1)
