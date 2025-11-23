
import React, { useState, useEffect, useMemo } from 'react';
import { Table as TableIcon, HardDrive, Search, BarChart3, TrendingUp, FileText, Globe, PieChart, Building2, ScatterChart as ScatterIcon, ArrowRightLeft, Layers, ListFilter, Loader2, DollarSign, Eye, ArrowDownUp } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Line, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Brush, ReferenceLine, ScatterChart, Scatter, ZAxis } from 'recharts';

// --- Types ---

export type DataCategory = 'MARKET' | 'FUNDAMENTAL';

interface Dataset {
  id: string;
  symbol: string;
  name: string;
  category: DataCategory;
  subType: 'Daily' | 'Intraday (1m)' | 'Tick (L2)';
  rows: number;
}

interface DataExplorerViewProps {
    targetCategory: DataCategory;
}

type DataRow = Record<string, any>;

// --- Mock Datasets Config (Market) ---
const OTHER_DATASETS: Dataset[] = [
  { id: 'm1', symbol: 'AAPL', name: 'Apple Inc. (OHLC)', category: 'MARKET', subType: 'Daily', rows: 2500 },
  { id: 'm2', symbol: 'NVDA_1MIN', name: 'NVIDIA (1m OrderBook)', category: 'MARKET', subType: 'Intraday (1m)', rows: 39000 },
  { id: 'm3', symbol: 'ES_FUT', name: 'E-Mini S&P 500 (L2)', category: 'MARKET', subType: 'Tick (L2)', rows: 1500000 },
];

const FUND_METRICS = [
    { id: 'pe_ttm', name: 'P/E Ratio (TTM)', category: 'Valuation' },
    { id: 'pb_ratio', name: 'P/B Ratio', category: 'Valuation' },
    { id: 'roe_ttm', name: 'ROE %', category: 'Quality' },
    { id: 'gross_margin', name: 'Gross Margin %', category: 'Quality' },
    { id: 'rev_growth', name: 'Revenue Growth YoY', category: 'Growth' },
];

const MOCK_TICKERS = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL', 'AMZN', 'META', 'AMD'];

