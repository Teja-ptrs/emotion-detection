import React from 'react';
import { 
  Video, 
  LayoutDashboard, 
  History, 
  BarChart3, 
  FlaskConical, 
  Sparkles, 
  ShieldCheck, 
  Settings as SettingsIcon,
  Smile
} from 'lucide-react';
import { ActiveTab } from '../../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isLiveRecording: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isLiveRecording }) => {
  const navItems: { id: ActiveTab; label: string; icon: any; badge?: string }[] = [
    { id: 'live', label: 'Live Detection', icon: Video, badge: isLiveRecording ? 'REC' : undefined },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'history', label: 'History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'testing', label: 'Model Testing', icon: FlaskConical },
    { id: 'insights', label: 'AI Insights', icon: Sparkles },
    { id: 'privacy', label: 'Privacy', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 bg-dark-800 border-r border-dark-700 flex flex-col justify-between select-none shrink-0">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-dark-700 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center shadow-lg shadow-brand-primary/20">
            <Smile className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              Facial Emotion Detection <span className="text-[10px] bg-brand-primary/20 text-brand-primary px-1.5 py-0.5 rounded font-mono">v1.0</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Real-Time Facial Analysis</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-md shadow-brand-primary/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-dark-700/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Meta */}
      <div className="p-4 m-3 rounded-xl bg-dark-900/60 border border-dark-700/60 text-xs text-slate-400 space-y-1">
        <div className="flex items-center justify-between text-slate-300 font-medium">
          <span>Engine Status</span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Online
          </span>
        </div>
        <p className="text-[11px] text-slate-500">FER-2013 7-Class CNN Architecture</p>
      </div>
    </aside>
  );
};
