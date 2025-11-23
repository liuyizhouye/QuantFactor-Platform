
import React, { useState } from 'react';
import { generateFactorSuggestion } from '../services/geminiService';
import { FactorFrequency, Factor, FactorCategory } from '../types';
import { Sparkles, ArrowRight, Save, Copy, Loader2, Code2, BrainCircuit, AlertCircle, Zap, Pickaxe } from 'lucide-react';

interface MiningViewProps {
  onAddFactor: (factor: Factor) => void;
  targetFrequency: FactorFrequency;
}

const MiningView: React.FC<MiningViewProps> = ({ onAddFactor, targetFrequency }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{name: string, formula: string, description: string, category: string, logic_explanation: string} | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isHighFreq = targetFrequency === FactorFrequency.HIGH_FREQ;

  const validateInput = (input: string): boolean => {
    if (!input.trim()) {
      setError("Please enter a research hypothesis.");
      return false;
    }
    
    // Prevent XSS/Script injection attempts
    const dangerousPatterns = /<script\b[^>]*>|javascript:|on\w+=/i;
    if (dangerousPatterns.test(input)) {
      setError("Input contains potentially unsafe content.");
      return false;
    }
    
    if (input.length > 5000) {
      setError("Prompt is too long (max 5000 characters).");
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
    setResult(null);
    setPrompt('');
    setError(null);
  };

  return (
    <div className="h-full overflow-y-auto flex flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto pb-20 md:pb-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 min-h-0">
        {/* Input Section */}
        <div className="col-span-1 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-6 shadow-xl flex flex-col gap-4">
            
            {/* Status Indicator */}
            <div className="flex items-center gap-2 p-3 bg-slate-950 rounded-lg border border-slate-800">
               <div className={`w-2 h-2 rounded-full ${isHighFreq ? 'bg-orange-500 animate-pulse' : 'bg-blue-500'}`}></div>
               <span className="text-xs font-mono text-slate-400 uppercase">
                  Mode: <span className="text-slate-200 font-bold">{isHighFreq ? 'Intraday (Microstructure)' : 'Daily (Interday)'}</span>
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
                    ? "e.g. Detect order book imbalance spikes 500ms before price jumps..." 
                    : "e.g. Find stocks with decreasing volume on down days (accumulation)..."}
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

          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 md:p-6 hidden md:block">
            <h3 className="text-sm font-semibold text-slate-400 mb-3">Example Prompts</h3>
            <ul className="space-y-3 text-sm text-slate-500">
              {isHighFreq ? (
                <>
                  <li className="cursor-pointer hover:text-orange-400 transition-colors" onClick={() => setPrompt("Order book imbalance delta predicting next tick direction.")}>• Order Flow Imbalance</li>
                  <li className="cursor-pointer hover:text-orange-400 transition-colors" onClick={() => setPrompt("Volume Weighted Average Price (VWAP) reversion on 1-min bars.")}>• VWAP Mean Reversion</li>
                  <li className="cursor-pointer hover:text-orange-400 transition-colors" onClick={() => setPrompt("Bid-Ask spread expansion during high volatility events.")}>• Spread Arbitrage</li>
                </>
              ) : (
                 <>
                  <li className="cursor-pointer hover:text-blue-400 transition-colors" onClick={() => setPrompt("Reversal strategy based on RSI divergence over 14 days.")}>• RSI divergence reversal</li>
                  <li className="cursor-pointer hover:text-blue-400 transition-colors" onClick={() => setPrompt("Stocks near 52-week high with decreasing volatility.")}>• Low Volatility Breakout</li>
                  <li className="cursor-pointer hover:text-blue-400 transition-colors" onClick={() => setPrompt("High momentum coupled with fundamental value growth.")}>• Growth at Reasonable Price</li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Output Section */}
        <div className="col-span-1 lg:col-span-2">
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
                 <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">Alpha Logic</h3>
                 <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                    {result.logic_explanation}
                 </p>
              </div>
            </div>
          ) : (
            <div className="min-h-[300px] h-full bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-600 gap-4 p-8">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                 <ArrowRight size={24} className="text-slate-600" />
              </div>
              <p className="text-center">Generated factors will appear here...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MiningView;