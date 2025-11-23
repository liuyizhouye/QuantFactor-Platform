import React, { useState } from 'react';
import { Factor, FactorCategory, FactorFrequency } from '../types';
import { generateFactorCombination } from '../services/geminiService';
import { FlaskConical, Plus, Check, Save, Loader2, ArrowRight, Layers, Code2, ShieldAlert, SlidersHorizontal } from 'lucide-react';

interface CombinationViewProps {
  factors: Factor[];
  onAddFactor: (factor: Factor) => void;
}

const CombinationView: React.FC<CombinationViewProps> = ({ factors, onAddFactor }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{name: string, formula: string, description: string, category: string, logic_explanation: string} | null>(null);

  // Risk Settings
  const [sectorNeutral, setSectorNeutral] = useState(false);
  const [styleNeutral, setStyleNeutral] = useState(false);
  const [maxDrawdown, setMaxDrawdown] = useState('');
  const [targetVol, setTargetVol] = useState('');

  const toggleFactor = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleCombine = async () => {
    if (selectedIds.size < 2) return;
    setLoading(true);
    setResult(null);

    const selectedFactors = factors.filter(f => selectedIds.has(f.id));
    
    try {
      const riskConfig = {
        sectorNeutral,
        styleNeutral,
        maxDrawdown: maxDrawdown || undefined,
        targetVol: targetVol || undefined
      };

      const data = await generateFactorCombination(selectedFactors, goal, riskConfig);
      setResult(data);
    } catch (error) {
      console.error("Failed to combine factors", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!result) return;
    const newFactor: Factor = {
      id: Date.now().toString(),
      name: result.name,
      description: result.description,
      formula: result.formula,
      frequency: FactorFrequency.LOW_FREQ, // Defaulting to Low Freq for composites usually, could be inferred
      category: result.category as FactorCategory,
      createdAt: new Date().toISOString(),
      performance: {
        sharpe: 0,
        ic: 0,
        annualizedReturn: 0,
        maxDrawdown: 0
      }
    };
    onAddFactor(newFactor);
    setResult(null);
    setSelectedIds(new Set());
    setGoal('');
    setSectorNeutral(false);
    setStyleNeutral(false);
    setMaxDrawdown('');
    setTargetVol('');
  };

  return (
    <div className="h-full flex flex-col p-8 max-w-7xl mx-auto gap-6 overflow-y-auto">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <FlaskConical className="text-pink-500" size={32} />
          Factor Lab
        </h1>
        <p className="text-slate-400">Combine existing alpha signals and apply risk controls.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-0">
        
        {/* Left Panel: Factor Selection */}
        <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col min-h-0 shadow-lg">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Available Factors</span>
                <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">{selectedIds.size} selected</span>
            </h3>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 max-h-[600px]">
                {factors.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-sm">
                        No factors in library. Go to Mining to create some first.
                    </div>
                ) : (
                    factors.map(factor => {
                        const isSelected = selectedIds.has(factor.id);
                        return (
                            <div 
                                key={factor.id}
                                onClick={() => toggleFactor(factor.id)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                    isSelected 
                                    ? 'bg-blue-600/10 border-blue-600/50' 
                                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h4 className={`text-sm font-semibold ${isSelected ? 'text-blue-300' : 'text-slate-300'}`}>{factor.name}</h4>
                                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{factor.description}</p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                        isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-600'
                                    }`}>
                                        {isSelected && <Check size={12} className="text-white" />}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
          </div>
        </div>

        {/* Right Panel: Configuration & Output */}
        <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Strategy & Risk Configuration */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
                
                {/* User Goal */}
                <div>
                    <label className="text-sm font-semibold text-slate-300 mb-2 block">Combination Goal</label>
                    <input 
                        type="text" 
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder="e.g. Maximize Sharpe ratio while minimizing turnover..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                    />
                </div>

                {/* Risk Control Section */}
                <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800">
                    <div className="flex items-center gap-2 mb-4">
                        <ShieldAlert className="text-orange-500" size={18} />
                        <h3 className="text-sm font-bold text-slate-300 uppercase">Risk Management & Barra Model</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Neutrality Settings */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${sectorNeutral ? 'bg-emerald-600 border-emerald-600' : 'border-slate-600 bg-slate-900'}`}>
                                    {sectorNeutral && <Check size={14} className="text-white" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={sectorNeutral} onChange={() => setSectorNeutral(!sectorNeutral)} />
                                <div>
                                    <span className="text-sm text-slate-300 font-medium group-hover:text-emerald-400 transition-colors">Sector Neutrality</span>
                                    <p className="text-[10px] text-slate-500">Residualize against Barra Sector factors</p>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${styleNeutral ? 'bg-emerald-600 border-emerald-600' : 'border-slate-600 bg-slate-900'}`}>
                                    {styleNeutral && <Check size={14} className="text-white" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={styleNeutral} onChange={() => setStyleNeutral(!styleNeutral)} />
                                <div>
                                    <span className="text-sm text-slate-300 font-medium group-hover:text-emerald-400 transition-colors">Style Neutrality</span>
                                    <p className="text-[10px] text-slate-500">Neutralize Size, Momentum, Value exposure</p>
                                </div>
                            </label>
                        </div>

                        {/* Constraints */}
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">Max Drawdown Constraint (%)</label>
                                <input 
                                    type="number" 
                                    value={maxDrawdown}
                                    onChange={(e) => setMaxDrawdown(e.target.value)}
                                    placeholder="e.g. 15"
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
                                />
                            </div>
                             <div>
                                <label className="text-xs text-slate-400 mb-1 block">Target Volatility (%)</label>
                                <input 
                                    type="number" 
                                    value={targetVol}
                                    onChange={(e) => setTargetVol(e.target.value)}
                                    placeholder="e.g. 10"
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <div className="flex justify-end pt-2">
                    <button 
                        onClick={handleCombine}
                        disabled={loading || selectedIds.size < 2}
                        className="px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-semibold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all w-full md:w-auto justify-center"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Layers size={18} />}
                        Synthesize & Optimize
                    </button>
                </div>
                 {selectedIds.size < 2 && (
                    <p className="text-xs text-orange-400 text-center">
                         Select at least 2 factors to combine.
                    </p>
                )}
            </div>

            {/* Result Area */}
            <div className="flex-1 min-h-[300px]">
                {result ? (
                    <div className="h-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex gap-2 mb-2">
                                     <span className="inline-block px-2 py-1 bg-pink-500/10 text-pink-400 text-xs font-bold rounded border border-pink-500/20 uppercase tracking-wider">
                                        {result.category}
                                    </span>
                                    {(sectorNeutral || styleNeutral) && (
                                        <span className="inline-block px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded border border-emerald-500/20 uppercase tracking-wider flex items-center gap-1">
                                            <ShieldAlert size={10} /> Risk Neutral
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-2xl font-bold text-white">{result.name}</h2>
                                <p className="text-slate-400 mt-1">{result.description}</p>
                            </div>
                            <button 
                                onClick={handleSave}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                <Save size={16} />
                                Save Composite
                            </button>
                        </div>

                        <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                            <div className="bg-slate-900/50 px-4 py-2 border-b border-slate-800 flex items-center gap-2">
                                <Code2 size={14} className="text-slate-400" />
                                <span className="text-xs font-mono text-slate-400">optimized_factor.py</span>
                            </div>
                            <div className="p-4 overflow-x-auto">
                                <pre className="text-sm font-mono text-pink-300">
                                    <code>{result.formula}</code>
                                </pre>
                            </div>
                        </div>

                        <div className="flex-1 bg-slate-900/50 rounded-lg p-6 border border-slate-800/50">
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">Synthesis & Risk Logic</h3>
                            <p className="text-slate-300 leading-relaxed">
                                {result.logic_explanation}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="h-full bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-600 gap-4">
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                            <ArrowRight size={24} className="text-slate-600" />
                        </div>
                        <p>Select factors, configure risk settings, and click Synthesize.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CombinationView;