const DataExplorerView: React.FC<DataExplorerViewProps> = ({ targetCategory }) => {
  // General State
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DataRow[]>([]);
  
  // Fundamental Specific State
  const [fundMode, setFundMode] = useState<'UNIVERSE' | 'SINGLE'>('UNIVERSE');
  const [selectedMetric, setSelectedMetric] = useState(FUND_METRICS[0]); // For Universe
  const [selectedTicker, setSelectedTicker] = useState('AAPL'); // For Single
  const [tickerSearch, setTickerSearch] = useState('');
  const [singleChartTab, setSingleChartTab] = useState<'VALUATION' | 'GROWTH' | 'PROFITABILITY'>('VALUATION');

  // Auxiliary Data for Visualization
  const [distData, setDistData] = useState<DataRow[]>([]); // Histogram
  const [scatterData, setScatterData] = useState<DataRow[]>([]); // Scatter

  // Filter datasets (non-fundamental)
  const filteredDatasets = useMemo(() => 
    OTHER_DATASETS.filter(d => d.category === targetCategory), 
  [targetCategory]);

  // Init Logic
  useEffect(() => {
    if (targetCategory !== 'FUNDAMENTAL' && filteredDatasets.length > 0) {
        setSelectedDataset(filteredDatasets[0]);
    }
  }, [targetCategory, filteredDatasets]);

  // --- Data Generators ---

  const generateMarketData = (dataset: Dataset) => {
    const generated: DataRow[] = [];
    let price = dataset.symbol.includes('ES') ? 5200 : 150;
    const isIntraday = dataset.subType !== 'Daily';
    const rows = isIntraday ? 390 : 252;
    const now = new Date();
    if (isIntraday) now.setHours(9, 30, 0, 0);

    for (let i = 0; i < rows; i++) {
        let timeStr = "";
        if (isIntraday) {
             const t = new Date(now.getTime() + i * 60000);
             timeStr = t.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        } else {
             const d = new Date(now);
             d.setDate(d.getDate() - (rows - i));
             timeStr = d.toISOString().split('T')[0];
        }

        const change = (Math.random() - 0.48) * (isIntraday ? 0.001 : 0.02);
        const close = price * (1 + change);
        const open = price;
        const high = Math.max(open, close) + price * 0.005;
        const low = Math.min(open, close) - price * 0.005;
        
        const row: DataRow = {
            timestamp: timeStr,
            open: Number(open.toFixed(2)),
            high: Number(high.toFixed(2)),
            low: Number(low.toFixed(2)),
            close: Number(close.toFixed(2)),
            volume: Math.floor(Math.random() * 1000000)
        };

        if (isIntraday) {
            row.bid = Number((close - 0.02).toFixed(2));
            row.ask = Number((close + 0.02).toFixed(2));
            row.bid_size = Math.floor(Math.random() * 500);
            row.ask_size = Math.floor(Math.random() * 500);
        }
        generated.push(row);
        price = close;
    }
    return generated;
  };

  // --- Fundamental Generators ---

  const generateUniverseTrend = (metricId: string) => {
      const generated: DataRow[] = [];
      const rows = 40; // 10 years quarterly
      const now = new Date();
      let median = metricId === 'pe_ttm' ? 20 : metricId === 'roe_ttm' ? 15 : 3;
      const vol = median * 0.05;

      for(let i=0; i<rows; i++) {
          const d = new Date(now);
          d.setMonth(d.getMonth() - (rows - i)*3);
          
          median += (Math.random()-0.45) * vol;
          const spread = median * 0.3;

          generated.push({
              timestamp: d.toISOString().split('T')[0],
              median: Number(median.toFixed(2)),
              p25: Number((median - spread/2).toFixed(2)),
              p75: Number((median + spread/2).toFixed(2)),
              p10: Number((median - spread).toFixed(2)),
              p90: Number((median + spread).toFixed(2))
          });
      }
      return generated;
  };

  const generateUniverseHistogram = (metricId: string) => {
      const buckets: DataRow[] = [];
      const mean = metricId === 'pe_ttm' ? 20 : metricId === 'roe_ttm' ? 15 : 3;
      const std = mean * 0.4;
      
      for (let i = -2.5; i <= 2.5; i+= 0.5) {
          const valStart = mean + i * std;
          const valEnd = mean + (i + 0.5) * std;
          if (valStart < 0) continue;
          
          const count = Math.floor(400 * Math.exp(-(Math.pow(i, 2) / 2)));
          buckets.push({
              bin: `${valStart.toFixed(1)}-${valEnd.toFixed(1)}`,
              count: count
          });
      }
      return buckets;
  };

  const generateUniverseScatter = (metricId: string) => {
      const points: DataRow[] = [];
      const baseX = metricId === 'pe_ttm' ? 20 : 15;
      const tickersList = Array.from({length: 200}, (_, i) => `STK${i + 1000}`);
      
      for(let i=0; i<200; i++) {
          const xVal = baseX * (0.5 + Math.random());
          const yVal = (xVal * 0.5) + (Math.random() - 0.5) * 10; 
          const mktCap = Math.floor(Math.random() * 1000);
          
          points.push({
              ticker: tickersList[i],
              x: Number(xVal.toFixed(2)),
              y: Number(yVal.toFixed(2)),
              z: mktCap,
              sector: ['Tech', 'Finance', 'Health', 'Energy'][Math.floor(Math.random() * 4)]
          });
      }
      return points;
  };

  const generateSingleStockData = (ticker: string) => {
      const generated: DataRow[] = [];
      const rows = 20; // 5 years quarterly
      const now = new Date();
      let price = 100;
      let eps = 2.5;
      let netMargin = 0.15; // 15%

      for(let i=0; i<rows; i++) {
          const d = new Date(now);
          d.setMonth(d.getMonth() - (rows - i)*3);
          
          eps = eps * (1 + (Math.random() - 0.3) * 0.1);
          price = price * (1 + (Math.random() - 0.45) * 0.1);
          netMargin = netMargin * (1 + (Math.random() - 0.5) * 0.1);
          if (netMargin < 0.05) netMargin = 0.05;

          const revenue = (eps * 500 * (1 + Math.random()*0.1));
          const fcf = revenue * netMargin * 0.8; // FCF proxy

          generated.push({
              timestamp: d.toISOString().split('T')[0],
              price: Number(price.toFixed(2)),
              eps: Number(eps.toFixed(2)),
              pe: Number((price/eps).toFixed(2)),
              revenue: Number(revenue.toFixed(0)),
              netMargin: Number((netMargin * 100).toFixed(2)),
              fcf: Number(fcf.toFixed(0))
          });
      }
      return generated;
  };

  // --- Load Effect ---

  useEffect(() => {
      setLoading(true);
      // Using timeout to simulate network fetch
      const timer = setTimeout(() => {
          if (targetCategory === 'FUNDAMENTAL') {
              if (fundMode === 'UNIVERSE') {
                  setData(generateUniverseTrend(selectedMetric.id));
                  setDistData(generateUniverseHistogram(selectedMetric.id));
                  setScatterData(generateUniverseScatter(selectedMetric.id));
              } else {
                  setData(generateSingleStockData(selectedTicker));
              }
          } else if (selectedDataset) {
              setData(generateMarketData(selectedDataset));
          }
          setLoading(false);
      }, 300);
      return () => clearTimeout(timer);
  }, [targetCategory, selectedDataset, fundMode, selectedMetric, selectedTicker]);


  // --- Renders ---

  const renderSidebar = () => {
      if (targetCategory === 'FUNDAMENTAL') {
          return (
            <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col min-h-0 shrink-0">
                {/* Mode Switcher */}
                <div className="p-4 border-b border-slate-800 space-y-2">
                     <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                        <button 
                            onClick={() => setFundMode('UNIVERSE')}
                            className={`flex-1 py-2 rounded text-xs font-bold flex items-center justify-center gap-2 transition-all ${fundMode === 'UNIVERSE' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Layers size={14} /> Universe
                        </button>
                        <button 
                            onClick={() => setFundMode('SINGLE')}
                            className={`flex-1 py-2 rounded text-xs font-bold flex items-center justify-center gap-2 transition-all ${fundMode === 'SINGLE' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Building2 size={14} /> Single
                        </button>
                     </div>
                </div>

                {/* Contextual List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {fundMode === 'UNIVERSE' ? (
                        <>
                            <h3 className="px-2 py-2 text-xs font-bold text-slate-500 uppercase">Metrics</h3>
                            <div className="space-y-1">
                                {FUND_METRICS.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => setSelectedMetric(m)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                            selectedMetric.id === m.id ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:bg-slate-800/50'
                                        }`}
                                    >
                                        {m.name}
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="px-2 mb-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                                    <input 
                                        type="text" 
                                        placeholder="Search Ticker..."
                                        value={tickerSearch}
                                        onChange={(e) => setTickerSearch(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <h3 className="px-2 py-2 text-xs font-bold text-slate-500 uppercase">Watchlist</h3>
                            <div className="space-y-1">
                                {MOCK_TICKERS.filter(t => t.includes(tickerSearch.toUpperCase())).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setSelectedTicker(t)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex justify-between items-center ${
                                            selectedTicker === t ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:bg-slate-800/50'
                                        }`}
                                    >
                                        <span>{t}</span>
                                        {selectedTicker === t && <ArrowRightLeft size={12} className="text-blue-400" />}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
          );
      }

      // Default Sidebar for Market
      return (
        <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col min-h-0 shrink-0">
            <div className="p-4 border-b border-slate-800 bg-slate-950/30">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Datasets</h3>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                    <input type="text" placeholder="Filter..." className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none" />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredDatasets.map(ds => (
                    <button
                        key={ds.id}
                        onClick={() => setSelectedDataset(ds)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                            selectedDataset?.id === ds.id ? 'bg-slate-800 border-slate-700' : 'bg-transparent border-transparent hover:bg-slate-800/50'
                        }`}
                    >
                        <h4 className={`text-sm font-bold ${selectedDataset?.id === ds.id ? 'text-white' : 'text-slate-300'}`}>{ds.name}</h4>
                        <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                            <span>{ds.symbol}</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">{ds.subType}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
      );
  };

  const renderContent = () => {
      if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;
      
      if (targetCategory === 'FUNDAMENTAL') {
          if (fundMode === 'UNIVERSE') {
              return (
                  <div className="flex flex-col h-full p-6 overflow-y-auto gap-6">
                       {/* 1. Visualizations Grid */}
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 shrink-0">
                           {/* Chart 1: Trend */}
                           <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg h-[300px]">
                               <h4 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-blue-500"/> Median & Range (10Y)</h4>
                               <ResponsiveContainer width="100%" height="85%">
                                   <ComposedChart data={data}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                        <XAxis dataKey="timestamp" stroke="#64748b" tick={{fontSize: 10}} />
                                        <YAxis stroke="#64748b" tick={{fontSize: 10}} domain={['auto', 'auto']} />
                                        <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155'}} />
                                        <Area type="monotone" dataKey="p75" stroke="none" fill="#3b82f6" fillOpacity={0.1} stackId="1" />
                                        <Area type="monotone" dataKey="p25" stroke="none" fill="#0f172a" fillOpacity={1} stackId="1" /> 
                                        <Line type="monotone" dataKey="median" stroke="#3b82f6" strokeWidth={2} dot={false} name="Median" />
                                   </ComposedChart>
                               </ResponsiveContainer>
                           </div>

                           {/* Chart 2: Distribution */}
                           <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg h-[300px]">
                               <h4 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2"><BarChart3 size={16} className="text-purple-500"/> Cross-Sectional Histogram</h4>
                               <ResponsiveContainer width="100%" height="85%">
                                   <BarChart data={distData}>
                                       <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                       <XAxis dataKey="bin" stroke="#64748b" tick={{fontSize: 10}} />
                                       <YAxis stroke="#64748b" tick={{fontSize: 10}} />
                                       <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155'}} cursor={{fill: '#1e293b'}} />
                                       <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Frequency" />
                                   </BarChart>
                               </ResponsiveContainer>
                           </div>

                           {/* Chart 3: Scatter */}
                           <div className="col-span-1 lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg h-[350px]">
                               <h4 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2"><ScatterIcon size={16} className="text-emerald-500"/> Universe Scatter ({selectedMetric.name} vs Growth)</h4>
                               <ResponsiveContainer width="100%" height="85%">
                                   <ScatterChart>
                                       <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                       <XAxis type="number" dataKey="x" name={selectedMetric.name} stroke="#64748b" tick={{fontSize: 10}} label={{ value: selectedMetric.name, position: 'bottom', fill: '#64748b', fontSize: 10 }} />
                                       <YAxis type="number" dataKey="y" name="Growth %" stroke="#64748b" tick={{fontSize: 10}} label={{ value: 'Growth %', angle: -90, position: 'left', fill: '#64748b', fontSize: 10 }} />
                                       <ZAxis type="number" dataKey="z" range={[20, 200]} name="Market Cap" />
                                       <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155'}} />
                                       <Scatter name="Stocks" data={scatterData} fill="#10b981" fillOpacity={0.6} />
                                   </ScatterChart>
                               </ResponsiveContainer>
                           </div>
                  </div>

                   {/* 2. Universe Constituents Table (Bottom) */}
                   <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg overflow-hidden flex flex-col min-h-[400px]">
                       <h4 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2"><ListFilter size={16} className="text-slate-500"/> Constituents Data</h4>
                       <div className="flex-1 overflow-auto">
                           <table className="w-full text-left text-sm text-slate-400 font-mono">
                                <thead className="bg-slate-950 text-slate-200 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-2 border-b border-slate-800">Ticker</th>
                                        <th className="px-4 py-2 border-b border-slate-800">Sector</th>
                                        <th className="px-4 py-2 border-b border-slate-800 text-right">{selectedMetric.name}</th>
                                        <th className="px-4 py-2 border-b border-slate-800 text-right">Growth %</th>
                                        <th className="px-4 py-2 border-b border-slate-800 text-right">Market Cap Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {scatterData.map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-800/30">
                                            <td className="px-4 py-2 text-slate-200 font-bold">{row.ticker}</td>
                                            <td className="px-4 py-2 text-slate-400">{row.sector}</td>
                                            <td className="px-4 py-2 text-right text-blue-400">{row.x}</td>
                                            <td className="px-4 py-2 text-right text-emerald-400">{row.y}</td>
                                            <td className="px-4 py-2 text-right text-slate-500">{row.z}</td>
                                        </tr>
                                    ))}
                                </tbody>
                           </table>
                       </div>
                   </div>
                </div>
              );
          } else {
              // SINGLE STOCK VIEW
              if (data.length > 0 && !('revenue' in data[0])) {
                   return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;
              }

              return (
                  <div className="flex flex-col h-full p-6 overflow-y-auto gap-6">
                      {/* Header Info */}
                      <div className="flex justify-between items-center">
                          <div>
                              <h2 className="text-xl font-bold text-white">{selectedTicker}</h2>
                              <p className="text-xs text-slate-400">Nasdaq • USD • Consumer Electronics</p>
                          </div>
                          <div className="text-right">
                               <p className="text-xl font-bold text-emerald-400">${data[data.length-1]?.price}</p>
                               <p className="text-xs text-emerald-500">+1.2% (Today)</p>
                          </div>
                      </div>

                      {/* 1. Financial Statements Table (TOP PRIORITY) */}
                      <div className="min-h-[400px] bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg overflow-hidden flex flex-col">
                          <h4 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2"><FileText size={16} className="text-blue-500"/> Historical Financial Statements</h4>
                          <div className="flex-1 overflow-auto">
                             <table className="w-full text-left text-sm text-slate-400 font-mono">
                                <thead className="bg-slate-950 text-slate-200 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-2 border-b border-slate-800">Period</th>
                                        <th className="px-4 py-2 border-b border-slate-800 text-right">Revenue</th>
                                        <th className="px-4 py-2 border-b border-slate-800 text-right">FCF</th>
                                        <th className="px-4 py-2 border-b border-slate-800 text-right">EPS</th>
                                        <th className="px-4 py-2 border-b border-slate-800 text-right">Margin %</th>
                                        <th className="px-4 py-2 border-b border-slate-800 text-right">P/E</th>
                                        <th className="px-4 py-2 border-b border-slate-800 text-right">Close Price</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {/* Reverse map to show newest first */}
                                    {[...data].reverse().map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-800/30">
                                            <td className="px-4 py-2 text-slate-300">{row.timestamp}</td>
                                            <td className="px-4 py-2 text-right">{row.revenue?.toLocaleString() || '-'}</td>
                                            <td className="px-4 py-2 text-right text-emerald-400/80">{row.fcf?.toLocaleString() || '-'}</td>
                                            <td className="px-4 py-2 text-right">{row.eps}</td>
                                            <td className="px-4 py-2 text-right text-pink-400">{row.netMargin}%</td>
                                            <td className="px-4 py-2 text-right text-amber-500">{row.pe}</td>
                                            <td className="px-4 py-2 text-right text-emerald-500">{row.price}</td>
                                        </tr>
                                    ))}
                                </tbody>
                             </table>
                          </div>
                      </div>

                      {/* 2. Visualizer (Consolidated) */}
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg h-[400px] flex flex-col shrink-0">
                          <div className="flex justify-between items-center mb-4">
                               <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                   <Eye size={16} className="text-purple-500"/> Financial Visualizer
                               </h4>
                               <div className="flex bg-slate-950 p-1 rounded border border-slate-800">
                                   {(['VALUATION', 'GROWTH', 'PROFITABILITY'] as const).map(tab => (
                                       <button
                                            key={tab}
                                            onClick={() => setSingleChartTab(tab)}
                                            className={`px-3 py-1 rounded text-[10px] font-bold transition-colors ${singleChartTab === tab ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                       >
                                           {tab}
                                       </button>
                                   ))}
                               </div>
                          </div>
                          
                          <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="timestamp" stroke="#64748b" tick={{fontSize: 10}} />
                                    <YAxis yAxisId="left" stroke="#64748b" tick={{fontSize: 10}} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={{fontSize: 10}} />
                                    <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155'}} />
                                    <Legend />
                                    
                                    {singleChartTab === 'VALUATION' && (
                                        <>
                                            <Area yAxisId="left" type="monotone" dataKey="price" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} name="Price" />
                                            <Line yAxisId="right" type="monotone" dataKey="pe" stroke="#f59e0b" strokeWidth={2} dot={true} name="P/E Ratio" />
                                        </>
                                    )}
                                    {singleChartTab === 'GROWTH' && (
                                        <>
                                            <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" opacity={0.3} name="Revenue" />
                                            <Line yAxisId="right" type="monotone" dataKey="eps" stroke="#10b981" strokeWidth={2} dot={true} name="EPS" />
                                        </>
                                    )}
                                    {singleChartTab === 'PROFITABILITY' && (
                                        <>
                                            <Bar yAxisId="left" dataKey="fcf" fill="#10b981" opacity={0.3} name="Free Cash Flow" />
                                            <Line yAxisId="right" type="monotone" dataKey="netMargin" stroke="#ec4899" strokeWidth={2} dot={true} name="Net Margin %" />
                                        </>
                                    )}
                                </ComposedChart>
                            </ResponsiveContainer>
                          </div>
                      </div>

                  </div>
              );
          }
      }

      // Default Chart/Table View for Market
      return (
          <div className="h-full p-6 flex flex-col gap-6">
             <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={data}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                           <XAxis dataKey="timestamp" stroke="#64748b" tick={{fontSize: 10}} />
                           <YAxis domain={['auto', 'auto']} stroke="#64748b" tick={{fontSize: 10}} />
                           <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155'}} />
                           <Legend />
                           <Area type="monotone" dataKey={'close'} stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} name={'Price'} />
                           {data.length > 0 && 'bid' in data[0] && <Line type="monotone" dataKey="bid" stroke="#10b981" dot={false} strokeWidth={1} />}
                           {data.length > 0 && 'ask' in data[0] && <Line type="monotone" dataKey="ask" stroke="#ef4444" dot={false} strokeWidth={1} />}
                      </ComposedChart>
                  </ResponsiveContainer>
             </div>
             {/* Simple Table Preview */}
             <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                 <div className="overflow-auto h-full">
                     <table className="w-full text-sm text-slate-400 font-mono">
                         <thead className="bg-slate-950 text-slate-200 sticky top-0">
                             <tr>
                                 {data.length > 0 && Object.keys(data[0]).slice(0, 6).map(k => (
                                     <th key={k} className="px-4 py-2 border-b border-slate-800 text-left">{k}</th>
                                 ))}
                             </tr>
                         </thead>
                         <tbody>
                             {data.slice(0, 50).map((row, i) => (
                                 <tr key={i} className="hover:bg-slate-800/30 border-b border-slate-800/50">
                                     {Object.values(row).slice(0, 6).map((v, j) => (
                                         <td key={j} className="px-4 py-2">{typeof v === 'number' ? v.toLocaleString() : v}</td>
                                     ))}
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
             </div>
          </div>
      );
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 max-w-7xl mx-auto gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          {targetCategory === 'MARKET' && <TrendingUp className="text-purple-500" size={32} />}
          {targetCategory === 'FUNDAMENTAL' && <FileText className="text-blue-500" size={32} />}
          
          {targetCategory === 'FUNDAMENTAL' ? 'Fundamental Analytics' : selectedDataset?.name || 'Data Explorer'}
        </h1>
        <p className="text-slate-400 text-sm">
            {targetCategory === 'FUNDAMENTAL' 
                ? "Analyze universe-wide distributions or deep-dive into single stock financials."
                : `Source: ${selectedDataset?.id} • ${selectedDataset?.rows.toLocaleString()} rows available`}
        </p>
      </div>

      <div className="flex flex-1 gap-6 min-h-0 bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {renderSidebar()}
        
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950/30">
            {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default DataExplorerView;
