import React, { useState } from 'react';
import { Factor, FactorCategory } from '../types';
import { Trash2, Edit, Code, Filter, X, Download } from 'lucide-react';
import { exportFactorData } from '../services/exportService';

interface LibraryViewProps {
  factors: Factor[];
  onDelete: (id: string) => void;
}

const LibraryView: React.FC<LibraryViewProps> = ({ factors, onDelete }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Object.values(FactorCategory)];

  const filteredFactors = selectedCategory === 'All' 
    ? factors 
    : factors.filter(f => f.category === selectedCategory);

  return (
    <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Factor Library</h1>
                <p className="text-slate-400">Manage your proprietary algorithms</p>
            </div>
            <div className="px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
                <span className="text-sm text-slate-400">
                    Showing <span className="text-white font-bold">{filteredFactors.length}</span> of {factors.length}
                </span>
            </div>
        </div>

        {/* Filter Bar */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 mr-2 shrink-0">
                <Filter size={14} />
                <span className="text-xs font-medium uppercase tracking-wider">Filter By</span>
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
                    className="ml-auto flex items-center gap-1 text-xs text-slate-500 hover:text-white px-2"
                >
                    <X size={12} /> Clear
                </button>
            )}
        </div>

        <div className="grid grid-cols-1 gap-4">
            {filteredFactors.length === 0 ? (
                <div className="text-center py-20 text-slate-500 bg-slate-900 rounded-xl border border-dashed border-slate-800">
                    {factors.length === 0 
                        ? "No factors saved yet. Go to Mining to generate some." 
                        : `No factors found in category "${selectedCategory}".`}
                </div>
            ) : (
                filteredFactors.map((factor) => (
                    <div key={factor.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-blue-600/50 transition-all shadow-lg group">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-bold text-slate-100">{factor.name}</h3>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                                        {factor.category}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${factor.frequency.includes('High') ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                        {factor.frequency.includes('High') ? 'HF' : 'LF'}
                                    </span>
                                </div>
                                <p className="text-slate-400 text-sm max-w-2xl">{factor.description}</p>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => exportFactorData(factor)}
                                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-400 transition-colors"
                                    title="Export Package (JSON)"
                                >
                                    <Download size={16} />
                                </button>
                                <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                                    <Edit size={16} />
                                </button>
                                <button 
                                    onClick={() => onDelete(factor.id)}
                                    className="p-2 hover:bg-red-900/30 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 bg-slate-950 rounded border border-slate-800 p-4 relative font-mono text-sm text-blue-300">
                            <Code size={14} className="absolute top-2 right-2 text-slate-600" />
                            {factor.formula}
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-slate-800 flex gap-6 text-sm">
                             <div>
                                <span className="text-slate-500 mr-2">Calculated:</span>
                                <span className="text-slate-300">{new Date(factor.createdAt).toLocaleDateString()}</span>
                             </div>
                             {factor.performance && (
                                 <div>
                                     <span className="text-slate-500 mr-2">Last Sharpe:</span>
                                     <span className={`font-mono font-bold ${factor.performance.sharpe > 1 ? 'text-emerald-400' : 'text-slate-300'}`}>
                                         {factor.performance.sharpe.toFixed(2)}
                                     </span>
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