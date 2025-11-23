
import React, { useState, useEffect } from 'react';
import { Database, Table as TableIcon, Activity, Calendar, HardDrive, FileSpreadsheet, Search } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

// Mock Data Interfaces
interface MarketDataRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Dataset {
  id: string;
  symbol: string;
  name: string;
  source: string;
  rows: number;
  lastUpdated: string;
}

const MOCK_DATASETS: Dataset[] = [
  { id: '1', symbol: 'AAPL', name: 'Apple Inc.', source: 'TickDB Primary', rows: 2500, lastUpdated: '2024-03-10' },
  { id: '2', symbol: 'TSLA', name: 'Tesla Inc.', source: 'TickDB Primary', rows: 2500, lastUpdated: '2024-03-10' },
  { id: '3', symbol: 'BTC-USD', name: 'Bitcoin', source: 'Crypto Stream', rows: 15000, lastUpdated: 'Live' },
  { id: '4', symbol: 'SPY_5MIN', name: 'SPDR S&P 500 (5min)', source: 'Parquet Archive', rows: 78000, lastUpdated: '2023-12-31' },
];

const DataExplorerView: React.FC = () => {
  const [selectedDataset, setSelectedDataset] = useState<Dataset>(MOCK_DATASETS[0]);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [data, setData] = useState<MarketDataRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate deterministic mock data based on symbol
  useEffect(() => {
    setLoading(true);
    // Simulate fetch latency
    setTimeout(() => {
        const generatedData: MarketDataRow[] = [];
        let price = selectedDataset.symbol.includes('BTC') ? 65000 : 150;
        const now = new Date();
        
        for (let i = 0; i < 100; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - (100 - i));
            
            const volBase = Math.random() * 0.05; // 5% daily swing
            const change = (Math.random() - 0.48) * volBase; 
            
            const open = price;
            const close = price * (1 + change);
            const high = Math.max(open, close) * (1 + Math.random() * 0.01);
            const low = Math.min(open, close) * (1 - Math.random() * 0.01);
            const volume = Math.floor(1000000 + Math.random() * 500000);

            generatedData.push({
                date: date.toISOString().split('T')[0],
                open: parseFloat(open.toFixed(2)),
                high: parseFloat(high.toFixed(2)),
                low: parseFloat(low.toFixed(2)),
                close: parseFloat(close.toFixed(2)),
                volume
            });
            price = close;
        }
        setData(generatedData);
        setLoading(false);
    }, 400);
  }, [selectedDataset]);

  return (
    <div className="h-full flex flex-col p-4 md:p-6 max-w-7xl mx-auto gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Database className="text-purple-500" size={32} />
          Data Explorer
        </h1>
        <p className="text-slate-400 text-sm md:text-base">Inspect raw market data, validate integrity, and manage data sources.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">
        
        {/* Left Panel: Sources */}
        <div className="lg:col-span-3 flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg min-h-0">
            <div className="p-4 border-b border-slate-800 bg-slate-950/50">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">Data Sources</h3>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                    <input 
                        type="text" 
                        placeholder="Filter symbols..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {MOCK_DATASETS.map(ds => (
                    <button
                        key={ds.id}
                        onClick={() => setSelectedDataset(ds)}
                        className={`w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3 group ${
                            selectedDataset.id === ds.id 
                            ? 'bg-purple-500/10 border-purple-500/50' 
                            : 'bg-transparent border-transparent hover:bg-slate-800'
                        }`}
                    >
                        <div className={`p-2 rounded-lg ${selectedDataset.id === ds.id ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'}`}>
                            {ds.source.includes('Tick') ? <HardDrive size={16} /> : <FileSpreadsheet size={16} />}
                        </div>
                        <div className="min-w-0">
                            <h4 className={`text-sm font-bold ${selectedDataset.id === ds.id ? 'text-white' : 'text-slate-300'}`}>{ds.symbol}</h4>
                            <p className="text-[10px] text-slate-500 truncate">{ds.source}</p>
                        </div>
                    </button>
                ))}
            </div>
            <div className="p-4 border-t border-slate-800 text-xs text-center text-slate-500">
                Connected to: <span className="text-emerald-500 font-mono">tickdb-cluster-01</span>
            </div>
        </div>

        {/* Right Panel: Data View */}
        <div className="lg:col-span-9 flex flex-col gap-4 min-h-0">
            
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-white">{selectedDataset.symbol}</h2>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1"><HardDrive size={12} /> {selectedDataset.source}</span>
                            <span className="flex items-center gap-1"><Calendar size={12} /> Last: {selectedDataset.lastUpdated}</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                    <button 
                        onClick={() => setViewMode('table')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-colors ${
                            viewMode === 'table' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <TableIcon size={14} /> Table
                    </button>
                    <button 
                         onClick={() => setViewMode('chart')}
                         className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-colors ${
                            viewMode === 'chart' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <Activity size={14} /> Chart
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg min-h-[400px]">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
                    </div>
                ) : viewMode === 'table' ? (
                    <div className="h-full overflow-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-slate-950 text-slate-200 sticky top-0 font-mono text-xs uppercase tracking-wider z-10">
                                <tr>
                                    <th className="px-6 py-3 font-medium border-b border-slate-800">Date</th>
                                    <th className="px-6 py-3 font-medium border-b border-slate-800 text-right">Open</th>
                                    <th className="px-6 py-3 font-medium border-b border-slate-800 text-right">High</th>
                                    <th className="px-6 py-3 font-medium border-b border-slate-800 text-right">Low</th>
                                    <th className="px-6 py-3 font-medium border-b border-slate-800 text-right">Close</th>
                                    <th className="px-6 py-3 font-medium border-b border-slate-800 text-right">Volume</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50 font-mono">
                                {data.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-2.5 whitespace-nowrap text-slate-300">{row.date}</td>
                                        <td className="px-6 py-2.5 whitespace-nowrap text-right">{row.open.toFixed(2)}</td>
                                        <td className="px-6 py-2.5 whitespace-nowrap text-right text-emerald-400">{row.high.toFixed(2)}</td>
                                        <td className="px-6 py-2.5 whitespace-nowrap text-right text-red-400">{row.low.toFixed(2)}</td>
                                        <td className="px-6 py-2.5 whitespace-nowrap text-right text-slate-200 font-bold">{row.close.toFixed(2)}</td>
                                        <td className="px-6 py-2.5 whitespace-nowrap text-right text-slate-500">{row.volume.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="h-full p-4 md:p-6">
                        <div className="h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data}>
                                    <defs>
                                        <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="date" stroke="#64748b" tick={{fontSize: 10}} tickFormatter={(v) => v.substring(5)} />
                                    <YAxis domain={['auto', 'auto']} stroke="#64748b" tick={{fontSize: 11}} width={50} />
                                    <Tooltip 
                                        contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#e2e8f0'}} 
                                        itemStyle={{color: '#e2e8f0'}}
                                    />
                                    <Area type="monotone" dataKey="close" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorClose)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default DataExplorerView;
