
import React from 'react';
import { LayoutDashboard, Pickaxe, BookOpen, LineChart, Settings, Database, Terminal, FlaskConical, X, Briefcase, Zap, Activity, TrendingUp, FileText, Share2 } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  
  const menuGroups = [
    {
      title: "Overview",
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'console', label: 'Python Console', icon: Terminal },
        { id: 'settings', label: 'Settings', icon: Settings },
      ]
    },
    {
      title: "Data Analysis",
      items: [
         { id: 'data-market', label: 'Market Data', icon: TrendingUp },
         { id: 'data-fund', label: 'Fundamental Data', icon: FileText },
         { id: 'data-alt', label: 'Alternative Data', icon: Share2 },
      ]
    },
    {
      title: "Alpha Research (Daily)",
      items: [
        { id: 'mining-lf', label: 'Alpha Mining', icon: Pickaxe },
        { id: 'library-lf', label: 'Alpha Library', icon: BookOpen },
        { id: 'portfolio-lf', label: 'Alpha Portfolio', icon: FlaskConical },
        { id: 'backtest-lf', label: 'Single Factor Backtest', icon: LineChart },
      ]
    },
    {
      title: "HFT Research (Intraday)",
      items: [
        { id: 'mining-hf', label: 'HFT Mining', icon: Zap },
        { id: 'library-hf', label: 'HFT Library', icon: Activity },
        { id: 'portfolio-hf', label: 'HFT Portfolio', icon: FlaskConical },
        { id: 'backtest-hf', label: 'HFT Microstructure', icon: LineChart },
      ]
    },
    {
      title: "Portfolio Management",
      items: [
        { id: 'portfolio-lib', label: 'Portfolio Library', icon: Briefcase },
      ]
    }
  ];

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    onClose(); // Close sidebar on mobile when item selected
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`fixed left-0 top-0 h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
              <span className="text-white font-bold font-mono">Q</span>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">QuantFactor</span>
          </div>
          {/* Close button for mobile */}
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-700">
          <div className="space-y-6 px-3">
            {menuGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                <h3 className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                  {group.title}
                </h3>
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => handleTabClick(item.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-100 ${
                            isActive 
                              ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-sm' 
                              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                          }`}
                        >
                          <Icon size={18} className={isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"} />
                          <span className="font-medium text-sm truncate">{item.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white shadow-inner">
              SQ
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">Senior Quant</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-[10px] text-emerald-400">System Online</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
