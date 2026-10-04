// Backend API Service for Digital Mine Safety Officer (Agentic & Multimodal AI)

const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:7860';
const FALLBACK_URL = 'https://krishnasimha-mine-agent.hf.space';

async function fetchWithFallback(endpoint: string, options: RequestInit) {
  try {
    const res = await fetch(`${BACKEND_URL}${endpoint}`, options);
    if (res.ok) return await res.json();
    throw new Error(`Primary backend returned status: ${res.status}`);
  } catch (err) {
    // Try fallback cloud space
    const res = await fetch(`${FALLBACK_URL}${endpoint}`, options);
    if (!res.ok) throw new Error(`Fallback backend status: ${res.status}`);
    return await res.json();
  }
}

export async function getChatResponse(message: string, history?: { role: string; parts: { text: string }[] }[]) {
  try {
    const data = await fetchWithFallback('/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: message }),
    });
    return data.response;
  } catch (error) {
    console.error('Error querying backend:', error);
    return '⚠️ Unable to connect to the Mine Agent backend. Please ensure the local server is running on port 7860.';
  }
}

export async function inspectMineImage(imageFileOrBase64: File | string, filename?: string) {
  try {
    let response;
    if (typeof imageFileOrBase64 === 'string') {
      response = await fetchWithFallback('/inspect_image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: imageFileOrBase64, filename: filename || 'inspection.jpg' })
      });
    } else {
      const formData = new FormData();
      formData.append('file', imageFileOrBase64);
      try {
        const res = await fetch(`${BACKEND_URL}/inspect_image`, {
          method: 'POST',
          body: formData,
        });
        if (res.ok) response = await res.json();
        else throw new Error('Local error');
      } catch {
        // Convert to base64 for fallback
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(imageFileOrBase64);
        });
        response = await fetchWithFallback('/inspect_image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: base64, filename: imageFileOrBase64.name })
        });
      }
    }
    return response;
  } catch (error) {
    console.error('Error in inspectMineImage:', error);
    throw error;
  }
}

export async function getLiveTelemetry() {
  return await fetchWithFallback('/telemetry/live', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function simulateTelemetryAnomaly(zoneId: string, hazardType: string) {
  return await fetchWithFallback('/telemetry/simulate_spike', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ zone_id: zoneId, hazard_type: hazardType })
  });
}

export async function orchestrateAgent(query: string) {
  return await fetchWithFallback('/agent/orchestrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
}