
import React, { useState } from 'react';
import { Settings, Shield, Database, Bell, Key, Cpu, CreditCard } from 'lucide-react';
import { useNotification } from '../App';

const SettingsView: React.FC = () => {
  const [notifsEnabled, setNotifsEnabled] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [riskLimit, setRiskLimit] = useState("20");
  
  // New States
  const [tickDbKey, setTickDbKey] = useState("****************");
  const [fredKey, setFredKey] = useState("****************");
  const [latency, setLatency] = useState("10");
  const [txCost, setTxCost] = useState("0.5");

  const notify = useNotification();

  const handleSave = () => {
      notify('success', 'System settings saved successfully.');
  };

  return (
    <div className="h-full overflow-y-auto p-8 max-w-4xl mx-auto space-y-8 pb-24">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Settings className="text-slate-400" />
            Settings
            </h1>
            <p className="text-slate-400">Manage platform preferences and system configurations</p>
        </div>
        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium">
            Save Changes
        </button>
      </div>

      {/* General Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
            <h3 className="font-semibold text-white flex items-center gap-2">
                <Bell size={18} className="text-blue-500" /> General Preferences
            </h3>
        </div>
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-medium text-slate-200">Email Notifications</h4>
                    <p className="text-xs text-slate-500">Receive alerts when long-running backtests complete.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={notifsEnabled} onChange={() => setNotifsEnabled(!notifsEnabled)} />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>
            
             <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-medium text-slate-200">Auto-Save Research</h4>
                    <p className="text-xs text-slate-500">Automatically save snippets and drafts.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={autoSave} onChange={() => setAutoSave(!autoSave)} />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>
        </div>
      </div>

      {/* Data Provider Config */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
         <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
            <h3 className="font-semibold text-white flex items-center gap-2">
                <Database size={18} className="text-purple-500" /> Data Provider Keys
            </h3>
        </div>
        <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">TickDB API Key (Market Data)</label>
                    <div className="relative">
                        <Key className="absolute left-3 top-2.5 text-slate-500" size={14} />
                        <input 
                            type="password" 
                            value={tickDbKey}
                            onChange={(e) => setTickDbKey(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">FRED API Key (Macro)</label>
                    <div className="relative">
                        <Key className="absolute left-3 top-2.5 text-slate-500" size={14} />
                        <input 
                            type="password" 
                            value={fredKey}
                            onChange={(e) => setFredKey(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                        />
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Simulation / Backtest Engine Config */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
         <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
            <h3 className="font-semibold text-white flex items-center gap-2">
                <Cpu size={18} className="text-orange-500" /> Backtest Engine Defaults
            </h3>
        </div>
        <div className="p-6 space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block flex items-center gap-2">
                        <CreditCard size={14} /> Transaction Cost (bps)
                    </label>
                    <input 
                        type="number" 
                        value={txCost}
                        onChange={(e) => setTxCost(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    />
                    <p className="text-xs text-slate-500 mt-1">Applied per side (buy/sell) in backtests.</p>
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block flex items-center gap-2">
                        <Cpu size={14} /> Simulated Latency (ms)
                    </label>
                    <input 
                        type="number" 
                        value={latency}
                        onChange={(e) => setLatency(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    />
                    <p className="text-xs text-slate-500 mt-1">Added delay for HFT fill probability calculations.</p>
                </div>
             </div>
        </div>
      </div>

      {/* Risk Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
         <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
            <h3 className="font-semibold text-white flex items-center gap-2">
                <Shield size={18} className="text-emerald-500" /> Global Risk Parameters
            </h3>
        </div>
        <div className="p-6 space-y-4">
             <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Hard Max Drawdown Limit (%)</label>
                <div className="flex gap-4 items-center">
                    <input 
                        type="number" 
                        value={riskLimit}
                        onChange={(e) => setRiskLimit(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-32"
                    />
                    <span className="text-xs text-slate-500">This limit forces liquidation in live trading simulation if breached.</span>
                </div>
            </div>
        </div>
      </div>

    </div>
  );
};

export default SettingsView;
