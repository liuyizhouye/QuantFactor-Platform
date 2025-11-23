import React, { useState } from 'react';
import { generateFactorSuggestion } from '../services/geminiService';
import { FactorFrequency, Factor, FactorCategory } from '../types';
import { Sparkles, ArrowRight, Save, Copy, Loader2, Code2, BrainCircuit, AlertCircle } from 'lucide-react';

interface MiningViewProps {
  onAddFactor: (factor: Factor) => void;
}

const MiningView: React.FC<MiningViewProps> = ({ onAddFactor }) => {
  const [prompt, setPrompt] = useState('');
  const [frequency, setFrequency] = useState<FactorFrequency>(FactorFrequency.LOW_FREQ);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{name: string, formula: string, description: string, category: string, logic_explanation: string} | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateInput = (input: string): boolean => {
    if (!input.trim()) {
      setError("Please enter a research hypothesis.");
      return false;
    }
    
    // Prevent XSS/Script injection attempts
    // Checks for <script>, javascript: protocol, and common event handlers
    const dangerousPatterns = /<script\b[^>]*>|javascript:|on\w+=/i;
    if (dangerousPatterns.test(input)) {
      setError("Input contains potentially unsafe content.");
      return false;
    }
    
    if (input.length > 1000) {
      setError("Prompt is too long (max 1000 characters).");
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
      // Sanitize input by removing potential HTML tag brackets before sending to API
      const sanitizedPrompt = prompt.replace(/[<>]/g, '');
      const data = await generateFactorSuggestion(sanitizedPrompt, frequency);
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
      frequency,
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
    // Reset after save
    setResult(null);
    setPrompt('');
    setError(null);
  };

  return (
    <div className="h-full flex flex-col gap-6 p-8 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <BrainCircuit className="text-purple-500" size={32} />
          AI Factor Mining
        </h1>
        <p className="text-slate-400">Describe a market hypothesis, and the AI will formalize it into a mathematical factor.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
        {/* Input Section */}
        <div className="col-span-1 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-300 mb-2 block">Data Frequency</label>
              <div className="flex p-1 bg-slate-950 rounded-lg border border-slate-800">
                <button 
                  onClick={() => setFrequency(FactorFrequency.LOW_FREQ)}
                  className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${frequency === FactorFrequency.LOW_FREQ ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Daily (Low Freq)
                </button>
                <button 
                  onClick={() => setFrequency(FactorFrequency.HIGH_FREQ)}
                  className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${frequency === FactorFrequency.HIGH_FREQ ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Intraday (High Freq)
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-300 mb-2 block">Research Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => {
                    setPrompt(e.target.value);
                    if (error) setError(null);
                }}
                placeholder="e.g. Find stocks with high volume but low price movement, suggesting accumulation..."
                className={`w-full h-40 bg-slate-950 border rounded-lg p-4 text-slate-200 focus:outline-none focus:ring-2 placeholder:text-slate-600 resize-none text-sm font-sans ${
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
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              Generate Factor
            </button>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-400 mb-3">Example Prompts</h3>
            <ul className="space-y-3 text-sm text-slate-500">
              <li className="cursor-pointer hover:text-blue-400 transition-colors" onClick={() => { setPrompt("Reversal strategy based on RSI divergence over 14 days."); setError(null); }}>
                • RSI divergence reversal
              </li>
              <li className="cursor-pointer hover:text-blue-400 transition-colors" onClick={() => { setPrompt("Stocks near 52-week high with decreasing volatility."); setError(null); }}>
                • Low Volatility Breakout
              </li>
              <li className="cursor-pointer hover:text-blue-400 transition-colors" onClick={() => { setPrompt("High frequency order book imbalance predicting next tick."); setError(null); }}>
                • Order Book Imbalance (HF)
              </li>
            </ul>
          </div>
        </div>

        {/* Output Section */}
        <div className="col-span-1 lg:col-span-2">
          {result ? (
            <div className="h-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-block px-2 py-1 bg-purple-500/10 text-purple-400 text-xs font-bold rounded mb-2 border border-purple-500/20 uppercase tracking-wider">
                    {result.category}
                  </span>
                  <h2 className="text-2xl font-bold text-white">{result.name}</h2>
                  <p className="text-slate-400 mt-1">{result.description}</p>
                </div>
                <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
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
              <p>Generated factors will appear here...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MiningView;