import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Wind, 
  Flame, 
  Gauge, 
  Thermometer, 
  Layers, 
  ShieldAlert, 
  RefreshCw, 
  Zap, 
  BellRing,
  FileCheck2,
  CheckCircle,
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getLiveTelemetry, simulateTelemetryAnomaly, orchestrateAgent } from '../services/geminiService';

export const TelemetryScreen: React.FC = () => {
  const [telemetryData, setTelemetryData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedZone, setSelectedZone] = useState<string>('ZONE-2');
  const [simulating, setSimulating] = useState<boolean>(false);
  const [agentLog, setAgentLog] = useState<string[]>([]);
  const [formIVData, setFormIVData] = useState<any>(null);

  // Poll live telemetry every 4 seconds
  const fetchTelemetry = async () => {
    try {
      const data = await getLiveTelemetry();
      setTelemetryData(data);
      if (data.overall_status === 'CRITICAL' && agentLog.length === 0) {
        setAgentLog([
          `[${data.timestamp}] CRITICAL THRESHOLD BREACH DETECTED in ${data.zones[1].name}`,
          `[${data.timestamp}] Agentic Decision: Isolated Auxiliary Feeder power.`,
          `[${data.timestamp}] Evacuation alarm broadcasted to Zone 2 workforce.`,
          `[${data.timestamp}] Statutory DGMS Form IV drafted automatically.`
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleSimulate = async (hazardType: string) => {
    setSimulating(true);
    try {
      await simulateTelemetryAnomaly(selectedZone, hazardType);
      await fetchTelemetry();
      
      // Trigger Agentic deliberation
      const agentRes = await orchestrateAgent(
        `High danger alert in ${selectedZone}. Methane or CO levels have breached statutory thresholds under CMR 2017. What immediate actions must be taken?`
      );

      if (agentRes && agentRes.statutory_form_iv) {
        setFormIVData(agentRes.statutory_form_iv);
      }

      setAgentLog(prev => [
        `[${new Date().toLocaleTimeString()}] SIMULATED ${hazardType.toUpperCase()} INJECTED.`,
        `[${new Date().toLocaleTimeString()}] Agentic Decision Engine activated.`,
        `[${new Date().toLocaleTimeString()}] CMR 2017 Regulation 154 provisions verified.`,
        `[${new Date().toLocaleTimeString()}] Shift Sirdar alerted via automated emergency webhook.`,
        ...prev.slice(0, 8)
      ]);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  const activeZoneData = telemetryData?.zones?.find((z: any) => z.id === selectedZone) || telemetryData?.zones?.[0];

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CRITICAL':
        return <span className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold animate-pulse flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> CRITICAL DANGER</span>;
      case 'HIGH':
        return <span className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-xs font-bold flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> HIGH RISK</span>;
      case 'WARNING':
        return <span className="px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-xs font-bold flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> WARNING</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> NORMAL</span>;
    }
  };

  return (
    <div className="min-h-screen py-8 max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse text-red-400" />
            Live SCADA / IoT Telemetry Stream
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight font-headline">
            Autonomous Mine Command Center
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Continuous environmental monitoring (CMR 2017) with autonomous Agentic AI safety intervention.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Mine Status</span>
            {getStatusBadge(telemetryData?.overall_status || 'NORMAL')}
          </div>
          <button
            onClick={fetchTelemetry}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh Readings"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Zone Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {telemetryData?.zones?.map((zone: any) => (
          <button
            key={zone.id}
            onClick={() => setSelectedZone(zone.id)}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              selectedZone === zone.id
                ? 'bg-slate-900 border-orange-500/80 shadow-md shadow-orange-500/10 text-white'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">{zone.id}</span>
              <span className={`w-2 h-2 rounded-full ${zone.status === 'CRITICAL' ? 'bg-red-500 animate-ping' : zone.status === 'WARNING' ? 'bg-yellow-400' : 'bg-emerald-400'}`} />
            </div>
            <span className="text-xs font-semibold text-slate-200 block truncate">{zone.name}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">{zone.type}</span>
          </button>
        ))}
      </div>

      {/* Main Grid: Live Metric Cards & Agent Response */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Sensor Metrics (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {activeZoneData && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-white">{activeZoneData.name}</h3>
                  <span className="text-xs text-slate-400">Statutory Sensor Node Array • Power State: <strong className={activeZoneData.power_status.includes('TRIPPED') ? 'text-red-400' : 'text-emerald-400'}>{activeZoneData.power_status}</strong></span>
                </div>
                {getStatusBadge(activeZoneData.status)}
              </div>

              {/* Metric Tiles */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
                {/* Methane CH4 */}
                <div className={`p-4 rounded-xl border ${activeZoneData.ch4 >= 1.25 ? 'bg-red-500/10 border-red-500/40 text-red-300' : activeZoneData.ch4 >= 0.75 ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-300' : 'bg-slate-950/60 border-slate-800 text-slate-200'}`}>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Methane (CH₄)</span>
                    <Flame className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="text-2xl font-bold font-headline">{activeZoneData.ch4}%</div>
                  <span className="text-[10px] text-slate-500 block mt-1">Limit: 0.75% return / 1.25% trip</span>
                </div>

                {/* Carbon Monoxide CO */}
                <div className={`p-4 rounded-xl border ${activeZoneData.co >= 50 ? 'bg-red-500/10 border-red-500/40 text-red-300' : activeZoneData.co >= 20 ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-300' : 'bg-slate-950/60 border-slate-800 text-slate-200'}`}>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Carbon Monoxide (CO)</span>
                    <Activity className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="text-2xl font-bold font-headline">{activeZoneData.co} <span className="text-sm font-normal">ppm</span></div>
                  <span className="text-[10px] text-slate-500 block mt-1">Spontaneous heating threshold: 20 ppm</span>
                </div>

                {/* Oxygen O2 */}
                <div className={`p-4 rounded-xl border ${activeZoneData.o2 < 19.0 ? 'bg-red-500/10 border-red-500/40 text-red-300' : 'bg-slate-950/60 border-slate-800 text-slate-200'}`}>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Oxygen (O₂)</span>
                    <Gauge className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold font-headline">{activeZoneData.o2}%</div>
                  <span className="text-[10px] text-slate-500 block mt-1">Min statutory limit: 19.0%</span>
                </div>

                {/* Airflow Velocity */}
                <div className={`p-4 rounded-xl border ${activeZoneData.airflow < 0.3 ? 'bg-red-500/10 border-red-500/40 text-red-300' : 'bg-slate-950/60 border-slate-800 text-slate-200'}`}>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Airflow Velocity</span>
                    <Wind className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-bold font-headline">{activeZoneData.airflow} <span className="text-sm font-normal">m/s</span></div>
                  <span className="text-[10px] text-slate-500 block mt-1">Face standard: &gt;= 0.50 m/s</span>
                </div>

                {/* Strata Displacement */}
                <div className={`p-4 rounded-xl border ${activeZoneData.strata_disp >= 5.0 ? 'bg-red-500/10 border-red-500/40 text-red-300' : activeZoneData.strata_disp >= 3.0 ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-300' : 'bg-slate-950/60 border-slate-800 text-slate-200'}`}>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Strata Bed Separation</span>
                    <Layers className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold font-headline">{activeZoneData.strata_disp} <span className="text-sm font-normal">mm</span></div>
                  <span className="text-[10px] text-slate-500 block mt-1">Critical threshold: 5.0 mm</span>
                </div>

                {/* Temperature */}
                <div className="p-4 rounded-xl border bg-slate-950/60 border-slate-800 text-slate-200">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Temperature</span>
                    <Thermometer className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold font-headline">{activeZoneData.temp}°C</div>
                  <span className="text-[10px] text-slate-500 block mt-1">Wet-bulb ergonomic norm: &lt; 30.5°C</span>
                </div>
              </div>

              {/* Active Alerts in Zone */}
              {activeZoneData.active_alerts?.length > 0 && (
                <div className="mt-4 p-3.5 rounded-xl bg-red-950/30 border border-red-500/30">
                  <div className="text-xs font-bold text-red-400 flex items-center gap-1.5 mb-1.5">
                    <BellRing className="w-3.5 h-3.5" />
                    Statutory Alarm Triggered in {activeZoneData.id}:
                  </div>
                  <ul className="space-y-1">
                    {activeZoneData.active_alerts.map((al: string, i: number) => (
                      <li key={i} className="text-xs text-red-200 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        {al}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Anomaly Testing Panel */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Interactive Hazard Drill Injection (Test Agentic Response):
            </span>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => handleSimulate('ch4_spike')}
                disabled={simulating}
                className="text-xs font-medium px-3.5 py-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 transition-all flex items-center gap-1.5"
              >
                <Flame className="w-3.5 h-3.5" /> Simulate Methane Gas Surge (1.48%)
              </button>
              <button
                onClick={() => handleSimulate('fire_co')}
                disabled={simulating}
                className="text-xs font-medium px-3.5 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all flex items-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5" /> Simulate Goaf Fire / Heating (68 ppm CO)
              </button>
              <button
                onClick={() => handleSimulate('strata_collapse')}
                disabled={simulating}
                className="text-xs font-medium px-3.5 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 transition-all flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" /> Simulate Strata Roof Separation (6.8mm)
              </button>
            </div>
          </div>
        </div>

        {/* Right: Agentic Decision Log & Form IV (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Agent Action Feed */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider mb-3">
              <Zap className="w-4 h-4 text-orange-400" />
              Autonomous Agent Decision Log
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {agentLog.length > 0 ? (
                agentLog.map((log, idx) => (
                  <div key={idx} className="text-xs p-2 rounded bg-slate-950/70 border border-slate-800/80 text-slate-300 font-mono leading-tight">
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 py-6 text-center">
                  Agent monitoring sensor streams in standby mode. Thresholds normal.
                </div>
              )}
            </div>
          </div>

          {/* Form IV Statutory Dossier Preview */}
          {formIVData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 border border-blue-500/30 rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                <FileCheck2 className="w-4 h-4" />
                Statutory DGMS Notice Drafted
              </div>
              <span className="text-xs text-slate-300 block font-semibold">{formIVData.statutory_form}</span>
              <span className="text-[10px] text-slate-400 block mb-2">Ref: {formIVData.report_id}</span>
              
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] text-slate-300 space-y-1 mb-2">
                <div><strong>Occurrence:</strong> {formIVData.classification}</div>
                <div><strong>Sector:</strong> {formIVData.mine_district}</div>
                <div><strong>Provisions:</strong> {formIVData.statutory_provisions_invoked[0]}</div>
              </div>

              <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Ready for electronic transmission to DGMS Director
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
