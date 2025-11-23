
import React, { useState, useEffect } from 'react';
import { Database, Table as TableIcon, Activity, Calendar, HardDrive, FileSpreadsheet, Search, Clock, Zap, Layers } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// Mock Data Interfaces
interface MarketDataRow {
  timestamp: string; // ISO String or Time String
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  // HFT / Intraday Fields
  bid?: number;
  ask?: number;
  bidSize?: number;
  askSize?: number;
}

interface Dataset {
  id: string;
  symbol: string;
  name: string;
  source: string;
  rows: number;
  lastUpdated: string;
  type: 'Daily' | 'Intraday (1m)' | 'Tick (L2)';
}

const MOCK_DATASETS: Dataset[] = [
  { id: '1', symbol: 'AAPL', name: 'Apple Inc.', source: 'End-of-Day DB', rows: 2500, lastUpdated: '2024-03-10', type: 'Daily' },
  { id: '2', symbol: 'NVDA_1MIN', name: 'NVIDIA Corp (1m)', source: 'TickDB Primary', rows: 39000, lastUpdated: 'Live', type: 'Intraday (1m)' },
  { id: '3', symbol: 'BTC-USD', name: 'Bitcoin Perp', source: 'Crypto Stream', rows: 15000, lastUpdated: 'Live', type: 'Intraday (1m)' },
  { id: '4', symbol: 'ES_FUT', name: 'E-Mini S&P 500', source: 'L2 OrderBook', rows: 1500000, lastUpdated: 'Live', type: 'Tick (L2)' },
];

