import React from 'react';
import { LayoutDashboard, Pickaxe, BookOpen, LineChart, Settings, Database, Terminal, FlaskConical, X, Briefcase } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'data', label: 'Data Explorer', icon: Database },
    { id: 'mining', label: 'Factor Mining', icon: Pickaxe },
    { id: 'library', label: 'Factor Library', icon: BookOpen },
    { id: 'single-backtest', label: 'Single Factor Analysis', icon: LineChart },
    { id: 'portfolio-lab', label: 'Portfolio Backtest & Analyze', icon: FlaskConical },
    { id: 'portfolio-lib', label: 'Portfolio Library', icon: Briefcase },
    { id: 'console', label: 'Python Console', icon: Terminal },
    { id: 'settings', label: 'Settings', icon: Settings },
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
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold font-mono">Q</span>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">QuantFactor</span>
          </div>
          {/* Close button for mobile */}
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="font-medium text-sm truncate">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-blue-500"></div>
            <div>
              <p className="text-xs font-medium text-white">Senior Quant</p>
              <p className="text-[10px] text-emerald-400">System Online</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;