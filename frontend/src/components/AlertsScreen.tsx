import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Info, 
  ShieldAlert, 
  Loader2,
  ExternalLink,
  Shield,
  Zap,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Particles from '../designs/particle';

interface AlertData {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  time: string;
  hazardType: string;
  description: string;
  descriptionPoints: string[];
  recommendedActions: string[];
  link: string;
  isError: boolean;
}

// --- Robust Markdown-aware parser for danger_analysis ---

const parseRiskLevel = (raw: string): 'critical' | 'warning' | 'info' => {
  // Match **Risk Level:** High/Medium/Low (case-insensitive)
  const match = raw.match(/\*?\*?Risk\s*Level\*?\*?:\s*\*?\*?\s*(High|Medium|Low)/i);
  if (match) {
    const level = match[1].toLowerCase();
    if (level === 'high') return 'critical';
    if (level === 'medium') return 'warning';
    return 'info';
  }
  // Fallback: search for keywords
  const lower = raw.toLowerCase();
  if (lower.includes('risk level: high') || lower.includes('critical')) return 'critical';
  if (lower.includes('risk level: medium') || lower.includes('moderate') || lower.includes('warning')) return 'warning';
  return 'info';
};

const parseHazardType = (raw: string): string => {
  // Match **Hazard Type:** ... (capture until next ** section or double newline)
  const match = raw.match(/\*?\*?Hazard\s*Type\*?\*?:\s*\*?\*?\s*(.+?)(?=\n\n|\n\*\*|$)/is);
  if (match) {
    return match[1].replace(/\*\*/g, '').replace(/^[-\s]+/, '').trim();
  }
  return 'General Warning';
};

const parseDescription = (raw: string): { text: string; points: string[] } => {
  // Try to extract **Description:** section
  const descMatch = raw.match(/\*?\*?Description\*?\*?:\s*\n?([\s\S]*?)(?=\n\*\*|$)/i);
  
  let descriptionBlock = '';
  if (descMatch) {
    descriptionBlock = descMatch[1].trim();
  } else {
    // Fallback: remove Risk Level and Hazard Type lines, use the rest
    descriptionBlock = raw
      .replace(/\*?\*?Risk\s*Level\*?\*?:\s*.+/i, '')
      .replace(/\*?\*?Hazard\s*Type\*?\*?:\s*.+/i, '')
      .trim();
  }
  
  // Split into main text and numbered/bulleted points  
  const lines = descriptionBlock.split('\n');
  const textParts: string[] = [];
  const points: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Numbered points like "1.  **Safety Culture...**" or "1. Text"
    const numberedMatch = trimmed.match(/^\d+\.\s+(.+)/);
    // Bullet points
    const bulletMatch = trimmed.match(/^[-•*]\s+(.+)/);
    
    if (numberedMatch) {
      points.push(numberedMatch[1].replace(/\*\*/g, '').trim());
    } else if (bulletMatch) {
      points.push(bulletMatch[1].replace(/\*\*/g, '').trim());
    } else {
      textParts.push(trimmed.replace(/\*\*/g, ''));
    }
  }
  
  return {
    text: textParts.join(' ').trim(),
    points
  };
};

const getAnalysisText = (analysis: unknown): string => {
  if (typeof analysis === 'string') {
    return analysis.trim();
  }

  if (analysis && typeof analysis === 'object') {
    const value = analysis as { answer?: unknown; response?: unknown };
    if (typeof value.answer === 'string') return value.answer.trim();
    if (typeof value.response === 'string') return value.response.trim();
    return JSON.stringify(analysis);
  }

  return '';
};

const hasUnavailableAnalysis = (raw: string): boolean => {
  const normalized = raw.toLowerCase();
  return normalized.includes('error:')
    || normalized.includes('credit limit')
    || normalized.includes('quota exceeded')
    || /\b(402|429|5\d{2})\b/.test(normalized);
};

const sampleAlerts: AlertData[] = [
  
];

// Risk level color configs
const riskConfig = {
  critical: {
    label: 'HIGH RISK',
    labelColor: 'text-red-400',
    borderColor: 'border-red-500/30',
    hoverBorder: 'hover:border-red-500/50',
    iconBg: 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.15)]',
    glowShadow: 'shadow-[0_0_40px_rgba(239,68,68,0.08)]',
    badgeBg: 'bg-red-500/10 border-red-500/20 text-red-400',
    accentLine: 'bg-red-500',
    Icon: ShieldAlert
  },
  warning: {
    label: 'MEDIUM RISK',
    labelColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    hoverBorder: 'hover:border-amber-500/50',
    iconBg: 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.15)]',
    glowShadow: 'shadow-[0_0_40px_rgba(245,158,11,0.08)]',
    badgeBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    accentLine: 'bg-amber-500',
    Icon: AlertTriangle
  },
  info: {
    label: 'LOW RISK / INFO',
    labelColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    hoverBorder: 'hover:border-blue-500/50',
    iconBg: 'bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.15)]',
    glowShadow: 'shadow-[0_0_40px_rgba(59,130,246,0.08)]',
    badgeBg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    accentLine: 'bg-blue-500',
    Icon: Info
  }
};

