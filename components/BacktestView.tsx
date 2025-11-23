
import React, { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { runMockBacktest, runHighFreqBacktest } from '../services/mockDataService';
import { explainBacktestResults } from '../services/geminiService';
import { BacktestResult, Factor, FactorFrequency } from '../types';
import { Play, TrendingUp, BarChart2, Zap, Activity } from 'lucide-react';

interface BacktestViewProps {
  factors: Factor[];
  targetFrequency: FactorFrequency;
}

const BacktestView: React.FC<BacktestViewProps> = ({ factors, targetFrequency }) => {
  const [selectedFactor, setSelectedFactor] = useState<string>("");
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<string>("");
  
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const isHighFreq = targetFrequency === FactorFrequency.HIGH_FREQ;

  // Filter valid factors for this view
  const availableFactors = factors.filter(f => f.frequency === targetFrequency);

  useEffect(() => {
    return () => {
        if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  // Reset state when mode changes
  useEffect(() => {
    setSelectedFactor("");
    setResult(null);
    setAnalysis("");
  }, [targetFrequency]);

  const handleRun = async () => {
    setLoading(true);
    setResult(null);
    setAnalysis("");
    setProgress(0);
    
    // Simulate Progress
    progressInterval.current = setInterval(() => {
        setProgress(prev => {
            if (prev >= 95) return prev;
            return prev + Math.floor(Math.random() * 10) + 1;
        });
    }, 200);
    
    // Simulate processing time
    setTimeout(async () => {
        // Run specific engine based on frequency
        const mockResult = isHighFreq ? runHighFreqBacktest() : runMockBacktest();
        setResult(mockResult);
        
        // After getting results, ask AI to explain them
        const context = isHighFreq ? "Analyze this High-Frequency Trading (HFT) strategy result:" : "Analyze this Daily Alpha strategy result:";
        const text = await explainBacktestResults({ context, ...mockResult.metrics });
        setAnalysis(text);
        
        if (progressInterval.current) clearInterval(progressInterval.current);
        setProgress(100);
        setLoading(false);
    }, 2500);
  };

  // Combine dates and values for Recharts
  const chartData = result ? result.dates.map((date, i) => ({
    date,
    Strategy: result.portfolioValue[i],
    Benchmark: result.benchmarkValue[i]
  })) : [];

  return (
    <div className="h-full flex flex-col p-8 max-w-7xl mx-auto gap-6 overflow-y-auto pb-24">
       <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    {isHighFreq ? <Zap className="text-orange-500" /> : <BarChart2 className="text-blue-500" />}
                    {isHighFreq ? 'HFT Backtest Engine' : 'Alpha Factor Backtest'}
                </h1>
                <p className="text-slate-400">
                    {isHighFreq 
                        ? "Simulate tick-level execution, latency, and microstructure PnL." 
                        : "Test individual factor performance (IC, Rank IC, Long-Short Return)."}
                </p>
            </div>
       </div>

       <div className="grid grid-cols-12 gap-6">
            {/* Configuration Panel */}
            <div className="col-span-12 lg:col-span-3 space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Factor Settings</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Target Factor</label>
                            <select 
                                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg p-2.5 focus:border-blue-500 focus:outline-none"
                                value={selectedFactor}
                                onChange={(e) => setSelectedFactor(e.target.value)}
                            >
                                <option value="">-- Choose a Factor --</option>
                                {availableFactors.map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                            {availableFactors.length === 0 && (
                                <p className="text-[10px] text-red-400 mt-1">No factors available in this library.</p>
                            )}
                        </div>

                        {/* HF specific config vs LF config */}
                        {isHighFreq ? (
                             <>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Latency Simulation</label>
                                    <select className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg p-2.5">
                                        <option>Zero Latency (Theoretical)</option>
                                        <option>10ms (Colo)</option>
                                        <option>100ms (Remote)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Fill Probability</label>
                                    <select className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg p-2.5">
                                        <option>Conservative (Limit Orders)</option>
                                        <option>Aggressive (Market Orders)</option>
                                    </select>
                                </div>
                             </>
                        ) : (
                             <>
                                <div>
                                     <label className="block text-xs font-medium text-slate-500 mb-1">Testing Period</label>
                                     <div className="grid grid-cols-2 gap-2">
                                        <input type="date" className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2" defaultValue="2023-01-01" />
                                        <input type="date" className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2" defaultValue="2023-12-31" />
                                     </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Decile Analysis</label>
                                    <select className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg p-2.5">
                                        <option>5 Groups (Quintiles)</option>
                                        <option>10 Groups (Deciles)</option>
                                    </select>
                                </div>
                             </>
                        )}
                        
                        <div>
                             <label className="block text-xs font-medium text-slate-500 mb-1">Holding Period</label>
                             <select 
                                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg p-2.5 focus:border-blue-500 focus:outline-none"
                                defaultValue={isHighFreq ? "1 Minute" : "1 Day"}
                             >
                                {isHighFreq ? (
                                    <>
                                        <option value="1 Minute">1 Minute</option>
                                        <option value="5 Minutes">5 Minutes</option>
                                        <option value="15 Minutes">15 Minutes</option>
                                        <option value="30 Minutes">30 Minutes</option>
                                        <option value="End of Day">End of Day</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="1 Day">1 Day</option>
                                        <option value="3 Days">3 Days</option>
                                        <option value="5 Days">5 Days (Weekly)</option>
                                        <option value="10 Days">10 Days</option>
                                        <option value="21 Days">21 Days (Monthly)</option>
                                        <option value="63 Days">63 Days (Quarterly)</option>
                                    </>
                                )}
                             </select>
                        </div>

                        <div className="pt-2">
                            <button 
                                onClick={handleRun}
                                disabled={loading || !selectedFactor}
                                className={`w-full py-2.5 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:bg-slate-800 disabled:text-slate-500 ${
                                    isHighFreq 
                                    ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500'
                                    : 'bg-emerald-600 hover:bg-emerald-500'
                                }`}
                            >
                                {loading ? 'Running...' : <><Play size={16} /> Run Backtest</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Panel */}
            <div className="col-span-12 lg:col-span-9 flex flex-col gap-6">
                
                {/* Progress Bar */}
                {loading && (
                    <div className="w-full bg-slate-900 rounded-lg p-4 border border-slate-800 shadow-lg">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-slate-300 font-medium">
                                {isHighFreq ? "Replaying Market Data & Matching Orders..." : "Calculating IC & Rank Metrics..."}
                            </span>
                            <span className="text-sm text-blue-400 font-mono">{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2">
                            <div 
                                className={`h-2 rounded-full transition-all duration-300 ease-out ${isHighFreq ? 'bg-orange-500' : 'bg-blue-600'}`}
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {!loading && result ? (
                    <>
                        {/* Metrics Grid - Conditional based on mode */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4">
                            {isHighFreq ? (
                                <>
                                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                                        <p className="text-xs text-slate-500 uppercase">Sharpe (Intraday)</p>
                                        <p className="text-xl font-bold font-mono text-emerald-400">{result.metrics.sharpeRatio.toFixed(2)}</p>
                                    </div>
                                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                                        <p className="text-xs text-slate-500 uppercase">Avg Trade Duration</p>
                                        <p className="text-xl font-bold font-mono text-blue-400">{result.metrics.avgTradeDuration}</p>
                                    </div>
                                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                                        <p className="text-xs text-slate-500 uppercase">Fill Rate</p>
                                        <p className="text-xl font-bold font-mono text-orange-400">{(result.metrics.fillRate! * 100).toFixed(1)}%</p>
                                    </div>
                                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                                        <p className="text-xs text-slate-500 uppercase">Total Trades</p>
                                        <p className="text-xl font-bold font-mono text-slate-400">{result.metrics.totalTrades}</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                                        <p className="text-xs text-slate-500 uppercase">Information Coeff (IC)</p>
                                        <p className={`text-xl font-bold font-mono ${result.metrics.alpha! > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            0.052
                                        </p>
                                    </div>
                                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                                        <p className="text-xs text-slate-500 uppercase">Rank IC (IR)</p>
                                        <p className="text-xl font-bold font-mono text-blue-400">1.45</p>
                                    </div>
                                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                                        <p className="text-xs text-slate-500 uppercase">L/S Return</p>
                                        <p className="text-xl font-bold font-mono text-emerald-400">{(result.metrics.totalReturn * 100).toFixed(2)}%</p>
                                    </div>
                                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                                        <p className="text-xs text-slate-500 uppercase">Turnover</p>
                                        <p className="text-xl font-bold font-mono text-slate-400">15.2%</p>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg h-[400px] animate-in fade-in slide-in-from-bottom-6">
                            <h3 className="text-sm font-bold text-slate-300 mb-4">{isHighFreq ? 'Intraday Cumulative PnL' : 'Long-Short Cumulative Return'}</h3>
                            <ResponsiveContainer width="100%" height="90%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorStrategy" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={isHighFreq ? "#f97316" : "#3b82f6"} stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor={isHighFreq ? "#f97316" : "#3b82f6"} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="date" stroke="#64748b" tick={{fontSize: 12}} interval={isHighFreq ? 30 : 20} />
                                    <YAxis stroke="#64748b" tick={{fontSize: 12}} domain={['auto', 'auto']} />
                                    <Tooltip 
                                        contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#e2e8f0'}} 
                                        itemStyle={{color: '#e2e8f0'}}
                                    />
                                    <Legend />
                                    <Area 
                                        name={isHighFreq ? "HFT Strategy PnL" : "Long-Short Equity"} 
                                        type="monotone" 
                                        dataKey="Strategy" 
                                        stroke={isHighFreq ? "#f97316" : "#3b82f6"} 
                                        strokeWidth={2} 
                                        fillOpacity={1} 
                                        fill="url(#colorStrategy)" 
                                    />
                                    <Area 
                                        name="Benchmark" 
                                        type="monotone" 
                                        dataKey="Benchmark" 
                                        stroke="#64748b" 
                                        strokeWidth={2} 
                                        fillOpacity={0} 
                                        fill="transparent" 
                                        strokeDasharray="5 5" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {analysis && (
                            <div className={`bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg border-l-4 animate-in fade-in slide-in-from-bottom-8 ${isHighFreq ? 'border-l-orange-500' : 'border-l-purple-500'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp size={18} className={isHighFreq ? "text-orange-500" : "text-purple-500"} />
                                    <h3 className="text-sm font-bold text-white">AI Analysis</h3>
                                </div>
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    {analysis}
                                </p>
                            </div>
                        )}
                    </>
                ) : (
                    !loading && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                            <Activity size={48} className="mb-4 opacity-50" />
                            <p>Select a {isHighFreq ? 'HFT' : 'Alpha'} factor to analyze performance</p>
                        </div>
                    )
                )}
            </div>
       </div>
    </div>
  );
};

export default BacktestView;
