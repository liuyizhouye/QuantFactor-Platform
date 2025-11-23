import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { runMockBacktest, generateMarketData } from '../services/mockDataService';
import { explainBacktestResults } from '../services/geminiService';
import { BacktestResult, Factor } from '../types';
import { Play, RotateCcw, TrendingUp, AlertTriangle, Activity } from 'lucide-react';

interface BacktestViewProps {
  factors: Factor[];
}

const BacktestView: React.FC<BacktestViewProps> = ({ factors }) => {
  const [selectedFactor, setSelectedFactor] = useState<string>("");
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string>("");

  const handleRun = async () => {
    setLoading(true);
    setResult(null);
    setAnalysis("");
    
    // Simulate processing time
    setTimeout(async () => {
        const mockResult = runMockBacktest();
        setResult(mockResult);
        
        // After getting results, ask AI to explain them
        const text = await explainBacktestResults(mockResult.metrics);
        setAnalysis(text);
        
        setLoading(false);
    }, 1500);
  };

  // Combine dates and values for Recharts
  const chartData = result ? result.dates.map((date, i) => ({
    date,
    Strategy: result.portfolioValue[i],
    Benchmark: result.benchmarkValue[i]
  })) : [];

  return (
    <div className="h-full flex flex-col p-8 max-w-7xl mx-auto gap-6 overflow-y-auto">
       <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Activity className="text-emerald-500" />
                Factor Backtester
            </h1>
       </div>

       <div className="grid grid-cols-12 gap-6">
            {/* Configuration Panel */}
            <div className="col-span-12 lg:col-span-3 space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Configuration</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Select Factor</label>
                            <select 
                                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg p-2.5 focus:border-blue-500 focus:outline-none"
                                value={selectedFactor}
                                onChange={(e) => setSelectedFactor(e.target.value)}
                            >
                                <option value="">-- Choose a Factor --</option>
                                {factors.map(f => (
                                    <option key={f.id} value={f.id}>{f.name} ({f.category})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                             <label className="block text-xs font-medium text-slate-500 mb-1">Start Date</label>
                             <input type="date" className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg p-2.5" defaultValue="2023-01-01" />
                        </div>
                        
                        <div>
                             <label className="block text-xs font-medium text-slate-500 mb-1">End Date</label>
                             <input type="date" className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg p-2.5" defaultValue="2023-12-31" />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Universe</label>
                            <select className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg p-2.5">
                                <option>S&P 500 Constituents</option>
                                <option>Russell 2000</option>
                                <option>Crypto Top 50</option>
                            </select>
                        </div>

                        <div className="pt-2">
                            <button 
                                onClick={handleRun}
                                disabled={loading || !selectedFactor}
                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? 'Simulating...' : <><Play size={16} /> Run Backtest</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Panel */}
            <div className="col-span-12 lg:col-span-9 flex flex-col gap-6">
                {result ? (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                                <p className="text-xs text-slate-500 uppercase">Total Return</p>
                                <p className={`text-xl font-bold font-mono ${result.metrics.totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {(result.metrics.totalReturn * 100).toFixed(2)}%
                                </p>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                                <p className="text-xs text-slate-500 uppercase">Sharpe Ratio</p>
                                <p className="text-xl font-bold font-mono text-blue-400">{result.metrics.sharpeRatio.toFixed(2)}</p>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                                <p className="text-xs text-slate-500 uppercase">Max Drawdown</p>
                                <p className="text-xl font-bold font-mono text-red-400">{(result.metrics.maxDrawdown * 100).toFixed(2)}%</p>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                                <p className="text-xs text-slate-500 uppercase">Alpha</p>
                                <p className="text-xl font-bold font-mono text-purple-400">{(result.metrics.alpha * 100).toFixed(2)}%</p>
                            </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg h-[400px]">
                            <h3 className="text-sm font-bold text-slate-300 mb-4">Cumulative Performance</h3>
                            <ResponsiveContainer width="100%" height="90%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorStrategy" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="date" stroke="#64748b" tick={{fontSize: 12}} tickFormatter={(v) => v.substring(5)} />
                                    <YAxis stroke="#64748b" tick={{fontSize: 12}} domain={['auto', 'auto']} />
                                    <Tooltip 
                                        contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#e2e8f0'}} 
                                        itemStyle={{color: '#e2e8f0'}}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="Strategy" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorStrategy)" />
                                    <Area type="monotone" dataKey="Benchmark" stroke="#64748b" strokeWidth={2} fillOpacity={0} fill="transparent" strokeDasharray="5 5" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {analysis && (
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg border-l-4 border-l-purple-500">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp size={18} className="text-purple-500" />
                                    <h3 className="text-sm font-bold text-white">AI Analysis</h3>
                                </div>
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    {analysis}
                                </p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                        <Activity size={48} className="mb-4 opacity-50" />
                        <p>Configure simulation parameters and click Run Backtest</p>
                    </div>
                )}
            </div>
       </div>
    </div>
  );
};

export default BacktestView;