const DataExplorerView: React.FC = () => {
  const [selectedDataset, setSelectedDataset] = useState<Dataset>(MOCK_DATASETS[0]);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [data, setData] = useState<MarketDataRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate deterministic mock data based on symbol and type
  useEffect(() => {
    setLoading(true);
    // Simulate fetch latency
    setTimeout(() => {
        const generatedData: MarketDataRow[] = [];
        let price = selectedDataset.symbol.includes('BTC') ? 65000 : selectedDataset.symbol.includes('ES') ? 5200 : 150;
        
        const isIntraday = selectedDataset.type !== 'Daily';
        const rowsToGen = isIntraday ? 200 : 100;
        
        const now = new Date();
        // If Intraday, start at 9:30 AM today
        if (isIntraday) {
            now.setHours(9, 30, 0, 0);
        }

        for (let i = 0; i < rowsToGen; i++) {
            let timeStr = "";
            let change = 0;
            let volBase = 0;

            if (isIntraday) {
                // Add minutes
                const t = new Date(now.getTime() + i * 60000);
                timeStr = t.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                volBase = Math.random() * 0.0005; // Lower volatility per minute
            } else {
                // Subtract days
                const d = new Date(now);
                d.setDate(d.getDate() - (rowsToGen - i));
                timeStr = d.toISOString().split('T')[0];
                volBase = Math.random() * 0.03; // Higher volatility per day
            }
            
            change = (Math.random() - 0.48) * volBase * (selectedDataset.symbol.includes('BTC') ? 3 : 1);
            
            const open = price;
            const close = price * (1 + change);
            const high = Math.max(open, close) * (1 + Math.random() * (isIntraday ? 0.0005 : 0.01));
            const low = Math.min(open, close) * (1 - Math.random() * (isIntraday ? 0.0005 : 0.01));
            const volume = Math.floor((isIntraday ? 1000 : 1000000) + Math.random() * (isIntraday ? 5000 : 500000));

            const row: MarketDataRow = {
                timestamp: timeStr,
                open: parseFloat(open.toFixed(2)),
                high: parseFloat(high.toFixed(2)),
                low: parseFloat(low.toFixed(2)),
                close: parseFloat(close.toFixed(2)),
                volume
            };

            // Add L1/Orderbook Data for Intraday
            if (isIntraday) {
                const spread = price * 0.0002; // 2bps spread
                row.bid = parseFloat((close - spread).toFixed(2));
                row.ask = parseFloat((close + spread).toFixed(2));
                row.bidSize = Math.floor(Math.random() * 100 + 10);
                row.askSize = Math.floor(Math.random() * 100 + 10);
            }

            generatedData.push(row);
            price = close;
        }
        setData(generatedData);
        setLoading(false);
    }, 400);
  }, [selectedDataset]);

  const isIntradayView = selectedDataset.type !== 'Daily';

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
                            {ds.type === 'Daily' ? <Calendar size={16} /> : <Zap size={16} />}
                        </div>
                        <div className="min-w-0">
                            <h4 className={`text-sm font-bold ${selectedDataset.id === ds.id ? 'text-white' : 'text-slate-300'}`}>{ds.symbol}</h4>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-500 truncate">{ds.source}</span>
                                {ds.type !== 'Daily' && (
                                    <span className="text-[9px] px-1 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">HFT</span>
                                )}
                            </div>
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
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            {selectedDataset.symbol}
                            {isIntradayView && <span className="text-xs bg-purple-600 px-2 py-0.5 rounded text-white">LIVE</span>}
                        </h2>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1"><HardDrive size={12} /> {selectedDataset.source}</span>
                            <span className="flex items-center gap-1"><Clock size={12} /> Type: {selectedDataset.type}</span>
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
                                    <th className="px-6 py-3 font-medium border-b border-slate-800">Time</th>
                                    <th className="px-6 py-3 font-medium border-b border-slate-800 text-right">Price (Close)</th>
                                    <th className="px-6 py-3 font-medium border-b border-slate-800 text-right">Volume</th>
                                    {isIntradayView && (
                                        <>
                                            <th className="px-6 py-3 font-medium border-b border-slate-800 text-right text-emerald-500/70">Bid</th>
                                            <th className="px-6 py-3 font-medium border-b border-slate-800 text-right text-red-500/70">Ask</th>
                                            <th className="px-6 py-3 font-medium border-b border-slate-800 text-right text-slate-500">Bid Sz</th>
                                            <th className="px-6 py-3 font-medium border-b border-slate-800 text-right text-slate-500">Ask Sz</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50 font-mono">
                                {data.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-2.5 whitespace-nowrap text-slate-300">{row.timestamp}</td>
                                        <td className="px-6 py-2.5 whitespace-nowrap text-right text-slate-200 font-bold">{row.close.toFixed(2)}</td>
                                        <td className="px-6 py-2.5 whitespace-nowrap text-right text-slate-500">{row.volume.toLocaleString()}</td>
                                        {isIntradayView && (
                                            <>
                                                <td className="px-6 py-2.5 whitespace-nowrap text-right text-emerald-400">{row.bid?.toFixed(2)}</td>
                                                <td className="px-6 py-2.5 whitespace-nowrap text-right text-red-400">{row.ask?.toFixed(2)}</td>
                                                <td className="px-6 py-2.5 whitespace-nowrap text-right text-slate-500">{row.bidSize}</td>
                                                <td className="px-6 py-2.5 whitespace-nowrap text-right text-slate-500">{row.askSize}</td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="h-full p-4 md:p-6">
                        <div className="h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={data}>
                                    <defs>
                                        <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorSpread" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis 
                                        dataKey="timestamp" 
                                        stroke="#64748b" 
                                        tick={{fontSize: 10}} 
                                        interval={isIntradayView ? 20 : 'preserveStartEnd'}
                                    />
                                    <YAxis domain={['auto', 'auto']} stroke="#64748b" tick={{fontSize: 11}} width={50} />
                                    <Tooltip 
                                        contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#e2e8f0'}} 
                                        itemStyle={{fontSize: 12}}
                                    />
                                    <Legend />
                                    
                                    {/* Primary Close Price */}
                                    <Area 
                                        type="monotone" 
                                        dataKey="close" 
                                        name="Price"
                                        stroke="#a855f7" 
                                        strokeWidth={2} 
                                        fillOpacity={1} 
                                        fill="url(#colorClose)" 
                                    />

                                    {/* Bid/Ask Spread Visualization for HFT */}
                                    {isIntradayView && (
                                        <>
                                            <Line type="monotone" dataKey="bid" stroke="#10b981" strokeWidth={1} dot={false} strokeOpacity={0.5} name="Bid" />
                                            <Line type="monotone" dataKey="ask" stroke="#ef4444" strokeWidth={1} dot={false} strokeOpacity={0.5} name="Ask" />
                                        </>
                                    )}
                                </ComposedChart>
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
