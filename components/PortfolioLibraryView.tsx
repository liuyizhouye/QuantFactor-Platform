
import React, { useState, useMemo } from 'react';
import { Portfolio, Factor, FactorFrequency } from '../types';
import { Briefcase, Trash2, Layers, Download, Search, Package, Zap, FlaskConical, TrendingUp, CheckSquare, Square, ChevronRight } from 'lucide-react';
import { exportPortfolioPackage } from '../services/exportService';
import { generateOOSData } from '../services/mockDataService';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

interface PortfolioLibraryViewProps {
  portfolios: Portfolio[];
  factors: Factor[];
  onDelete: (id: string) => void;
}

const PortfolioLibraryView: React.FC<PortfolioLibraryViewProps> = ({ portfolios, factors, onDelete }) => {
  const [activeFrequency, setActiveFrequency] = useState<FactorFrequency>(FactorFrequency.LOW_FREQ);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set());

  // Filter based on selected tab (frequency)
  const filteredPortfolios = useMemo(() => {
    return portfolios.filter(p => p.frequency === activeFrequency);
  }, [portfolios, activeFrequency]);

  const isHighFreq = activeFrequency === FactorFrequency.HIGH_FREQ;

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this portfolio strategy?")) {
        onDelete(id);
        const newSelected = new Set(selectedForCompare);
        newSelected.delete(id);
        setSelectedForCompare(newSelected);
    }
  };

  const handleExport = async (portfolio: Portfolio) => {
    setExportingId(portfolio.id);
    try {
        await exportPortfolioPackage(portfolio, factors);
    } catch (e) {
        console.error("Failed to export portfolio", e);
        alert("Export failed.");
    } finally {
        setExportingId(null);
    }
  };

  const toggleCompare = (id: string) => {
      const newSelected = new Set(selectedForCompare);
      if (newSelected.has(id)) {
          newSelected.delete(id);
      } else {
          // Limit to 4 for readability
          if (newSelected.size < 4) {
              newSelected.add(id);
          }
      }
      setSelectedForCompare(newSelected);
  };

  const getFactorNames = (ids: string[]) => {
      return ids.map(id => factors.find(f => f.id === id)?.name || "Unknown Factor").join(", ");
  };

  // Generate Comparison Chart Data
  const comparisonData = useMemo(() => {
      if (selectedForCompare.size === 0) return [];
      
      const selectedPorts = filteredPortfolios.filter(p => selectedForCompare.has(p.id));
      if (selectedPorts.length === 0) return [];

      // Generate OOS data for each
      const seriesMap: Record<string, {date: string, value: number}[]> = {};
      selectedPorts.forEach(p => {
          seriesMap[p.name] = generateOOSData(p, 30);
      });

      // Merge into Recharts format
      const firstSeries = seriesMap[selectedPorts[0].name];
      if (!firstSeries) return [];

      return firstSeries.map((pt, i) => {
          const row: any = { date: pt.date };
          selectedPorts.forEach(p => {
              row[p.name] = seriesMap[p.name][i].value;
          });
          return row;
      });
  }, [selectedForCompare, filteredPortfolios]);

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto pb-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Briefcase className="text-pink-500" />
                    Portfolio Library
                </h1>
                <p className="text-slate-400 text-sm hidden md:block">Manage and track your proprietary strategies</p>
            </div>
            
            {/* Frequency Tabs */}
            <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 flex w-full md:w-auto">
                <button 
                    onClick={() => { setActiveFrequency(FactorFrequency.LOW_FREQ); setSelectedForCompare(new Set()); }}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all flex justify-center items-center gap-2 ${activeFrequency === FactorFrequency.LOW_FREQ ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <FlaskConical size={16} /> Alpha
                </button>
                <button 
                     onClick={() => { setActiveFrequency(FactorFrequency.HIGH_FREQ); setSelectedForCompare(new Set()); }}
                     className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all flex justify-center items-center gap-2 ${activeFrequency === FactorFrequency.HIGH_FREQ ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Zap size={16} /> HFT
                </button>
            </div>
        </div>

        {/* COMPARISON SECTION (Hidden on Mobile) */}
        {selectedForCompare.size > 0 && (
            <div className="hidden md:block mb-8 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl animate-in fade-in slide-in-from-top-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <TrendingUp className="text-blue-500" />
                        Out-of-Sample Comparison
                    </h3>
                    <button onClick={() => setSelectedForCompare(new Set())} className="text-xs text-slate-500 hover:text-white">Clear Selection</button>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={comparisonData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="date" stroke="#64748b" tick={{fontSize: 10}} tickFormatter={(v) => v.substring(5)} />
                            <YAxis domain={['auto', 'auto']} stroke="#64748b" tick={{fontSize: 10}} />
                            <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155'}} itemStyle={{fontSize: 12}} />
                            <Legend />
                            {Array.from(selectedForCompare).map((id, idx) => {
                                const p = filteredPortfolios.find(pt => pt.id === id);
                                if (!p) return null;
                                return (
                                    <Line key={id} type="monotone" dataKey={p.name} stroke={colors[idx % colors.length]} strokeWidth={2} dot={false} />
                                );
                            })}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        )}

        <div className="mb-6 relative">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input 
                type="text" 
                placeholder="Search portfolios..."
                className="w-full md:w-96 bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-pink-500"
            />
        </div>

        <div className="grid grid-cols-1 gap-6">
            {filteredPortfolios.length === 0 ? (
                <div className="text-center py-20 text-slate-500 bg-slate-900 rounded-xl border border-dashed border-slate-800 flex flex-col items-center gap-4">
                    <Briefcase size={24} className="opacity-50" />
                    <p>No portfolios saved yet.</p>
                </div>
            ) : (
                filteredPortfolios.map((portfolio) => {
                    const isSelected = selectedForCompare.has(portfolio.id);
                    return (
                    <div key={portfolio.id} className={`bg-slate-900 border rounded-xl p-4 md:p-6 transition-all shadow-lg group relative overflow-hidden ${isSelected ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-slate-800 hover:border-pink-600/50'}`}>
                        
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                            <div className="flex items-start gap-4">
                                <button 
                                    onClick={() => toggleCompare(portfolio.id)}
                                    className={`hidden md:block mt-1 text-slate-500 hover:text-white transition-colors ${isSelected ? 'text-blue-500' : ''}`}
                                    title="Compare Performance"
                                >
                                    {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                </button>
                                <div>
                                    <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                                        {portfolio.name}
                                    </h3>
                                    <p className="text-slate-400 text-sm mt-1 max-w-lg">{portfolio.description}</p>
                                </div>
                            </div>
                            <div className="flex gap-2 self-end md:self-auto">
                                <button 
                                    onClick={() => handleExport(portfolio)}
                                    disabled={exportingId === portfolio.id}
                                    className="p-2 bg-slate-950 md:bg-transparent border md:border-transparent border-slate-800 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-400 transition-colors" 
                                >
                                    {exportingId === portfolio.id ? <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div> : <Package size={16} />}
                                </button>
                                <button 
                                    onClick={() => handleDelete(portfolio.id)}
                                    className="p-2 bg-slate-950 md:bg-transparent border md:border-transparent border-slate-800 hover:bg-red-900/30 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Stats Rows */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6">
                             <div className="bg-slate-950 p-3 rounded border border-slate-800">
                                <span className="text-[10px] text-slate-500 uppercase block">Sharpe (IS)</span>
                                <span className="text-base md:text-lg font-bold text-slate-300">{portfolio.performance.sharpe.toFixed(2)}</span>
                             </div>
                             <div className="bg-slate-950 p-3 rounded border border-slate-800">
                                <span className="text-[10px] text-slate-500 uppercase block">Return (IS)</span>
                                <span className="text-base md:text-lg font-bold text-slate-300">{(portfolio.performance.annualizedReturn * 100).toFixed(1)}%</span>
                             </div>
                             
                             {/* OOS Tracking Section - Stacked on Mobile */}
                             <div className="col-span-2 md:col-span-3 bg-slate-950 p-3 rounded border border-blue-900/30 flex flex-col md:flex-row md:items-center justify-between relative overflow-hidden gap-3 md:gap-0">
                                <div className="absolute top-0 right-0 p-1">
                                    <div className="flex items-center gap-1 bg-blue-500/10 px-1.5 rounded text-[8px] md:text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div> Live / OOS
                                    </div>
                                </div>
                                <div className="z-10 px-2 flex justify-between md:block">
                                    <span className="text-[10px] text-blue-400/70 uppercase block">Return (30d)</span>
                                    <span className={`text-base md:text-lg font-bold font-mono ${portfolio.oosPerformance?.returnTD! >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {portfolio.oosPerformance?.returnTD ? (portfolio.oosPerformance.returnTD * 100).toFixed(2) : '0.00'}%
                                    </span>
                                </div>
                                <div className="z-10 px-2 md:border-l border-slate-800 flex justify-between md:block">
                                    <span className="text-[10px] text-blue-400/70 uppercase block">Live Sharpe</span>
                                    <span className="text-base md:text-lg font-bold font-mono text-blue-400">
                                        {portfolio.oosPerformance?.sharpe.toFixed(2) || '0.00'}
                                    </span>
                                </div>
                                <div className="z-10 px-2 md:border-l border-slate-800 flex justify-between md:block">
                                    <span className="text-[10px] text-blue-400/70 uppercase block">Drawdown</span>
                                    <span className="text-base md:text-lg font-bold font-mono text-slate-400">
                                        {(portfolio.oosPerformance?.activeDrawdown || 0 * 100).toFixed(2)}%
                                    </span>
                                </div>
                             </div>
                        </div>

                        {/* Details Footer */}
                        <div className="border-t border-slate-800 pt-4 flex flex-col md:flex-row gap-2 md:gap-4 justify-between text-xs text-slate-500">
                            <div className="flex flex-col gap-1">
                                <span>Method: <span className="text-slate-300 font-medium">{portfolio.strategy}</span></span>
                                <span className="hidden md:inline">
                                    Included Factors: <span className="text-slate-400 italic">{getFactorNames(portfolio.factorIds)}</span>
                                </span>
                            </div>
                            <div className="flex gap-4">
                                <span>Created: {new Date(portfolio.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                )})
            )}
        </div>
    </div>
  );
};

export default PortfolioLibraryView;
