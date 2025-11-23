import React, { useState } from 'react';
import { generateFactorSuggestion } from '../services/geminiService';
import { FactorFrequency, Factor, FactorCategory } from '../types';
import { Sparkles, ArrowRight, Save, Copy, Loader2, Code2, BrainCircuit, AlertCircle, Zap, Pickaxe, Database, Info } from 'lucide-react';
import { useNotification } from '../App';

interface MiningViewProps {
  onAddFactor: (factor: Factor) => void;
  targetFrequency: FactorFrequency;
}

const MiningView: React.FC<MiningViewProps> = ({ onAddFactor, targetFrequency }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{name: string, formula: string, description: string, category: string, logic_explanation: string} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDictionary, setShowDictionary] = useState(true);

  const notify = useNotification();
  const isHighFreq = targetFrequency === FactorFrequency.HIGH_FREQ;

  // --- DATA DICTIONARY DEFINITION ---
  const LF_COLUMNS = [
      { category: 'Market Data', fields: ['open', 'high', 'low', 'close', 'volume', 'vwap', 'turnover'] },
      { category: 'Fundamentals (Quarterly)', fields: ['pe_ttm', 'pb_ratio', 'roe_ttm', 'net_income_growth', 'debt_to_equity', 'gross_margin'] },
      { category: 'Analyst Estimates', fields: ['eps_surprise', 'rating_avg', 'target_price'] },
  ];

  const HF_COLUMNS = [
      { category: 'Tick/Bar Data', fields: ['close', 'volume', 'vwap', 'timestamp_ms'] },
      { category: 'Order Book (L2)', fields: ['bid_price_1', 'ask_price_1', 'bid_size_1', 'ask_size_1', 'spread_bps'] },
      { category: 'Order Flow', fields: ['buy_volume', 'sell_volume', 'trade_count'] },
  ];

  const currentColumns = isHighFreq ? HF_COLUMNS : LF_COLUMNS;

  const validateInput = (input: string): boolean => {
    if (!input.trim()) {
      setError("Please enter a research hypothesis.");
      notify('error', "Please enter a research hypothesis.");
      return false;
    }
    
    // Prevent XSS/Script injection attempts
    const dangerousPatterns = /<script\b[^>]*>|javascript:|on\w+=/i;
    if (dangerousPatterns.test(input)) {
      setError("Input contains potentially unsafe content.");
      notify('error', "Input detected as potentially unsafe.");
      return false;
    }
    
    if (input.length > 5000) {
      setError("Prompt is too long (max 5000 characters).");
      notify('error', "Prompt is too long.");
      return false;
    }

    return true;
  };

  const handleMine = async () => {
    setError(null);
    
    if (!validateInput(prompt)) return;

    setLoading(true);
    setResult(null);
    
    try {
      const sanitizedPrompt = prompt.replace(/[<>]/g, '');
      const data = await generateFactorSuggestion(sanitizedPrompt, targetFrequency);
      setResult(data);
    } catch (error) {
      console.error("Failed to mine factor", error);
      setError("Failed to generate factor analysis. Please try again.");
      notify('error', "Failed to generate factor. Check API connection.");
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
      frequency: targetFrequency,
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
    notify('success', `Saved factor: ${result.name}`);
    setResult(null);
    setPrompt('');
    setError(null);
  };

  const insertField = (field: string) => {
      setPrompt(prev => prev + ` using ${field} `);
  };

  return (
    <div className="h-full overflow-y-auto flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto pb-20 md:pb-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          {isHighFreq ? <Zap className="text-orange-500" size={32} /> : <Pickaxe className="text-blue-500" size={32} />}
          {isHighFreq ? 'HFT Factor Mining' : 'Alpha Factor Mining'}
        </h1>
        <p className="text-slate-400 text-sm md:text-base">
          {isHighFreq 
            ? "Discover high-frequency microstructure signals using order book dynamics and tick data."
            : "Generate low-frequency alpha factors based on daily price action and fundamental logic."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 min-h-0">
        
        {/* Input Section */}
        <div className="lg:col-span-8 flex flex-col gap-4 order-2 lg:order-1">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-6 shadow-xl flex flex-col gap-4">
            
            {/* Status Indicator */}
            <div className="flex items-center gap-2 p-3 bg-slate-950 rounded-lg border border-slate-800">
               <div className={`w-2 h-2 rounded-full ${isHighFreq ? 'bg-orange-500 animate-pulse' : 'bg-blue-500'}`}></div>
               <span className="text-xs font-mono text-slate-400 uppercase">
                  Mode: <span className="text-slate-200 font-bold">{isHighFreq ? 'Intraday (Microstructure)' : 'Daily (Fundamentals/Price)'}</span>
               </span>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-300 mb-2 block">Research Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => {
                    setPrompt(e.target.value);
                    if (error) setError(null);
                }}
                placeholder={isHighFreq 
                    ? "e.g. Detect order book imbalance spikes in 'bid_size_1' vs 'ask_size_1'..." 
                    : "e.g. Rank stocks by 'roe_ttm' and filter for low 'pe_ttm'..."}
                className={`w-full h-32 md:h-40 bg-slate-950 border rounded-lg p-4 text-slate-200 focus:outline-none focus:ring-2 placeholder:text-slate-600 resize-none text-sm font-sans ${
                    error 
                    ? 'border-red-500/50 focus:ring-red-500/50' 
                    : 'border-slate-800 focus:ring-blue-500/50'
                }`}
              />
              {error && (
                <div className="flex items-center gap-2 mt-2 text-red-400 text-xs animate-in slide-in-from-top-1">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleMine}
              disabled={loading || !prompt}
              className={`w-full py-3 text-white font-semibold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all ${
                  isHighFreq 
                  ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 shadow-orange-900/20'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-900/20'
              }`}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              Generate Factor
            </button>
          </div>

          {/* Results Area */}
          {result ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-8 shadow-xl flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <span className="inline-block px-2 py-1 bg-purple-500/10 text-purple-400 text-xs font-bold rounded mb-2 border border-purple-500/20 uppercase tracking-wider">
                    {result.category}
                  </span>
                  <h2 className="text-2xl font-bold text-white">{result.name}</h2>
                  <p className="text-slate-400 mt-1">{result.description}</p>
                </div>
                <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors w-full sm:w-auto justify-center"
                >
                    <Save size={16} />
                    Save to Library
                </button>
              </div>

              <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                <div className="bg-slate-900/50 px-4 py-2 border-b border-slate-800 flex items-center gap-2">
                  <Code2 size={14} className="text-slate-400" />
                  <span className="text-xs font-mono text-slate-400">factor_logic.py</span>
                </div>
                <div className="p-4 overflow-x-auto">
                    <pre className="text-sm font-mono text-blue-300">
                        <code>{result.formula}</code>
                    </pre>
                </div>
              </div>

              <div className="flex-1 bg-slate-900/50 rounded-lg p-6 border border-slate-800/50">
                 <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">Alpha Logic & Data Usage</h3>
                 <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                    {result.logic_explanation}
                 </p>
              </div>
            </div>
          ) : (
            <div className="min-h-[200px] h-full bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-600 gap-4 p-8">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                 <ArrowRight size={24} className="text-slate-600" />
              </div>
              <p className="text-center">Generated factors will appear here...</p>
            </div>
          )}
        </div>

        {/* Right Panel: Data Dictionary */}
        <div className="lg:col-span-4 order-1 lg:order-2">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg sticky top-6">
                 <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-200 flex items-center gap-2">
                        <Database size={16} className="text-purple-500" /> Data Dictionary
                    </h3>
                    <div className="text-[10px] text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                        {isHighFreq ? 'TickDB' : 'FundamentalsDB'}
                    </div>
                </div>
                
                <div className="p-4 bg-blue-900/10 border-b border-blue-900/20">
                     <div className="flex gap-2">
                        <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-200 leading-relaxed">
                            These are the valid fields available in our database. The AI will strictly use these columns to ensure the code is executable.
                        </p>
                     </div>
                </div>

                <div className="p-2 overflow-y-auto max-h-[500px] space-y-4">
                    {currentColumns.map((group, idx) => (
                        <div key={idx} className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1">
                                {group.category}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {group.fields.map(field => (
                                    <button 
                                        key={field}
                                        onClick={() => insertField(field)}
                                        className="px-2 py-1 text-xs font-mono rounded bg-slate-900 border border-slate-700 text-slate-300 hover:border-purple-500 hover:text-purple-400 transition-colors text-left"
                                        title="Click to insert into prompt"
                                    >
                                        {field}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default MiningView;