import React from 'react';
import { Activity, Cpu, Database, Sparkles, Shield } from 'lucide-react';
import { ModelStatus } from '../../types';

interface HeaderProps {
  modelStatus: ModelStatus | null;
  liveFps: number;
  activeFaceCount: number;
}

export const Header: React.FC<HeaderProps> = ({ modelStatus, liveFps, activeFaceCount }) => {
  return (
    <header className="h-16 border-b border-dark-700 bg-dark-800/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
      {/* Title / Breadcrumb */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-brand-primary" />
          <span className="font-semibold text-sm text-slate-200">
            Facial Emotion Recognition & Statistical Analytics System
          </span>
        </div>
      </div>

      {/* Real-time Telemetry Pills */}
      <div className="flex items-center space-x-3 text-xs">
        {/* Model Status Pill */}
        <div
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border ${
            modelStatus?.model_loaded
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span className="font-medium">
            {modelStatus?.model_loaded ? 'CNN Model Active' : 'Model Missing'}
          </span>
        </div>

        {/* Live FPS */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-dark-700 bg-dark-900/50 text-slate-300">
          <Activity className="w-3.5 h-3.5 text-brand-accent" />
          <span>
            FPS: <strong className="font-mono text-white">{liveFps}</strong>
          </span>
        </div>

        {/* Faces Tracked */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-dark-700 bg-dark-900/50 text-slate-300">
          <Shield className="w-3.5 h-3.5 text-brand-secondary" />
          <span>
            Faces: <strong className="font-mono text-white">{activeFaceCount}</strong>
          </span>
        </div>

        {/* Database Indicator */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-dark-700 bg-dark-900/50 text-slate-300">
          <Database className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">SQLite Local</span>
        </div>
      </div>
    </header>
  );
};
