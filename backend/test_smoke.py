import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from vision_inspector import analyze_mine_image
from telemetry_service import telemetry_manager
from agent_orchestrator import run_agentic_workflow, tool_generate_form_iv

root_dir = Path(__file__).resolve().parent.parent
samples_dir = root_dir / "frontend" / "public" / "samples"

print("--- TESTING VISION INSPECTOR ---")
samples = list(samples_dir.glob("*.jpg"))
print(f"Found {len(samples)} sample images in {samples_dir}")
for f in sorted(samples):
    data = f.read_bytes()
    res = analyze_mine_image(data, filename=f.name)
    print(f"File: {f.name:20} -> Risk: {res.get('risk_level'):10} | Scene: {res.get('scene_type', '')[:35]} | Provider: {res.get('provider')}")

print("\n--- TESTING TELEMETRY ---")
tel = telemetry_manager.get_live_readings()
print(f"Overall status: {tel['overall_status']}, Zones count: {len(tel['zones'])}")
spike = telemetry_manager.simulate_anomaly("ZONE-2", "ch4_spike")
print(f"Spike simulated in {spike['zone_id']}: {spike['message']}")
tel_after = telemetry_manager.get_live_readings()
print(f"Overall status after spike: {tel_after['overall_status']}")

print("\n--- TESTING AGENT ORCHESTRATOR ---")
wf = run_agentic_workflow("Evaluate District 2 methane spike and issue directives")
print(f"Workflow success: {wf.get('success')}, Tools: {wf.get('tools_executed')}")
print(f"Response snippet: {wf.get('agentic_response')[:120]}...")

print("\n--- TESTING FORM IV ---")
form = tool_generate_form_iv("District 2: Longwall Face 4", "Inflammable Gas", "CRITICAL", "Methane exceeded 1.25%")
print(f"Form IV Report ID: {form['report_id']}, Statute: {form['statutory_provisions_invoked'][0]}")
print("\nALL SMOKE TESTS COMPLETED SUCCESSFULLY!")
