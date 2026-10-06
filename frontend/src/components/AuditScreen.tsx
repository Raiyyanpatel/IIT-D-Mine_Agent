import React, { useState } from 'react';
import { BarChart3, Download, FileText, Calendar, MapPin, AlertTriangle, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import LightRays from '../designs/light';

export const AuditScreen: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedState, setSelectedState] = useState('Western Australia');
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedHazard, setSelectedHazard] = useState('All Major Hazards');

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const payload = JSON.stringify({
        state: selectedState,
        year: selectedYear,
        hazard_type: selectedHazard
      });

      let response = await fetch('/audit_report_pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });

      if (!response.ok) {
        response = await fetch('https://krishnasimha-mine-agent.hf.space/audit_report_pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Audit_Report_${selectedState.replace(/\s+/g, '_')}_${selectedYear}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Error generating audit report:', error);
      alert('Failed to generate audit report.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* LightRays Background Layer */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <LightRays
          raysOrigin="top-center"
          raysColor="#ffffff"
          raysSpeed={1}
          lightSpread={0.5}
          rayLength={3}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0}
          distortion={0}
          className="custom-rays"
          pulsating={false}
          fadeDistance={1}
          saturation={1}
        />
      </div>

      {/* Subterranean Texture Background */}
      <div className="absolute inset-0 bg-noise pointer-events-none opacity-5" style={{ zIndex: 1 }} />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" style={{ zIndex: 1 }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-tertiary/5 rounded-full blur-[120px] pointer-events-none" style={{ zIndex: 1 }} />

      <div className="w-full max-w-4xl px-4 md:px-8" style={{ zIndex: 10 }}>
        <header className="text-center mb-12">
         
          <h1 className="font-headline text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-on-surface mb-4">Audit Intelligence</h1>
          <p className="text-slate-400 font-body text-lg max-w-xl mx-auto">
            Generate high-fidelity safety compliance reports powered by real-time sensor data and historical incident logs.
          </p>
        </header>

        {/* Form Card */}
        <div className="bg-surface-container-low rounded-xl p-5 sm:p-8 md:p-12 shadow-2xl relative overflow-hidden group">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">

            {/* State Input */}
            <div className="space-y-3">
              <label className="block font-label text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                State / Region
              </label>
              <input
                type="text"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                placeholder="Enter state or region"
                className="w-full bg-surface-container-lowest border-none rounded-xl py-4 px-5 text-on-surface focus:ring-0 font-headline font-medium transition-all group-hover:bg-surface-container shadow-inner"
              />
            </div>

            {/* Year Input */}
            <div className="space-y-3">
              <label className="block font-label text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                Audit Fiscal Year
              </label>
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                placeholder="Enter year (e.g. 2024)"
                className="w-full bg-surface-container-lowest border-none rounded-xl py-4 px-5 text-on-surface focus:ring-0 font-headline font-medium transition-all group-hover:bg-surface-container shadow-inner"
              />
            </div>

            {/* Hazard Input */}
            <div className="space-y-3">
              <label className="block font-label text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                Hazard Focus Area
              </label>
              <input
                type="text"
                value={selectedHazard}
                onChange={(e) => setSelectedHazard(e.target.value)}
                placeholder="Enter hazard type"
                className="w-full bg-surface-container-lowest border-none rounded-xl py-4 px-5 text-on-surface focus:ring-0 font-headline font-medium transition-all group-hover:bg-surface-container shadow-inner"
              />
            </div>

          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-primary to-primary-container py-4 md:py-5 rounded-xl text-on-primary font-headline font-bold text-sm sm:text-lg tracking-wide shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <Download className="w-6 h-6" />
            Generate & Download Audit Report
          </button>

          {/* Loading Overlay */}
          {isGenerating && (
            <div className="absolute inset-0 bg-surface/90 backdrop-blur-xl flex flex-col items-center justify-center transition-opacity duration-500">
              <div className="w-20 h-20 relative mb-8">
                <div className="absolute inset-0 border-4 border-tertiary/10 rounded-full" />
                <div className="absolute inset-0 border-4 border-t-tertiary rounded-full animate-spin" />
              </div>
              <div className="text-center space-y-3">
                <p className="font-headline text-xl font-bold text-on-surface">Analyzing safety records...</p>
                <p className="font-body text-slate-400 text-sm">Cross-referencing 50,000+ incident logs.</p>
              </div>
              <div className="w-64 h-1.5 bg-surface-container-highest rounded-full mt-8 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 3 }}
                  className="h-full bg-tertiary shadow-[0_0_15px_rgba(64,220,209,0.5)]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Recent Audits */}
       
      </div>
    </div>
  );
};
