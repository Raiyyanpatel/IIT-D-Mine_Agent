import React, { useState } from 'react';
import { 
  Camera, 
  Upload, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  Layers, 
  HardHat, 
  FileText, 
  Loader2, 
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { inspectMineImage } from '../services/geminiService';

export const VisionInspectorScreen: React.FC = () => {
  // Real high-resolution mining photography presets for geotechnical & PPE audits
  const presets = [
    {
      id: 'highwall_crack',
      name: 'Highwall Tension Crack',
      category: 'Geotechnical (Opencast)',
      filename: 'opencast_bench3_tension_crack.jpg',
      description: 'Opencast Bench 3 displaying sub-vertical tension fractures and crest seepage.',
      imageUrl: '/samples/highwall_crack.jpg',
    },
    {
      id: 'roof_sag',
      name: 'Underground Roof Sag & Strata Fracture',
      category: 'Strata Control',
      filename: 'underground_face_roof_sag.jpg',
      description: 'Underground Longwall gate road exhibiting delamination and bed separation.',
      imageUrl: '/samples/roof_sag.jpg',
    },
    {
      id: 'ppe_audit',
      name: 'Shaft Bank PPE Audit',
      category: 'Human Safety & PPE',
      filename: 'shaft_bank_workers_ppe.jpg',
      description: 'CCTV snapshot of underground personnel assembly during shift interchange.',
      imageUrl: '/samples/ppe_audit.jpg',
    },
    {
      id: 'safe_gallery',
      name: 'Compliant Supported Gallery',
      category: 'Statutory Compliance (Safe)',
      filename: 'safe_supported_gallery_normal.jpg',
      description: 'Exemplary underground roadway with systematic steel arches and 100% PPE.',
      imageUrl: '/samples/safe_gallery.jpg',
    },
  ];

  const [selectedImage, setSelectedImage] = useState<string | null>(presets[0].imageUrl);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [activeSample, setActiveSample] = useState<string | null>(presets[0].id);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setActiveSample(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreset = (preset: typeof presets[0]) => {
    setActiveSample(preset.id);
    setSelectedImage(preset.imageUrl);
    setImageFile(null);
    setAnalysisResult(null);
  };

  const runInspection = async () => {
    if (!selectedImage && !imageFile) return;
    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      let result;
      if (imageFile) {
        result = await inspectMineImage(imageFile);
      } else if (selectedImage) {
        const activePreset = presets.find(p => p.id === activeSample);
        if (selectedImage.startsWith('/samples/') || selectedImage.startsWith('http')) {
          const res = await fetch(selectedImage);
          const blob = await res.blob();
          const file = new File([blob], activePreset?.filename || 'mine_inspection.jpg', { type: blob.type || 'image/jpeg' });
          result = await inspectMineImage(file);
        } else {
          result = await inspectMineImage(selectedImage, activePreset?.filename || 'inspection.jpg');
        }
      }
      setAnalysisResult(result);
    } catch (err) {
      console.error('Inspection failed:', err);
      alert('Error communicating with Vision AI service. Ensure backend is running.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk?.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'WARNING': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      default: return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  return (
    <div className="min-h-screen py-8 max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Multimodal AI Vision & Inspection
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight font-headline">
          Visual Hazard & PPE Inspector
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto mt-2">
          Autonomous computer-vision inspection for Rock Mass Rating (RMR), highwall fractures, roof sag, and CCTV personal protective equipment (PPE) compliance under DGMS guidelines.
        </p>
      </div>

      {/* Preset Selector */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Select Sample Mine Image or Upload Custom Photo:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className={`p-3 text-left rounded-xl border transition-all ${
                activeSample === preset.id
                  ? 'bg-orange-500/10 border-orange-500 text-white shadow-lg shadow-orange-500/5'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">{preset.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  {preset.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-1">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Upload & Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Image Canvas */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden">
            {selectedImage ? (
              <div className="w-full relative group">
                <img
                  src={selectedImage}
                  alt="Mine Inspection Subject"
                  className="w-full h-80 object-cover rounded-xl border border-slate-700/50 shadow-inner"
                />
                {analyzing && (
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center rounded-xl">
                    <Loader2 className="w-10 h-10 text-orange-400 animate-spin mb-3" />
                    <span className="text-sm font-semibold text-white tracking-wide">
                      Analyzing Rock Strata & PPE Telemetry...
                    </span>
                    <span className="text-xs text-slate-400 mt-1">
                      Querying Gemini Flash Vision & DGMS Rule Engine
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-80 border-2 border-dashed border-slate-700 hover:border-orange-500/50 rounded-xl cursor-pointer bg-slate-950/40 hover:bg-slate-950/70 transition-all p-6 text-center">
                <Camera className="w-12 h-12 text-slate-500 mb-3" />
                <span className="text-sm font-semibold text-slate-200">Upload Site Photo or Drop Image Here</span>
                <span className="text-xs text-slate-500 mt-1">Supports Highwall photos, roof bolting grids, and CCTV captures</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            )}

            {/* Actions below image */}
            <div className="w-full flex items-center justify-between mt-4 gap-3">
              <label className="cursor-pointer text-xs font-medium text-slate-400 hover:text-white px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                Upload Custom Photo
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>

              <button
                onClick={runInspection}
                disabled={!selectedImage || analyzing}
                className="flex-1 max-w-[200px] text-xs font-semibold bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-slate-950 py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/20"
              >
                {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Analyze Hazard
              </button>
            </div>
          </div>
        </div>

        {/* Right: Inspection Diagnostics Card */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 min-h-[420px] flex flex-col">
            {analysisResult ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Header Status Row */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider block">Scene Identified</span>
                    <span className="text-base font-bold text-white">{analysisResult.scene_type}</span>
                    {analysisResult.provider && (
                      <span className="text-[10px] text-orange-400/80 font-mono block mt-0.5">
                        • {analysisResult.provider}
                      </span>
                    )}
                  </div>
                  <div className={`px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${getRiskColor(analysisResult.risk_level)}`}>
                    {analysisResult.risk_level === 'SAFE' ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    )}
                    {analysisResult.risk_level === 'SAFE' ? 'SAFE / COMPLIANT' : `${analysisResult.risk_level} HAZARD`}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  <span className="font-semibold text-white block mb-0.5">Vision Summary:</span>
                  {analysisResult.summary}
                </div>

                {/* Geotechnical Analysis */}
                {analysisResult.geotechnical_analysis?.detected && (
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                    <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">
                      <Layers className="w-4 h-4" />
                      Geotechnical & Strata Assessment
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="bg-slate-900 p-2 rounded border border-slate-800">
                        <span className="text-slate-500 block">RMR Classification</span>
                        <span className="font-semibold text-white">{analysisResult.geotechnical_analysis.rmr_estimate}</span>
                      </div>
                      <div className="bg-slate-900 p-2 rounded border border-slate-800">
                        <span className="text-slate-500 block">Fracture Intensity</span>
                        <span className="font-semibold text-white">{analysisResult.geotechnical_analysis.fracture_intensity}</span>
                      </div>
                      <div className="bg-slate-900 p-2 rounded border border-slate-800">
                        <span className="text-slate-500 block">Water Seepage</span>
                        <span className="font-semibold text-white">{analysisResult.geotechnical_analysis.water_seepage}</span>
                      </div>
                      <div className="bg-slate-900 p-2 rounded border border-slate-800">
                        <span className="text-slate-500 block">Support Condition</span>
                        <span className="font-semibold text-white">{analysisResult.geotechnical_analysis.roof_support_condition}</span>
                      </div>
                    </div>
                    {analysisResult.geotechnical_analysis.hazards_found?.length > 0 && (
                      <ul className="space-y-1">
                        {analysisResult.geotechnical_analysis.hazards_found.map((h: string, idx: number) => (
                          <li key={idx} className="text-xs text-red-300 flex items-start gap-1.5">
                            <span className="text-red-500 mt-0.5">•</span>
                            {h}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* PPE Compliance */}
                {analysisResult.ppe_compliance?.detected && (
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                      <HardHat className="w-4 h-4" />
                      Personal Protective Equipment (PPE) Compliance
                    </div>
                    <div className="flex items-center gap-4 text-xs mb-2">
                      <span className={`inline-flex items-center gap-1 ${analysisResult.ppe_compliance.helmet_detected ? 'text-emerald-400' : 'text-red-400'}`}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Helmet
                      </span>
                      <span className={`inline-flex items-center gap-1 ${analysisResult.ppe_compliance.high_vis_vest_detected ? 'text-emerald-400' : 'text-red-400'}`}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Reflective Vest
                      </span>
                    </div>
                    {analysisResult.ppe_compliance.violations?.length > 0 && (
                      <div className="text-xs text-yellow-300">
                        <strong>Violations:</strong> {analysisResult.ppe_compliance.violations.join(', ')}
                      </div>
                    )}
                  </div>
                )}

                {/* Statutory Reference */}
                <div className="bg-orange-500/5 border border-orange-500/20 p-3 rounded-xl text-xs">
                  <div className="flex items-center gap-1.5 text-orange-400 font-semibold mb-1">
                    <FileText className="w-3.5 h-3.5" />
                    Statutory DGMS / CMR 2017 Regulation:
                  </div>
                  <span className="text-slate-300">{analysisResult.dgms_statutory_reference}</span>
                </div>

                {/* Action Items */}
                <div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider block mb-1.5">
                    Mandatory Operational Actions:
                  </span>
                  <ul className="space-y-1.5">
                    {analysisResult.immediate_actions?.map((act: string, idx: number) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/60 p-2 rounded border border-slate-800">
                        <span className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        {act}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 p-8">
                <ShieldCheck className="w-12 h-12 text-slate-700 mb-3" />
                <h3 className="text-base font-semibold text-slate-300 mb-1">Awaiting Image Inspection</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Select one of the sample mining scenarios above or upload your own site photo to trigger real-time Multimodal Vision analysis.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
