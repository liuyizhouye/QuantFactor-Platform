
import React, { useState } from 'react';
import { Portfolio, Factor } from '../types';
import { Briefcase, Trash2, Layers, Download, Search, Package } from 'lucide-react';
import { exportPortfolioPackage } from '../services/exportService';

interface PortfolioLibraryViewProps {
  portfolios: Portfolio[];
  factors: Factor[];
  onDelete: (id: string) => void;
}

const PortfolioLibraryView: React.FC<PortfolioLibraryViewProps> = ({ portfolios, factors, onDelete }) => {
  const [exportingId, setExportingId] = useState<string | null>(null);
  
  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this portfolio strategy?")) {
        onDelete(id);
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

  const getFactorNames = (ids: string[]) => {
      return ids.map(id => factors.find(f => f.id === id)?.name || "Unknown Factor").join(", ");
  };

  return (
    <div className="h-full overflow-y-auto p-8 max-w-7xl mx-auto pb-24">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Briefcase className="text-pink-500" />
                    Portfolio Library
                </h1>
                <p className="text-slate-400">Manage your saved multi-factor strategies</p>
            </div>
            <div className="px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
                <span className="text-sm text-slate-400">
                    Total Portfolios: <span className="text-white font-bold">{portfolios.length}</span>
                </span>
            </div>
        </div>

        {/* Filter Bar */}
        <div className="mb-6 relative">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input 
                type="text" 
                placeholder="Search portfolios..." 
                className="w-full md:w-96 bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-pink-500"
            />
        </div>

        <div className="grid grid-cols-1 gap-6">
            {portfolios.length === 0 ? (
                <div className="text-center py-20 text-slate-500 bg-slate-900 rounded-xl border border-dashed border-slate-800 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                        <Briefcase size={24} className="opacity-50" />
                    </div>
                    <p>No portfolios saved yet.</p>
                    <p className="text-sm">Go to "Portfolio Backtest & Analyze" to build one.</p>
                </div>
            ) : (
                portfolios.map((portfolio) => (
                    <div key={portfolio.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-pink-600/50 transition-all shadow-lg group relative overflow-hidden">
                        
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    {portfolio.name}
                                </h3>
                                <p className="text-slate-400 text-sm mt-1">{portfolio.description}</p>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity self-end md:self-auto">
                                <button 
                                    onClick={() => handleExport(portfolio)}
                                    disabled={exportingId === portfolio.id}
                                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-400 transition-colors" 
                                    title="Export Verification Package"
                                >
                                    {exportingId === portfolio.id ? <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div> : <Package size={16} />}
                                </button>
                                <button 
                                    onClick={() => handleDelete(portfolio.id)}
                                    className="p-2 hover:bg-red-900/30 rounded-lg text-slate-400 hover:text-red-400 transition-colors" title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                             <div className="bg-slate-950 p-3 rounded border border-slate-800">
                                <span className="text-xs text-slate-500 uppercase block">Sharpe</span>
                                <span className="text-lg font-bold text-emerald-400">{portfolio.performance.sharpe.toFixed(2)}</span>
                             </div>
                             <div className="bg-slate-950 p-3 rounded border border-slate-800">
                                <span className="text-xs text-slate-500 uppercase block">Ann. Return</span>
                                <span className="text-lg font-bold text-emerald-400">{(portfolio.performance.annualizedReturn * 100).toFixed(1)}%</span>
                             </div>
                             <div className="bg-slate-950 p-3 rounded border border-slate-800">
                                <span className="text-xs text-slate-500 uppercase block">Alpha</span>
                                <span className="text-lg font-bold text-purple-400">{(portfolio.performance.alpha * 100).toFixed(2)}%</span>
                             </div>
                             <div className="bg-slate-950 p-3 rounded border border-slate-800">
                                <span className="text-xs text-slate-500 uppercase block">Max DD</span>
                                <span className="text-lg font-bold text-red-400">{(portfolio.performance.maxDrawdown * 100).toFixed(1)}%</span>
                             </div>
                        </div>

                        {/* Details Footer */}
                        <div className="border-t border-slate-800 pt-4 flex flex-col md:flex-row gap-4 md:items-center justify-between text-xs text-slate-500">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Layers size={12} />
                                    <span>Method: <span className="text-slate-300 font-medium">{portfolio.strategy}</span></span>
                                </div>
                                <div>
                                    Included Factors: <span className="text-slate-400 italic">{getFactorNames(portfolio.factorIds)}</span>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <span>Created: {new Date(portfolio.createdAt).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1">
                                    {portfolio.constraints?.sectorNeutral ? <span className="text-emerald-500">Sector Neutral</span> : 'Sector Unconstrained'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
  );
};

export default PortfolioLibraryView;
