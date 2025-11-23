
import React from 'react';
import { Factor, FactorFrequency } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp, Users, Database, Server, Clock, Zap, BookOpen, Activity } from 'lucide-react';

interface DashboardProps {
    factors: Factor[];
}

const Dashboard: React.FC<DashboardProps> = ({ factors }) => {
  // Aggregate stats
  const totalFactors = factors.length;
  const highFreqCount = factors.filter(f => f.frequency === FactorFrequency.HIGH_FREQ).length;
  const lowFreqCount = factors.filter(f => f.frequency === FactorFrequency.LOW_FREQ).length;
  
  const categories = factors.reduce((acc, f) => {
    acc[f.category] = (acc[f.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.keys(categories).map(k => ({ name: k, count: categories[k] }));

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 space-y-8 pb-20 md:pb-8 max-w-7xl mx-auto">
        <div>
            <h1 className="text-2xl font-bold text-white">Market Overview</h1>
            <p className="text-slate-400 text-sm md:text-base">System status and factor library statistics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <BookOpen className="text-blue-500" size={24} />
                    </div>
                    <span className="text-xs font-medium text-slate-500 bg-slate-950 px-2 py-1 rounded">Daily</span>
                </div>
                <h3 className="text-3xl font-bold text-white">{lowFreqCount}</h3>
                <p className="text-sm text-slate-400">Alpha Strategies</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                        <Zap className="text-orange-500" size={24} />
                    </div>
                    <span className="text-xs font-medium text-slate-500 bg-slate-950 px-2 py-1 rounded">Intraday</span>
                </div>
                <h3 className="text-3xl font-bold text-white">{highFreqCount}</h3>
                <p className="text-sm text-slate-400">HFT Algos</p>
            </div>

             <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <Activity className="text-emerald-500" size={24} />
                    </div>
                    <span className="text-xs font-medium text-emerald-500">+12% vs yest</span>
                </div>
                <h3 className="text-3xl font-bold text-white">2.4ms</h3>
                <p className="text-sm text-slate-400">Avg. Execution Latency</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Server className="text-purple-500" size={24} />
                    </div>
                </div>
                <h3 className="text-3xl font-bold text-white">3</h3>
                <p className="text-sm text-slate-400">Active Data Nodes</p>
            </div>
        </div>
        
        {/* Data Feed Health */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
             <h3 className="text-lg font-bold text-white mb-4">Data Feed Health</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="flex items-center justify-between p-3 border border-slate-800 rounded-lg bg-slate-950">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <div>
                            <p className="text-sm font-medium text-slate-200">TickDB (Market)</p>
                            <p className="text-[10px] text-slate-500">L2 Stream Active</p>
                        </div>
                    </div>
                    <span className="text-xs font-mono text-emerald-400">12ms</span>
                 </div>
                 <div className="flex items-center justify-between p-3 border border-slate-800 rounded-lg bg-slate-950">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <div>
                            <p className="text-sm font-medium text-slate-200">Edgar (Fund)</p>
                            <p className="text-[10px] text-slate-500">Quarterly Sync OK</p>
                        </div>
                    </div>
                    <span className="text-xs font-mono text-slate-400">Idle</span>
                 </div>
                 <div className="flex items-center justify-between p-3 border border-slate-800 rounded-lg bg-slate-950">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <div>
                            <p className="text-sm font-medium text-slate-200">FRED (Macro)</p>
                            <p className="text-[10px] text-slate-500">Daily Sync OK</p>
                        </div>
                    </div>
                    <span className="text-xs font-mono text-slate-400">Idle</span>
                 </div>
             </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-bold text-white mb-6">Factors by Category</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 10}} interval={0} angle={-15} textAnchor="end" height={60} />
                            <YAxis stroke="#64748b" />
                            <Tooltip 
                                cursor={{fill: '#1e293b'}}
                                contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#e2e8f0'}} 
                            />
                            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-bold text-white mb-6">Recent Activity</h3>
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800 hover:bg-slate-800/50 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-slate-400">
                                    F{i}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-200 truncate">System Backtest Completed</p>
                                    <p className="text-xs text-slate-500 truncate">Factor ID: alpha_momentum_v{i}</p>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <span className="text-xs font-mono text-emerald-400">SR: 1.{8+i}</span>
                                <p className="text-[10px] text-slate-600">2h ago</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

export default Dashboard;
