
import React, { useState, useMemo } from 'react';
import { generateFactorSuggestion } from '../services/geminiService';
import { FactorFrequency, Factor, FactorCategory } from '../types';
import { Sparkles, ArrowRight, Save, Copy, Loader2, Code2, BrainCircuit, AlertCircle, Zap, Pickaxe, Database, Info, Search, ChevronDown, ChevronRight, SidebarClose, SidebarOpen, Hash, AlignLeft } from 'lucide-react';
import { useNotification } from '../App';

interface MiningViewProps {
  onAddFactor: (factor: Factor) => void;
  targetFrequency: FactorFrequency;
}

// Extended Field Definition for Scalability
interface DataField {
    name: string;
    type: 'float' | 'int' | 'string' | 'datetime' | 'bool';
    desc: string;
}

interface DataCategory {
    category: string;
    fields: DataField[];
}

const MiningView: React.FC<MiningViewProps> = ({ onAddFactor, targetFrequency }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{name: string, formula: string, description: string, category: string, logic_explanation: string} | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Data Dictionary State
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
      'Market Data': true, 
      'Tick/Bar Data': true
  });

  const notify = useNotification();
  const isHighFreq = targetFrequency === FactorFrequency.HIGH_FREQ;

  // --- DATA DICTIONARY DEFINITION (SCALABLE) ---
  const LF_COLUMNS: DataCategory[] = [
      { 
          category: 'Market Data', 
          fields: [
              { name: 'open', type: 'float', desc: 'Opening price (Adj)' },
              { name: 'high', type: 'float', desc: 'High price (Adj)' },
              { name: 'low', type: 'float', desc: 'Low price (Adj)' },
              { name: 'close', type: 'float', desc: 'Closing price (Adj)' },
              { name: 'volume', type: 'float', desc: 'Trading volume' },
              { name: 'vwap', type: 'float', desc: 'Volume Weighted Avg Price' },
              { name: 'turnover', type: 'float', desc: 'Total turnover value' },
              { name: 'returns', type: 'float', desc: 'Daily percentage return' },
              { name: 'cap', type: 'float', desc: 'Market Capitalization' }
          ] 
      },
      { 
          category: 'Fundamentals (Quarterly)', 
          fields: [
              { name: 'pe_ttm', type: 'float', desc: 'Price to Earnings (Trailing 12M)' },
              { name: 'pb_ratio', type: 'float', desc: 'Price to Book Ratio' },
              { name: 'ps_ratio', type: 'float', desc: 'Price to Sales Ratio' },
              { name: 'roe_ttm', type: 'float', desc: 'Return on Equity (TTM)' },
              { name: 'roa_ttm', type: 'float', desc: 'Return on Assets (TTM)' },
              { name: 'net_income_growth', type: 'float', desc: 'Net Income Growth (YoY)' },
              { name: 'revenue_growth', type: 'float', desc: 'Revenue Growth (YoY)' },
              { name: 'debt_to_equity', type: 'float', desc: 'Total Debt / Total Equity' },
              { name: 'gross_margin', type: 'float', desc: 'Gross Profit / Revenue' },
              { name: 'free_cash_flow', type: 'float', desc: 'FCF per share' }
          ] 
      },
      { 
          category: 'Analyst Estimates', 
          fields: [
              { name: 'eps_surprise', type: 'float', desc: 'Actual EPS - Estimated EPS' },
              { name: 'rating_avg', type: 'float', desc: 'Consensus Rating (1=Buy, 5=Sell)' },
              { name: 'target_price', type: 'float', desc: 'Mean Target Price' },
              { name: 'revisions_up', type: 'int', desc: 'Num analysts revising up' }
          ] 
      },
      {
          category: 'Alternative Data',
          fields: [
              { name: 'sentiment_score', type: 'float', desc: 'News sentiment (-1 to 1)' },
              { name: 'social_volume', type: 'int', desc: 'Social media mention count' },
              { name: 'esg_score', type: 'float', desc: 'Composite ESG Score' }
          ]
      }
  ];

  const HF_COLUMNS: DataCategory[] = [
      { 
          category: 'Tick/Bar Data', 
          fields: [
              { name: 'close', type: 'float', desc: '1-min Close Price' },
              { name: 'volume', type: 'int', desc: '1-min Volume' },
              { name: 'vwap', type: 'float', desc: '1-min VWAP' },
              { name: 'timestamp_ms', type: 'int', desc: 'Unix Timestamp (ms)' },
              { name: 'high', type: 'float', desc: '1-min High' },
              { name: 'low', type: 'float', desc: '1-min Low' }
          ] 
      },
      { 
          category: 'Order Book (L2)', 
          fields: [
              { name: 'bid_price_1', type: 'float', desc: 'Best Bid Price' },
              { name: 'ask_price_1', type: 'float', desc: 'Best Ask Price' },
              { name: 'bid_size_1', type: 'int', desc: 'Size at Best Bid' },
              { name: 'ask_size_1', type: 'int', desc: 'Size at Best Ask' },
              { name: 'bid_price_2', type: 'float', desc: 'L2 Bid Price' },
              { name: 'ask_price_2', type: 'float', desc: 'L2 Ask Price' },
              { name: 'spread_bps', type: 'float', desc: 'Bid-Ask Spread (bps)' },
              { name: 'mid_price', type: 'float', desc: '(Bid+Ask)/2' },
              { name: 'imbalance', type: 'float', desc: 'Order Book Imbalance Ratio' }
          ] 
      },
      { 
          category: 'Order Flow', 
          fields: [
              { name: 'buy_volume', type: 'int', desc: 'Aggressive Buy Volume' },
              { name: 'sell_volume', type: 'int', desc: 'Aggressive Sell Volume' },
              { name: 'trade_count', type: 'int', desc: 'Number of trades' },
              { name: 'avg_trade_size', type: 'float', desc: 'Avg size per trade' }
          ] 
      },
  ];

  const currentColumns = isHighFreq ? HF_COLUMNS : LF_COLUMNS;

  // Filter Logic
  const filteredColumns = useMemo(() => {
      if (!searchTerm) return currentColumns;
      const lowerTerm = searchTerm.toLowerCase();
      
      return currentColumns.map(cat => ({
          ...cat,
          fields: cat.fields.filter(f => 
              f.name.toLowerCase().includes(lowerTerm) || 
              f.desc.toLowerCase().includes(lowerTerm)
          )
      })).filter(cat => cat.fields.length > 0);
  }, [currentColumns, searchTerm]);

  const toggleCategory = (catName: string) => {
      setExpandedCategories(prev => ({
          ...prev,
          [catName]: !prev[catName]
      }));
  };

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
      setPrompt(prev => prev + ` ${field} `);
      // Optional: Flash focus or simple feedback could go here
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

      <div className="flex flex-col lg:flex-row gap-6 md:gap-8 min-h-0 relative">
        
        {/* Input Section (Flexible Width) */}
        <div className={`flex flex-col gap-4 order-2 lg:order-1 transition-all duration-300 ${isDictionaryOpen ? 'lg:w-2/3 xl:w-3/4' : 'lg:w-full'}`}>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-6 shadow-xl flex flex-col gap-4">
            
            {/* Status Indicator */}
            <div className="flex items-center gap-2 p-3 bg-slate-950 rounded-lg border border-slate-800">
               <div className={`w-2 h-2 rounded-full ${isHighFreq ? 'bg-orange-500 animate-pulse' : 'bg-blue-500'}`}></div>
               <span className="text-xs font-mono text-slate-400 uppercase">
                  Mode: <span className="text-slate-200 font-bold">{isHighFreq ? 'Intraday (Microstructure)' : 'Daily (Fundamentals/Price)'}</span>
               </span>
               {!isDictionaryOpen && (
                   <button 
                    onClick={() => setIsDictionaryOpen(true)}
                    className="ml-auto text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                   >
                       <SidebarOpen size={14} /> Open Data Dictionary
                   </button>
               )}
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
                className={`w-full h-32 md:h-40 bg-slate-950 border rounded-lg p-4 text-slate-200 focus:outline-none focus:ring-2 placeholder:text-slate-600 resize-none text-sm font-sans font-mono leading-relaxed ${
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

        {/* Right Panel: Data Dictionary (Collapsible) */}
        {isDictionaryOpen && (
            <div className="lg:w-1/3 xl:w-1/4 order-1 lg:order-2 flex flex-col min-h-[500px]">
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg sticky top-6 max-h-[calc(100vh-100px)] flex flex-col">
                     {/* Header */}
                     <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between shrink-0">
                        <h3 className="font-bold text-slate-200 flex items-center gap-2 text-sm">
                            <Database size={16} className="text-purple-500" /> Schema Explorer
                        </h3>
                        <div className="flex items-center gap-2">
                             <div className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                {filteredColumns.reduce((acc, cat) => acc + cat.fields.length, 0)} fields
                            </div>
                            <button onClick={() => setIsDictionaryOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                                <SidebarClose size={16} />
                            </button>
                        </div>
                    </div>
                    
                    {/* Search Bar */}
                    <div className="p-3 border-b border-slate-800 bg-slate-900 shrink-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                            <input 
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search fields (e.g. 'vol', 'bid')..."
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
                            />
                        </div>
                    </div>

                    {/* Scrollable List */}
                    <div className="overflow-y-auto flex-1 p-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-700">
                        {filteredColumns.map((group, idx) => {
                            const isExpanded = !!expandedCategories[group.category] || searchTerm.length > 0;
                            return (
                                <div key={idx} className="bg-slate-950/30 rounded-lg border border-slate-800/50 overflow-hidden">
                                    <button 
                                        onClick={() => toggleCategory(group.category)}
                                        className="w-full px-3 py-2 flex items-center justify-between bg-slate-900/50 hover:bg-slate-800 transition-colors"
                                    >
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                           {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                           {group.category}
                                        </span>
                                        <span className="text-[10px] text-slate-600">{group.fields.length}</span>
                                    </button>
                                    
                                    {isExpanded && (
                                        <div className="p-2 grid gap-1">
                                            {group.fields.map(field => (
                                                <button 
                                                    key={field.name}
                                                    onClick={() => insertField(field.name)}
                                                    className="group flex items-center justify-between px-3 py-2 rounded bg-slate-950 hover:bg-blue-900/10 hover:border-blue-500/30 border border-transparent transition-all text-left w-full"
                                                    title={field.desc}
                                                >
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-xs font-mono text-slate-300 group-hover:text-blue-300 font-medium truncate">
                                                            {field.name}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 truncate group-hover:text-slate-400">
                                                            {field.desc}
                                                        </span>
                                                    </div>
                                                    <span className="shrink-0 ml-2 text-[9px] font-mono text-slate-600 bg-slate-900 px-1 rounded border border-slate-800 group-hover:border-blue-900 group-hover:text-blue-400">
                                                        {field.type}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {filteredColumns.length === 0 && (
                            <div className="p-4 text-center text-slate-500 text-xs">
                                No fields match "{searchTerm}"
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default MiningView;
