
import React, { useState } from 'react';
import { Factor, FactorCategory, FactorFrequency } from '../types';
import { Trash2, Edit, Code, Filter, X, Download, FileText, Zap, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { exportFactorPackage } from '../services/exportService';

interface LibraryViewProps {
  factors: Factor[];
  onDelete: (id: string) => void;
  targetFrequency: FactorFrequency;
}

const LibraryView: React.FC<LibraryViewProps> = ({ factors, onDelete, targetFrequency }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [exportingId, setExportingId] = useState<string | null>(null);
  
  // Mobile UI States
  const [expandedFactorId, setExpandedFactorId] = useState<string | null>(null);

  const isHighFreq = targetFrequency === FactorFrequency.HIGH_FREQ;

  const categories = ['All', ...Object.values(FactorCategory)];

  // Filter by frequency FIRST, then by selected category
  const visibleFactors = factors.filter(f => f.frequency === targetFrequency);
  const filteredFactors = selectedCategory === 'All' 
    ? visibleFactors 
    : visibleFactors.filter(f => f.category === selectedCategory);

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this factor? This action cannot be undone.")) {
        onDelete(id);
    }
  };

  const handleExport = async (factor: Factor) => {
      setExportingId(factor.id);
      try {
          await exportFactorPackage(factor);
      } catch (e) {
          console.error("Export failed", e);
          alert("Failed to generate export package.");
      } finally {
          setExportingId(null);
      }
  };

  const toggleExpand = (id: string) => {
      setExpandedFactorId(expandedFactorId === id ? null : id);
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    {isHighFreq ? <Zap className="text-orange-500" /> : <BookOpen className="text-blue-500" />}
                    {isHighFreq ? 'HFT Factor Library' : 'Alpha Factor Library'}
                </h1>
                <p className="text-slate-400 text-sm hidden md:block">Manage your proprietary {isHighFreq ? 'high-frequency' : 'low-frequency'} algorithms</p>
            </div>
            <div className="px-3 py-1 bg-slate-800 rounded-lg border border-slate-700">
                <span className="text-xs md:text-sm text-slate-400">
                    <span className="text-white font-bold">{filteredFactors.length}</span> / {visibleFactors.length}
                </span>
            </div>
        </div>

        {/* Filter Bar - Scrollable on Mobile */}
        <div className="mb-6 flex overflow-x-auto pb-2 md:pb-0 gap-2 scrollbar-hide">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 shrink-0">
                <Filter size={14} />
                <span className="text-xs font-medium uppercase tracking-wider">Filter</span>
            </div>
            {categories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                            isActive 
                            ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/50' 
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-slate-200'
                        }`}
                    >
                        {cat}
                    </button>
                );
            })}
            {selectedCategory !== 'All' && (
                 <button 
                    onClick={() => setSelectedCategory('All')}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-white px-3 py-1 bg-slate-800/50 rounded-full hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors whitespace-nowrap"
                >
                    <X size={12} /> Clear
                </button>
            )}
        </div>

        <div className="grid grid-cols-1 gap-4 pb-24">
            {filteredFactors.length === 0 ? (
                <div className="text-center py-20 text-slate-500 bg-slate-900 rounded-xl border border-dashed border-slate-800">
                    {visibleFactors.length === 0 
                        ? `No ${isHighFreq ? 'HFT' : 'Alpha'} factors saved.` 
                        : `No factors found in category "${selectedCategory}".`}
                </div>
            ) : (
                filteredFactors.map((factor) => (
                    <div key={factor.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-6 hover:border-blue-600/50 transition-all shadow-lg group">
                        <div className="flex justify-between items-start mb-2">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-lg md:text-xl font-bold text-slate-100">{factor.name}</h3>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                                        {factor.category}
                                    </span>
                                </div>
                                <p className="text-slate-400 text-sm max-w-2xl line-clamp-2">{factor.description}</p>
                            </div>
                            
                            {/* Desktop Actions */}
                            <div className="hidden md:flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleExport(factor)}
                                    disabled={exportingId === factor.id}
                                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-2"
                                    title="Download Package"
                                >
                                    {exportingId === factor.id ? (
                                        <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <Download size={16} />
                                    )}
                                </button>
                                <button 
                                    onClick={() => handleDelete(factor.id)}
                                    className="p-2 hover:bg-red-900/30 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        
                        {/* Mobile Actions Row */}
                        <div className="flex md:hidden items-center justify-between mt-3 mb-2">
                            <button 
                                onClick={() => toggleExpand(factor.id)}
                                className="text-xs text-blue-400 flex items-center gap-1 font-medium"
                            >
                                <Code size={12} /> {expandedFactorId === factor.id ? 'Hide Formula' : 'Show Formula'}
                            </button>
                             <div className="flex gap-2">
                                <button onClick={() => handleExport(factor)} className="p-1.5 bg-slate-800 rounded text-slate-300">
                                    <Download size={14} />
                                </button>
                                <button onClick={() => handleDelete(factor.id)} className="p-1.5 bg-red-900/20 text-red-400 rounded">
                                    <Trash2 size={14} />
                                </button>
                             </div>
                        </div>

                        {/* Code Block - Conditional on Mobile */}
                        <div className={`mt-2 bg-slate-950 rounded border border-slate-800 p-4 relative font-mono text-xs md:text-sm text-blue-300 ${expandedFactorId === factor.id ? 'block' : 'hidden md:block'}`}>
                            <Code size={14} className="absolute top-2 right-2 text-slate-600 hidden md:block" />
                            {factor.formula}
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-slate-800 flex gap-4 md:gap-6 text-sm items-center">
                             <div className="hidden md:block">
                                <span className="text-slate-500 mr-2">Calculated:</span>
                                <span className="text-slate-300">{new Date(factor.createdAt).toLocaleDateString()}</span>
                             </div>
                             {factor.performance && (
                                 <div className="flex gap-4 w-full md:w-auto justify-between md:justify-start">
                                     <div>
                                        <span className="text-slate-500 mr-2">Sharpe:</span>
                                        <span className={`font-mono font-bold ${factor.performance.sharpe > 1 ? 'text-emerald-400' : 'text-slate-300'}`}>
                                            {factor.performance.sharpe.toFixed(2)}
                                        </span>
                                     </div>
                                     <div>
                                         <span className="text-slate-500 mr-2">IC:</span>
                                         <span className="font-mono font-bold text-blue-400">{factor.performance.ic.toFixed(2)}</span>
                                     </div>
                                 </div>
                             )}
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
  );
};

export default LibraryView;