export const AlertsScreen: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertData[]>(sampleAlerts);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        let response = await fetch('/updates');
        if (!response.ok) {
          response = await fetch('https://krishnasimha-mine-agent.hf.space/updates');
        }
        if (!response.ok) {
          throw new Error('Failed to fetch updates');
        }
        const data = await response.json();
        
        const updates = Array.isArray(data.updates) ? data.updates : [];
        const parsedAlerts: AlertData[] = updates
          .map((item: any, index: number) => {
            const rawAnalysis = getAnalysisText(item.danger_analysis);
            const analysisUnavailable = !rawAnalysis || hasUnavailableAnalysis(rawAnalysis);
            
            const type = analysisUnavailable ? 'info' : parseRiskLevel(rawAnalysis);
            const hazardType = analysisUnavailable ? 'General Warning' : parseHazardType(rawAnalysis);
            const { text, points } = analysisUnavailable
              ? { text: 'Risk analysis is temporarily unavailable. Open the original bulletin for the latest update details.', points: [] }
              : parseDescription(rawAnalysis);

            return {
              id: `live-${index}`,
              type,
              title: item.title || 'Official Bulletin Update',
              time: item.published || new Date().toISOString(),
              link: item.link || '#',
              hazardType,
              description: text,
              descriptionPoints: points,
              recommendedActions: [],
              isError: analysisUnavailable
            };
          }) as AlertData[];
        
        setAlerts([...parsedAlerts, ...sampleAlerts]);
      } catch (error) {
        console.error("Error fetching updates:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAlerts();
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* Particles Background */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <Particles
          particleColors={["#FF8C00"]}
          particleCount={300}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={150}
          moveParticlesOnHover
          alphaParticles={false}
          disableRotation={false}
          pixelRatio={1}
        />
      </div>

      <div className="relative pt-8 pb-32" style={{ zIndex: 10 }}>
        {/* Header */}
        <div className="mb-12 max-w-4xl mx-auto flex flex-col items-center text-center">
          <p className="font-label text-xs uppercase tracking-widest text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.3)] mb-3 border border-[#00E5FF]/20 px-3 py-1 rounded bg-[#00E5FF]/5 inline-block">Live DGMS Monitoring</p>
          <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-slate-100">AI Safety Alerts</h1>
          <p className="text-slate-400 mt-4 max-w-2xl text-[15px]">Automated analysis of the latest DGMS official bulletins, ranked by risk factor and localized impact probability.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <Loader2 className="w-12 h-12 text-[#00E5FF] animate-spin" />
            <p className="text-slate-400 font-medium tracking-wide">Fetching & Analyzing realtime DGMS bulletins...</p>
          </div>
        ) : (
          <div className="max-w-full mx-auto space-y-6">
            <AnimatePresence>
              {alerts.map((alert, idx) => {
                const config = riskConfig[alert.type];
                const RiskIcon = config.Icon;

                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`bg-[#111114]/90 backdrop-blur-sm rounded-2xl overflow-hidden border ${config.borderColor} ${config.hoverBorder} transition-all duration-300 ${config.glowShadow}`}
                  >
                    {/* Accent top line */}
                    <div className={`h-[2px] w-full ${config.accentLine} opacity-60`} />

                    <div className="p-8 md:p-10">
                      {/* Header Row */}
                      <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
                        <div className="flex items-start gap-5">
                       
                          <div className="space-y-2">
                            {/* Risk Badge */}
                            <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] font-bold px-2.5 py-1 rounded-md border ${config.badgeBg}`}>
                              <Zap className="w-3 h-3" />
                              {config.label}
                            </span>
                            <h3 className="font-headline text-xl md:text-2xl font-bold text-slate-100 leading-snug">{alert.title}</h3>
                          </div>
                        </div>

                        {/* Hazard Type & Date badges */}
                        <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-end">
                          {alert.hazardType && alert.hazardType !== 'General Warning' && (
                            <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                              <Shield className="w-3 h-3 text-slate-400" />
                              <span className="font-mono text-[10px] text-slate-300 uppercase tracking-wider">{alert.hazardType}</span>
                            </div>
                          )}
                          {alert.time && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span className="font-mono text-[10px] text-slate-500 tracking-wider">
                                {new Date(alert.time).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Analysis Content */}
                      <div className="space-y-5">
                        {/* Description text */}
                        {alert.description && (
                          <div className="pl-0 md:pl-[4.5rem]">
                            <p className="text-[14px] text-slate-300 leading-[1.8] font-light">
                              {alert.description}
                            </p>
                          </div>
                        )}

                        {/* Description Points (numbered list) */}
                        {alert.descriptionPoints.length > 0 && (
                          <div className="pl-0 md:pl-[4.5rem]">
                            <div className="bg-[#1A1A1F] rounded-xl p-5 border border-white/[0.04] space-y-3">
                              <span className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold block mb-3">Key Findings</span>
                              <ol className="space-y-3">
                                {alert.descriptionPoints.map((point, i) => (
                                  <li key={i} className="flex gap-3 text-[13px] text-slate-300 leading-relaxed">
                                    <span className={`flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold mt-0.5 ${config.badgeBg}`}>
                                      {i + 1}
                                    </span>
                                    <span>{point}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          </div>
                        )}

                        {/* Recommended Actions */}
                        {alert.recommendedActions.length > 0 && (
                          <div className="pl-0 md:pl-[4.5rem]">
                            <div className="bg-emerald-500/[0.04] p-5 rounded-xl border border-emerald-500/10 space-y-3">
                              <span className="text-[10px] uppercase tracking-[0.15em] text-emerald-400 font-bold flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Actionable Safety Recommendations
                              </span>
                              <ol className="space-y-2.5">
                                {alert.recommendedActions.map((action, i) => (
                                  <li key={i} className="flex gap-3 text-[13px] text-slate-300 leading-relaxed">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold mt-0.5">
                                      {i + 1}
                                    </span>
                                    <span>{action}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="px-8 py-4 bg-[#0A0A0B] border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                     
                      <a href={alert.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white font-mono text-[11px] font-bold py-2 px-4 rounded transition-all hover:bg-white/5 border border-transparent hover:border-white/10">
                        VIEW ORIGINAL BULLETIN <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
