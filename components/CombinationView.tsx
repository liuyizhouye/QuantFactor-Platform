
import React, { useState, useRef, useEffect } from 'react';
import { Factor, FactorCategory, FactorFrequency, BacktestResult, Portfolio } from '../types';
import { generateFactorCombination } from '../services/geminiService';
import { runMultiFactorBacktest } from '../services/mockDataService';
import { FlaskConical, Check, Save, Loader2, ArrowRight, Layers, Code2, ShieldAlert, LineChart, PieChart, Zap, Scale, Clock } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

interface CombinationViewProps {
  factors: Factor[];
  onAddPortfolio: (portfolio: Portfolio) => void;
  targetFrequency: FactorFrequency;
}

const CombinationView: React.FC<CombinationViewProps> = ({ factors, onAddPortfolio, targetFrequency }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // LF Configs
  const [weightingMethod, setWeightingMethod] = useState('Equal Weight');
  const [sectorNeutral, setSectorNeutral] = useState(false);
  const [styleNeutral, setStyleNeutral] = useState(false);
  const [maxDrawdown, setMaxDrawdown] = useState('');
  const [targetVol, setTargetVol] = useState('');

  // HF Configs
  const [executionStrategy, setExecutionStrategy] = useState('Maker (Passive)');
  const [maxInventory, setMaxInventory] = useState('100');
  const [latencyConstraint, setLatencyConstraint] = useState('10ms');

  // State
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [formulaResult, setFormulaResult] = useState<{name: string, formula: string, description: string, category: string, logic_explanation: string} | null>(null);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);

  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const isHighFreq = targetFrequency === FactorFrequency.HIGH_FREQ;

  // Filter factors for current mode
  const availableFactors = factors.filter(f => f.frequency === targetFrequency);

  useEffect(() => {
    return () => {
        if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  // Reset selection when frequency changes
  useEffect(() => {
    setSelectedIds(new Set());
    setFormulaResult(null);
    setBacktestResult(null);
  }, [targetFrequency]);

  const toggleFactor = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleOptimizeAndBacktest = async () => {
    if (selectedIds.size < 2) return;
    setLoading(true);
    setFormulaResult(null);
    setBacktestResult(null);
    setProgress(0);

    const selectedFactors = factors.filter(f => selectedIds.has(f.id));
    
    // Start Progress Bar
    progressInterval.current = setInterval(() => {
        setProgress(prev => {
            if (prev >= 90) return prev;
            return prev + Math.floor(Math.random() * 5) + 2;
        });
    }, 150);

    try {
      // 1. Generate the Combination Logic (AI)
      const riskConfig = {
        sectorNeutral,
        styleNeutral,
        maxDrawdown: maxDrawdown || undefined,
        targetVol: targetVol || undefined,
        // HF fields handled in prompt construction inside service
        executionStrategy: isHighFreq ? executionStrategy : undefined,
        maxInventory: isHighFreq ? maxInventory : undefined
      };
      
      const strategyGoal = isHighFreq
        ? `Combine using ${executionStrategy} strategy. Manage inventory < ${maxInventory}. Optimize for fill rate and Sharpe.`
        : `Combine using ${weightingMethod} scheme. Optimize for risk-adjusted returns using Barra constraints.`;
      
      const aiData = await generateFactorCombination(selectedFactors, strategyGoal, riskConfig, targetFrequency);
      setFormulaResult(aiData);

      // 2. Run Portfolio Simulation (Mock)
      setTimeout(() => {
          const btResult = runMultiFactorBacktest(targetFrequency);
          setBacktestResult(btResult);
          
          if (progressInterval.current) clearInterval(progressInterval.current);
          setProgress(100);
          setLoading(false);
      }, 1000);

    } catch (error) {
      console.error("Failed to combine factors", error);
      if (progressInterval.current) clearInterval(progressInterval.current);
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!formulaResult || !backtestResult) return;
    
    // Mock OOS performance for initial display
    const mockOOSReturn = (Math.random() - 0.4) * 0.05; 

    const newPortfolio: Portfolio = {
        id: Date.now().toString(),
        name: formulaResult.name,
        description: formulaResult.description,
        createdAt: new Date().toISOString(),
        strategy: isHighFreq ? executionStrategy : weightingMethod,
        frequency: targetFrequency,
        factorIds: Array.from(selectedIds),
        constraints: {
            sectorNeutral: !isHighFreq && sectorNeutral,
            styleNeutral: !isHighFreq && styleNeutral,
            maxDrawdown: maxDrawdown || undefined,
            targetVol: targetVol || undefined
        },
        performance: {
            sharpe: backtestResult.metrics.sharpeRatio,
            annualizedReturn: backtestResult.metrics.totalReturn,
            maxDrawdown: backtestResult.metrics.maxDrawdown,
            alpha: backtestResult.metrics.alpha || 0,
            beta: backtestResult.metrics.beta || 0
        },
        oosPerformance: {
            startDate: new Date().toISOString(),
            returnTD: mockOOSReturn,
            sharpe: backtestResult.metrics.sharpeRatio * 0.8, // OOS usually degrades
            activeDrawdown: -0.01
        }
    };

    onAddPortfolio(newPortfolio);
    
    // Reset
    setFormulaResult(null);
    setBacktestResult(null);
    setSelectedIds(new Set());
    setProgress(0);
  };

  const chartData = backtestResult ? backtestResult.dates.map((date, i) => ({
    date,
    Portfolio: backtestResult.portfolioValue[i],
    Benchmark: backtestResult.benchmarkValue[i]
  })) : [];

  return (
    <div className="flex flex-col h-full p-4 md:p-8 max-w-7xl mx-auto gap-6 lg:overflow-hidden overflow-y-auto">
      {/* Header - Fixed on Desktop */}
      <div className="shrink-0">
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          {isHighFreq ? <Zap className="text-orange-500" size={32} /> : <FlaskConical className="text-pink-500" size={32} />}
          {isHighFreq ? 'HFT Portfolio Optimization' : 'Alpha Portfolio Optimization'}
        </h1>
        <p className="text-slate-400 text-sm md:text-base">
            {isHighFreq 
             ? "Construct intraday portfolios with inventory controls, execution logic, and latency simulation."
             : "Construct portfolios using factor combinations, apply Barra optimization, and backtest."}
        </p>
      </div>

      {/* Main Layout: Split Pane on Desktop, Stacked on Mobile */}
      <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 gap-6 md:gap-8">
        
        {/* Left Panel: Factor Selection */}
        <div className="lg:col-span-4 flex flex-col min-h-[400px] lg:min-h-0 lg:h-full bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden shrink-0">
            <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between shrink-0">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Factor Pool</h3>
                <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400 border border-slate-700">{selectedIds.size} selected</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {availableFactors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm p-6 text-center gap-2">
                         <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mb-2">
                            <FlaskConical size={18} className="opacity-50" />
                         </div>
                        <p>No {isHighFreq ? 'HFT' : 'Alpha'} factors found.</p>
                        <p className="text-xs">Go to Mining to generate new factors.</p>
                    </div>
                ) : (
                    availableFactors.map(factor => {
                        const isSelected = selectedIds.has(factor.id);
                        return (
                            <div 
                                key={factor.id}
                                onClick={() => toggleFactor(factor.id)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all group ${
                                    isSelected 
                                    ? 'bg-blue-600/10 border-blue-600/50' 
                                    : 'bg-slate-950/50 border-slate-800/50 hover:border-slate-700 hover:bg-slate-900'
                                }`}
                            >
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`text-sm font-semibold truncate ${isSelected ? 'text-blue-300' : 'text-slate-300 group-hover:text-slate-200'}`}>{factor.name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">{factor.category}</span>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 shrink-0 rounded-full border flex items-center justify-center transition-colors mt-0.5 ${
                                        isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-600 bg-slate-900'
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

        {/* Right Panel: Configuration & Output */}
        <div className="lg:col-span-8 flex flex-col gap-6 lg:h-full lg:overflow-y-auto pr-0 lg:pr-2 pb-20 lg:pb-0">
            
            {/* Strategy & Risk Configuration */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6 shrink-0">
                
                {/* Mode Specific Controls */}
                {isHighFreq ? (
                    // --- HFT CONTROLS ---
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-semibold text-slate-300 mb-2 block flex items-center gap-2">
                                <Scale size={16} /> Execution Strategy
                            </label>
                            <select
                                value={executionStrategy}
                                onChange={(e) => setExecutionStrategy(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                            >
                                <option value="Maker (Passive)">Maker (Passive Limit Orders)</option>
                                <option value="Taker (Aggressive)">Taker (Aggressive Market Orders)</option>
                                <option value="Sniper">Sniper (Latency Sensitive)</option>
                            </select>
                        </div>
                        <div>
                             <label className="text-sm font-semibold text-slate-300 mb-2 block flex items-center gap-2">
                                <Clock size={16} /> Max Latency Budget
                            </label>
                            <select
                                value={latencyConstraint}
                                onChange={(e) => setLatencyConstraint(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                            >
                                <option value="1ms">Ultra Low (1ms)</option>
                                <option value="10ms">Colocation (10ms)</option>
                                <option value="50ms">Standard (50ms)</option>
                            </select>
                        </div>
                     </div>
                ) : (
                    // --- LF CONTROLS ---
                    <div>
                        <label className="text-sm font-semibold text-slate-300 mb-2 block flex items-center gap-2">
                            <PieChart size={16} /> Weighting Scheme
                        </label>
                        <select
                            value={weightingMethod}
                            onChange={(e) => setWeightingMethod(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                        >
                            <option value="Equal Weight">Equal Weight (1/N)</option>
                            <option value="IC Weighted">IC Weighted (Information Coefficient)</option>
                            <option value="Risk Parity">Risk Parity / Inv-Vol</option>
                            <option value="Max Sharpe">Maximize Sharpe Ratio (Mean-Variance)</option>
                        </select>
                    </div>
                )}

                {/* Risk Control Section */}
                <div className="bg-slate-950/50 rounded-lg p-5 border border-slate-800">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800/50">
                        <ShieldAlert className={isHighFreq ? "text-orange-500" : "text-emerald-500"} size={18} />
                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                            {isHighFreq ? 'HFT Risk Limits' : 'Barra Optimization Constraints'}
                        </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {isHighFreq ? (
                             // HFT Risk
                             <>
                                <div>
                                    <label className="text-xs font-medium text-slate-400 mb-1.5 block">Max Inventory (Lots)</label>
                                    <input 
                                        type="number" 
                                        value={maxInventory}
                                        onChange={(e) => setMaxInventory(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:border-orange-500 focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="flex items-start gap-3 cursor-pointer group p-2 hover:bg-slate-900 rounded-lg transition-colors">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors mt-0.5 bg-orange-600 border-orange-600`}>
                                            <Check size={14} className="text-white" />
                                        </div>
                                        <div>
                                            <span className="text-sm text-slate-300 font-medium">Kill Switch</span>
                                            <p className="text-xs text-slate-500 mt-0.5">Auto-liquidate on 2% drawdown</p>
                                        </div>
                                    </label>
                                </div>
                             </>
                        ) : (
                            // LF Risk
                            <>
                                <div className="space-y-3">
                                    <label className="flex items-start gap-3 cursor-pointer group p-2 hover:bg-slate-900 rounded-lg transition-colors">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors mt-0.5 ${sectorNeutral ? 'bg-emerald-600 border-emerald-600' : 'border-slate-600 bg-slate-950'}`}>
                                            {sectorNeutral && <Check size={14} className="text-white" />}
                                        </div>
                                        <input type="checkbox" className="hidden" checked={sectorNeutral} onChange={() => setSectorNeutral(!sectorNeutral)} />
                                        <div>
                                            <span className="text-sm text-slate-300 font-medium group-hover:text-emerald-400 transition-colors">Sector Neutral</span>
                                            <p className="text-xs text-slate-500 mt-0.5">Zero exposure to GICS sectors</p>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 cursor-pointer group p-2 hover:bg-slate-900 rounded-lg transition-colors">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors mt-0.5 ${styleNeutral ? 'bg-emerald-600 border-emerald-600' : 'border-slate-600 bg-slate-950'}`}>
                                            {styleNeutral && <Check size={14} className="text-white" />}
                                        </div>
                                        <input type="checkbox" className="hidden" checked={styleNeutral} onChange={() => setStyleNeutral(!styleNeutral)} />
                                        <div>
                                            <span className="text-sm text-slate-300 font-medium group-hover:text-emerald-400 transition-colors">Style Neutral</span>
                                            <p className="text-xs text-slate-500 mt-0.5">Neutralize Size, Value, Momentum</p>
                                        </div>
                                    </label>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-medium text-slate-400 mb-1.5 block">Max Drawdown Constraint (%)</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={maxDrawdown}
                                                onChange={(e) => setMaxDrawdown(e.target.value)}
                                                placeholder="None"
                                                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none pl-3 pr-8"
                                            />
                                            <span className="absolute right-3 top-2 text-slate-500 text-xs">%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-400 mb-1.5 block">Target Portfolio Volatility (%)</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={targetVol}
                                                onChange={(e) => setTargetVol(e.target.value)}
                                                placeholder="None"
                                                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none pl-3 pr-8"
                                            />
                                            <span className="absolute right-3 top-2 text-slate-500 text-xs">%</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Action Button */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800">
                    <p className="text-xs text-slate-500">
                        {selectedIds.size < 2 ? (
                            <span className="text-orange-400 flex items-center gap-1"><ShieldAlert size={12}/> Select at least 2 factors</span>
                        ) : (
                            <span>Optimization Universe: {isHighFreq ? 'Liquid Futures' : 'S&P 500'}</span>
                        )}
                    </p>
                    <button 
                        onClick={handleOptimizeAndBacktest}
                        disabled={loading || selectedIds.size < 2}
                        className={`w-full md:w-auto px-6 py-2.5 text-white font-semibold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all ${
                            isHighFreq 
                            ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500' 
                            : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500'
                        }`}
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <LineChart size={18} />}
                        {isHighFreq ? 'Run HFT Simulation' : 'Optimize & Backtest'}
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            {loading && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-slate-200">{isHighFreq ? 'Simulating Order Matches & Inventory...' : 'Optimizing Portfolio Weights & Backtesting...'}</span>
                        <span className={`text-sm font-mono ${isHighFreq ? 'text-orange-500' : 'text-pink-500'}`}>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                        <div 
                            className={`h-2.5 rounded-full transition-all duration-300 ease-out ${isHighFreq ? 'bg-gradient-to-r from-orange-600 to-red-600' : 'bg-gradient-to-r from-pink-600 to-rose-600'}`}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Result Area */}
            <div className="flex-1 min-h-[400px]">
                {formulaResult && backtestResult && !loading ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        
                        {/* Header & Save */}
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-800 pb-4">
                            <div>
                                <div className="flex gap-2 mb-2">
                                     <span className={`inline-block px-2 py-1 text-xs font-bold rounded border uppercase tracking-wider ${isHighFreq ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-pink-500/10 text-pink-400 border-pink-500/20'}`}>
                                        {isHighFreq ? 'HFT Basket' : 'Multi-Factor'}
                                    </span>
                                    <span className="inline-block px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded border border-emerald-500/20 uppercase tracking-wider">
                                        {isHighFreq ? 'Latency Optimized' : 'Barra Optimized'}
                                    </span>
                                </div>
                                <h2 className="text-xl md:text-2xl font-bold text-white">Optimized Portfolio Result</h2>
                                <p className="text-slate-400 mt-1 text-sm">{formulaResult.description}</p>
                            </div>
                             <button 
                                onClick={handleSave}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors w-full sm:w-auto justify-center"
                            >
                                <Save size={16} />
                                Save to Portfolio Library
                            </button>
                        </div>

                        {/* Performance Chart */}
                        <div className="h-[300px] w-full bg-slate-950 rounded-lg p-4 border border-slate-800">
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">{isHighFreq ? 'Intraday PnL Curve' : 'Cumulative Active Return'}</h3>
                            <ResponsiveContainer width="100%" height="90%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={isHighFreq ? "#f97316" : "#ec4899"} stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor={isHighFreq ? "#f97316" : "#ec4899"} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="date" stroke="#64748b" tick={{fontSize: 10}} tickFormatter={(v) => isHighFreq ? v : v.substring(5)} interval={isHighFreq ? 50 : 20} />
                                    <YAxis stroke="#64748b" tick={{fontSize: 10}} domain={['auto', 'auto']} />
                                    <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155'}} itemStyle={{color: '#e2e8f0'}} />
                                    <Legend />
                                    <Area name="Optimized Portfolio" type="monotone" dataKey="Portfolio" stroke={isHighFreq ? "#f97316" : "#ec4899"} strokeWidth={2} fillOpacity={1} fill="url(#colorPortfolio)" />
                                    <Area name="Benchmark" type="monotone" dataKey="Benchmark" stroke="#64748b" strokeWidth={2} fillOpacity={0} fill="transparent" strokeDasharray="5 5" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                                <p className="text-[10px] text-slate-500 uppercase">Sharpe Ratio</p>
                                <p className="text-lg font-bold text-emerald-400">{backtestResult.metrics.sharpeRatio.toFixed(2)}</p>
                             </div>
                             {isHighFreq ? (
                                <>
                                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                                        <p className="text-[10px] text-slate-500 uppercase">Fill Rate</p>
                                        <p className="text-lg font-bold text-orange-400">{(backtestResult.metrics.fillRate || 0.95 * 100).toFixed(1)}%</p>
                                    </div>
                                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                                        <p className="text-[10px] text-slate-500 uppercase">Avg Hold Time</p>
                                        <p className="text-lg font-bold text-blue-400">42s</p>
                                    </div>
                                </>
                             ) : (
                                <>
                                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                                        <p className="text-[10px] text-slate-500 uppercase">Alpha</p>
                                        <p className="text-lg font-bold text-purple-400">{(backtestResult.metrics.alpha! * 100).toFixed(2)}%</p>
                                    </div>
                                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                                        <p className="text-[10px] text-slate-500 uppercase">Beta</p>
                                        <p className="text-lg font-bold text-blue-400">{backtestResult.metrics.beta!.toFixed(2)}</p>
                                    </div>
                                </>
                             )}
                             <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                                <p className="text-[10px] text-slate-500 uppercase">Max Drawdown</p>
                                <p className="text-lg font-bold text-red-400">{(backtestResult.metrics.maxDrawdown * 100).toFixed(2)}%</p>
                             </div>
                        </div>

                        {/* Logic Explanation */}
                        <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-800/50">
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">Optimization Logic</h3>
                            <p className="text-slate-300 leading-relaxed text-sm">
                                {formulaResult.logic_explanation}
                            </p>
                            <div className="mt-4 pt-4 border-t border-slate-800">
                                <p className="text-xs text-slate-500 font-mono">
                                    {isHighFreq 
                                        ? `Strategy: ${executionStrategy} | Latency: ${latencyConstraint}`
                                        : `Constraint: ${sectorNeutral ? 'Sector Neutral (Active)' : 'Sector Neutral (Off)'} | Method: ${weightingMethod}`
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    !loading && (
                        <div className="h-full bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-600 gap-4 p-8">
                            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                                <ArrowRight size={24} className="text-slate-600" />
                            </div>
                            <p className="text-center">Select factors, configure {isHighFreq ? 'execution' : 'optimization'} parameters, and run simulation.</p>
                        </div>
                    )
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CombinationView;