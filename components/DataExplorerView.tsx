
import React, { useState, useEffect, useMemo } from 'react';
import { Database, Table as TableIcon, HardDrive, Search, Table, BarChart3, TrendingUp, FileText, Share2, Activity, Globe, PieChart } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Line, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Brush, ReferenceLine } from 'recharts';

// --- Types ---

export type DataCategory = 'MARKET' | 'FUNDAMENTAL' | 'ALTERNATIVE';

interface Dataset {
  id: string;
  symbol: string;
  name: string;
  category: DataCategory;
  subType: 'Daily' | 'Intraday (1m)' | 'Tick (L2)' | 'Quarterly' | 'Macro' | 'Event';
  rows: number;
}

interface DataExplorerViewProps {
    targetCategory: DataCategory;
}

// Generic Row Type for dynamic rendering
type DataRow = Record<string, any>;

// --- Mock Datasets Config ---

const MOCK_DATASETS: Dataset[] = [
  // Market Data (Organized by Ticker)
  { id: 'm1', symbol: 'AAPL', name: 'Apple Inc. (OHLC)', category: 'MARKET', subType: 'Daily', rows: 2500 },
  { id: 'm2', symbol: 'NVDA_1MIN', name: 'NVIDIA (1m OrderBook)', category: 'MARKET', subType: 'Intraday (1m)', rows: 39000 },
  { id: 'm3', symbol: 'ES_FUT', name: 'E-Mini S&P 500 (L2)', category: 'MARKET', subType: 'Tick (L2)', rows: 1500000 },
  
  // Fundamental Data (Universe Level)
  { id: 'fund_pe', symbol: 'UNIVERSE_PE', name: 'Universe P/E Ratio Distribution', category: 'FUNDAMENTAL', subType: 'Quarterly', rows: 40 },
  { id: 'fund_pb', symbol: 'UNIVERSE_PB', name: 'Universe P/B Ratio Distribution', category: 'FUNDAMENTAL', subType: 'Quarterly', rows: 40 },
  { id: 'fund_roe', symbol: 'UNIVERSE_ROE', name: 'Universe ROE Distribution', category: 'FUNDAMENTAL', subType: 'Quarterly', rows: 40 },
  
  // Alternative Data (Macro)
  { id: 'macro_cpi', symbol: 'US_CPI_YOY', name: 'US CPI (YoY Inflation)', category: 'ALTERNATIVE', subType: 'Macro', rows: 240 },
  { id: 'macro_gdp', symbol: 'US_GDP_QOQ', name: 'US Real GDP Growth', category: 'ALTERNATIVE', subType: 'Macro', rows: 100 },
  { id: 'macro_rates', symbol: 'FED_FUNDS', name: 'Effective Fed Funds Rate', category: 'ALTERNATIVE', subType: 'Macro', rows: 5000 },
  { id: 'macro_unemp', symbol: 'US_UNRATE', name: 'Unemployment Rate', category: 'ALTERNATIVE', subType: 'Macro', rows: 800 },
];

