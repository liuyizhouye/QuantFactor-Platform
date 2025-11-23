
import React, { useState } from 'react';
import { Settings, Shield, Database, Bell, Key } from 'lucide-react';

const SettingsView: React.FC = () => {
  const [notifsEnabled, setNotifsEnabled] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [riskLimit, setRiskLimit] = useState("20");

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Settings className="text-slate-400" />
          Settings
        </h1>
        <p className="text-slate-400">Manage platform preferences and system configurations</p>
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
                    <p className="text-xs text-slate-500">Automatically save snippets in Python Console.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={autoSave} onChange={() => setAutoSave(!autoSave)} />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
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
                <label className="block text-sm font-medium text-slate-300 mb-2">Default Max Drawdown Limit (%)</label>
                <div className="flex gap-4 items-center">
                    <input 
                        type="number" 
                        value={riskLimit}
                        onChange={(e) => setRiskLimit(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-32"
                    />
                    <span className="text-xs text-slate-500">This limit is applied to all backtests unless overridden manually.</span>
                </div>
            </div>
        </div>
      </div>

       {/* Data Connections */}
       <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden opacity-75">
         <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
            <h3 className="font-semibold text-white flex items-center gap-2">
                <Database size={18} className="text-purple-500" /> Data Connections
            </h3>
        </div>
        <div className="p-6">
            <div className="flex items-center justify-between p-3 border border-slate-800 rounded-lg bg-slate-950">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <div>
                        <p className="text-sm font-medium text-slate-200">TickDB Primary</p>
                        <p className="text-xs text-slate-500">Last heartbeat: 2ms ago</p>
                    </div>
                </div>
                <button className="text-xs text-blue-400 hover:text-blue-300">Configure</button>
            </div>
        </div>
      </div>

    </div>
  );
};

export default SettingsView;
