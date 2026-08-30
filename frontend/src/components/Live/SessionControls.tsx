import React, { useState } from 'react';
import { Play, Square, Timer } from 'lucide-react';
import { Session } from '../../types';

interface SessionControlsProps {
  session: Session | null;
  sessionDuration: number;
  onStartSession: (notes?: string) => Promise<any>;
  onStopSession: () => Promise<any>;
  isCameraActive: boolean;
}

export const SessionControls: React.FC<SessionControlsProps> = ({
  session,
  sessionDuration,
  onStartSession,
  onStopSession,
  isCameraActive,
}) => {
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [notes, setNotes] = useState('');

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    setIsStarting(true);
    try {
      await onStartSession(notes.trim() || undefined);
      setNotes('');
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    setIsStopping(true);
    try {
      await onStopSession();
    } finally {
      setIsStopping(false);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-dark-800 border border-dark-700 shadow-xl flex flex-wrap items-center justify-between gap-4">
      {/* Session State / Timer */}
      <div className="flex items-center space-x-3">
        <div className={`w-3 h-3 rounded-full ${session ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`} />
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              {session ? 'Recording Session Active' : 'No Active Session'}
            </span>
            {session && (
              <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-mono">
                {session.session_uuid.slice(0, 8)}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2 mt-0.5 text-xs text-slate-400 font-mono">
            <Timer className="w-3.5 h-3.5 text-brand-primary" />
            <span>Elapsed: {formatDuration(sessionDuration)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-3">
        {!session ? (
          <button
            onClick={handleStart}
            disabled={!isCameraActive || isStarting}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Session Recording</span>
          </button>
        ) : (
          <button
            onClick={handleStop}
            disabled={isStopping}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-red-600/20 flex items-center space-x-2 transition-all"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>End Session & Save</span>
          </button>
        )}
      </div>
    </div>
  );
};