const DataExplorerView: React.FC<DataExplorerViewProps> = ({ targetCategory }) => {
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('chart');
  
  // Fundamental specific view toggle
  const [fundViewType, setFundViewType] = useState<'trend' | 'distribution'>('trend');

  const [data, setData] = useState<DataRow[]>([]);
  const [distributionData, setDistributionData] = useState<DataRow[]>([]); // For histogram
  const [loading, setLoading] = useState(false);

  // Filter datasets by active module
  const filteredDatasets = useMemo(() => 
    MOCK_DATASETS.filter(d => d.category === targetCategory), 
  [targetCategory]);

  // Ensure selected dataset matches category
  useEffect(() => {
    // When category changes, auto-select the first available dataset
    const first = filteredDatasets[0];
    if (first) {
        setSelectedDataset(first);
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

  const generateFundamentalAggregateData = (dataset: Dataset) => {
    // Simulates Aggregate Stats for a Universe of 5000 stocks
    // Instead of lines for stocks, we show Median, P25, P75 over time
    const generated: DataRow[] = [];
    const rows = 40; // 10 years of quarters
    const now = new Date();
    
    // Baseline metrics
    let median = dataset.id === 'fund_pe' ? 18 : dataset.id === 'fund_pb' ? 3 : 0.15;
    const volatility = dataset.id === 'fund_pe' ? 2 : 0.5;

    for (let i = 0; i < rows; i++) {
        const d = new Date(now);
        d.setMonth(d.getMonth() - (rows - i) * 3);
        const timeStr = d.toISOString().split('T')[0];
        
        // Random Walk Trend
        median += (Math.random() - 0.45) * volatility;
        if (median < 5) median = 5;

        // Spread logic (IQR)
        const iqrSpread = median * 0.4; // Spread is proportional to level
        const p25 = median - iqrSpread * 0.5;
        const p75 = median + iqrSpread * 0.5;
        const p10 = median - iqrSpread * 0.9;
        const p90 = median + iqrSpread * 0.9;

        generated.push({
            timestamp: timeStr,
            median: Number(median.toFixed(2)),
            p25: Number(p25.toFixed(2)),
            p75: Number(p75.toFixed(2)),
            p10: Number(p10.toFixed(2)),
            p90: Number(p90.toFixed(2)),
            count: 5234 // Universe count
        });
    }
    return generated;
  };

  const generateFundamentalDistribution = (dataset: Dataset) => {
      // Generates a snapshot histogram for the latest date
      const buckets: DataRow[] = [];
      const mean = dataset.id === 'fund_pe' ? 18 : 3;
      const std = mean * 0.4;
      
      // Generate standard normal distribution approximation
      for (let i = -3; i <= 3; i+= 0.5) {
          const valStart = mean + i * std;
          const valEnd = mean + (i + 0.5) * std;
          
          if (valStart < 0) continue;

          // Bell curve height
          const count = Math.floor(500 * Math.exp(-(Math.pow(i, 2) / 2)));
          
          buckets.push({
              bin: `${valStart.toFixed(1)}-${valEnd.toFixed(1)}`,
              count: count,
              mid: (valStart + valEnd) / 2
          });
      }
      return buckets;
  };

  const generateMacroData = (dataset: Dataset) => {
    const generated: DataRow[] = [];
    const rows = 120; // 10 years monthly
    const now = new Date();
    
    let val = 2.0;
    if (dataset.id === 'macro_rates') val = 5.25;
    if (dataset.id === 'macro_unemp') val = 4.0;

    for (let i = 0; i < rows; i++) {
        const d = new Date(now);
        d.setMonth(d.getMonth() - (rows - i));
        
        const change = (Math.random() - 0.5) * 0.1;
        val += change;
        if (val < 0) val = 0;

        generated.push({
            timestamp: d.toISOString().split('T')[0],
            value: Number(val.toFixed(2))
        });
    }
    return generated;
  };

  // --- Effect: Load Data ---

  useEffect(() => {
    if (!selectedDataset) return;

    setLoading(true);
    
    // Simulate network delay
    setTimeout(() => {
        let newData: DataRow[] = [];
        let distData: DataRow[] = [];

        if (selectedDataset.category === 'MARKET') {
            newData = generateMarketData(selectedDataset);
        } else if (selectedDataset.category === 'FUNDAMENTAL') {
            newData = generateFundamentalAggregateData(selectedDataset);
            distData = generateFundamentalDistribution(selectedDataset);
        } else {
            newData = generateMacroData(selectedDataset);
        }

        setData(newData);
        setDistributionData(distData);
        setLoading(false);
    }, 300);
  }, [selectedDataset]);

  // --- Render Helpers ---

  const columns = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'timestamp') : [];
  
  // Icon helper
  const getCategoryIcon = (cat: DataCategory) => {
      switch(cat) {
          case 'MARKET': return <TrendingUp className="text-purple-500" size={32} />;
          case 'FUNDAMENTAL': return <FileText className="text-blue-500" size={32} />;
          case 'ALTERNATIVE': return <Globe className="text-emerald-500" size={32} />;
      }
  };

  const getCategoryTitle = (cat: DataCategory) => {
      switch(cat) {
          case 'MARKET': return 'Market Data Explorer';
          case 'FUNDAMENTAL': return 'Fundamental Universe Explorer';
          case 'ALTERNATIVE': return 'Macroeconomic Data';
      }
  };

  if (!selectedDataset) {
      return (
          <div className="h-full flex items-center justify-center text-slate-500">
              <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin w-8 h-8 border-4 border-slate-700 border-t-transparent rounded-full"></div>
                  <p>Loading datasets...</p>
              </div>
          </div>
      )
  }

  return (
    <div className="h-full flex flex-col p-4 md:p-6 max-w-7xl mx-auto gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          {getCategoryIcon(targetCategory)}
          {getCategoryTitle(targetCategory)}
        </h1>
        <p className="text-slate-400 text-sm md:text-base">
            {targetCategory === 'FUNDAMENTAL' 
                ? "Analyze aggregate statistics and distributions for the entire stock universe (5000+ assets)."
                : targetCategory === 'ALTERNATIVE' 
                    ? "Track key macroeconomic indicators (GDP, CPI, Rates) to condition your alpha."
                    : "Inspect the underlying market datasets used for factor mining."
            }
        </p>
      </div>

      <div className="flex flex-1 gap-6 min-h-0 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        
        {/* Dataset List (Sidebar) */}
        <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col min-h-0 shrink-0">
            <div className="p-4 border-b border-slate-800 bg-slate-950/30">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {targetCategory === 'FUNDAMENTAL' ? 'Metrics' : targetCategory === 'ALTERNATIVE' ? 'Indicators' : 'Datasets'}
                </h3>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                    <input 
                        type="text" 
                        placeholder="Filter..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredDatasets.map(ds => (
                    <button
                        key={ds.id}
                        onClick={() => setSelectedDataset(ds)}
                        className={`w-full text-left p-3 rounded-lg border transition-all group ${
                            selectedDataset.id === ds.id 
                            ? 'bg-slate-800 border-slate-700' 
                            : 'bg-transparent border-transparent hover:bg-slate-800/50'
                        }`}
                    >
                        <div className="min-w-0">
                            <h4 className={`text-sm font-bold ${selectedDataset.id === ds.id ? 'text-white' : 'text-slate-300'}`}>{ds.name}</h4>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-[10px] text-slate-500 truncate">{ds.symbol}</span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">{ds.subType}</span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>

        {/* Main View Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950/30">
            
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        {selectedDataset.name}
                        <span className="text-xs font-normal text-slate-500 px-2 py-0.5 bg-slate-900 rounded border border-slate-800">{selectedDataset.category}</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <HardDrive size={12} /> Source: {targetCategory === 'ALTERNATIVE' ? 'Federal Reserve / BLS' : 'Internal FactSet'} • {selectedDataset.rows.toLocaleString()} rows
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Fundamental View Switcher */}
                    {targetCategory === 'FUNDAMENTAL' && viewMode === 'chart' && (
                        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                             <button 
                                onClick={() => setFundViewType('trend')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-colors ${
                                    fundViewType === 'trend' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                <TrendingUp size={14} /> Trend
                            </button>
                            <button 
                                onClick={() => setFundViewType('distribution')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-colors ${
                                    fundViewType === 'distribution' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                <PieChart size={14} /> Distribution
                            </button>
                        </div>
                    )}

                    <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
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
                            <BarChart3 size={14} /> Chart
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
                    </div>
                ) : viewMode === 'table' ? (
                    <div className="h-full overflow-auto">
                         <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-slate-900 text-slate-200 sticky top-0 font-mono text-xs uppercase tracking-wider z-10">
                                <tr>
                                    {targetCategory === 'FUNDAMENTAL' ? (
                                        <>
                                            <th className="px-6 py-3 font-medium border-b border-slate-800 w-32">Date</th>
                                            <th className="px-6 py-3 font-medium border-b border-slate-800 text-right">Median</th>
                                            <th className="px-6 py-3 font-medium border-b border-slate-800 text-right">25th %</th>
                                            <th className="px-6 py-3 font-medium border-b border-slate-800 text-right">75th %</th>
                                            <th className="px-6 py-3 font-medium border-b border-slate-800 text-right">Universe Count</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="px-6 py-3 font-medium border-b border-slate-800 w-32">Timestamp</th>
                                            {columns.map(col => (
                                                <th key={col} className="px-6 py-3 font-medium border-b border-slate-800 text-right">{col}</th>
                                            ))}
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50 font-mono">
                                {data.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-2 whitespace-nowrap text-slate-300">{row.timestamp}</td>
                                        {columns.map(col => (
                                            <td key={col} className="px-6 py-2 whitespace-nowrap text-right text-slate-400">
                                                {typeof row[col] === 'number' ? row[col].toLocaleString() : row[col]}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="h-full w-full p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            {targetCategory === 'FUNDAMENTAL' ? (
                                fundViewType === 'trend' ? (
                                    // Fundamental Trend (Aggregates)
                                    <ComposedChart data={data}>
                                         <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                         <XAxis dataKey="timestamp" stroke="#64748b" tick={{fontSize: 10}} />
                                         <YAxis stroke="#64748b" tick={{fontSize: 10}} domain={['auto', 'auto']} />
                                         <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155'}} />
                                         <Legend />
                                         {/* Range (IQR) */}
                                         <Area type="monotone" dataKey="p75" stroke="none" fill="#3b82f6" fillOpacity={0.1} stackId="1" />
                                         <Area type="monotone" dataKey="p25" stroke="none" fill="#0f172a" fillOpacity={1} stackId="1" /> 
                                         {/* Actual Median Line */}
                                         <Line type="monotone" dataKey="median" stroke="#3b82f6" strokeWidth={2} dot={false} name="Median" />
                                         <Line type="monotone" dataKey="p10" stroke="#64748b" strokeWidth={1} strokeDasharray="5 5" dot={false} name="10th %" />
                                         <Line type="monotone" dataKey="p90" stroke="#64748b" strokeWidth={1} strokeDasharray="5 5" dot={false} name="90th %" />
                                    </ComposedChart>
                                ) : (
                                    // Fundamental Distribution (Histogram)
                                    <BarChart data={distributionData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                        <XAxis dataKey="bin" stroke="#64748b" tick={{fontSize: 10}} />
                                        <YAxis stroke="#64748b" tick={{fontSize: 10}} />
                                        <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155'}} />
                                        <Bar dataKey="count" fill="#3b82f6" name="Frequency" radius={[4, 4, 0, 0]} />
                                        <ReferenceLine x="bin" stroke="red" label="Median" />
                                    </BarChart>
                                )
                            ) : targetCategory === 'ALTERNATIVE' ? (
                                // Macro Line Chart
                                <ComposedChart data={data}>
                                     <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                     <XAxis dataKey="timestamp" stroke="#64748b" tick={{fontSize: 10}} />
                                     <YAxis stroke="#64748b" tick={{fontSize: 10}} domain={['auto', 'auto']} />
                                     <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155'}} />
                                     <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} name="Value" />
                                     <Brush dataKey="timestamp" height={30} stroke="#475569" fill="#0f172a" />
                                </ComposedChart>
                            ) : (
                                // Standard Market Chart
                                <ComposedChart data={data}>
                                    <defs>
                                        <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis 
                                        dataKey="timestamp" 
                                        stroke="#64748b" 
                                        tick={{fontSize: 10}} 
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis domain={['auto', 'auto']} stroke="#64748b" tick={{fontSize: 11}} />
                                    <Tooltip 
                                        contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#e2e8f0'}} 
                                        itemStyle={{fontSize: 12}}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="close" stroke="#8b5cf6" fill="url(#colorMetric)" name="Price" />
                                    {data.length > 0 && 'bid' in data[0] && <Line type="monotone" dataKey="bid" stroke="#10b981" dot={false} strokeWidth={1} name="Bid" />}
                                    {data.length > 0 && 'ask' in data[0] && <Line type="monotone" dataKey="ask" stroke="#ef4444" dot={false} strokeWidth={1} name="Ask" />}
                                    <Brush dataKey="timestamp" height={30} stroke="#475569" fill="#0f172a" />
                                </ComposedChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default DataExplorerView;
