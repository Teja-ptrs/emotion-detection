import React from 'react';
import { deleteAllHistory } from '../services/api';
import { 
  ShieldCheck, 
  EyeOff, 
  Trash2, 
  HardDrive, 
  Cpu, 
  Video, 
  VideoOff
} from 'lucide-react';

interface PrivacyPageProps {
  isCameraActive: boolean;
  onStartCamera: () => void;
  onStopCamera: () => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({
  isCameraActive,
  onStartCamera,
  onStopCamera,
}) => {
  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to permanently delete all recorded history and observation metrics?')) return;
    try {
      await deleteAllHistory();
      alert('All session and history records have been permanently deleted from SQLite.');
    } catch (e) {
      console.error(e);
      alert('Failed to delete history.');
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-dark-800 border border-dark-700 shadow-xl">
        <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Privacy & Security Architecture</span>
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Privacy Policy & Data Safeguards
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Transparent data protection standards, local execution guarantees, and user data management controls.
        </p>
      </div>

      {/* Privacy Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-dark-800 border border-dark-700 shadow-lg space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Cpu className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-white">Local Pipeline Processing</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            All face detection, MediaPipe landmark extraction, and CNN model inferences execute on your local backend server. No video frames are transmitted to third parties.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-dark-800 border border-dark-700 shadow-lg space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
            <EyeOff className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-white">No Image Storage</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Raw camera video frames are processed transiently in memory and are discarded immediately. Camera image files are never written to disk or database.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-dark-800 border border-dark-700 shadow-lg space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-white">User-Controlled History</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Only numerical metadata (predicted emotion category, confidence score, and timestamp) is stored in SQLite when sessions are recorded.
          </p>
        </div>
      </div>

      {/* Data Controls & Actions Panel */}
      <div className="p-6 rounded-3xl bg-dark-800 border border-dark-700 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white">Direct Privacy Controls</h3>
        <p className="text-xs text-slate-400">
          Manage hardware camera access and clear historical databases at any time.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Camera Permission Toggle */}
          <div className="p-4 rounded-2xl bg-dark-900 border border-dark-700 flex items-center justify-between">
            <div>
              <h5 className="text-xs font-bold text-white">Webcam Hardware Access</h5>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Status: {isCameraActive ? <span className="text-emerald-400 font-bold">Active</span> : <span className="text-slate-500">Inactive</span>}
              </p>
            </div>
            {isCameraActive ? (
              <button
                onClick={onStopCamera}
                className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center space-x-1.5"
              >
                <VideoOff className="w-3.5 h-3.5" />
                <span>Stop Access</span>
              </button>
            ) : (
              <button
                onClick={onStartCamera}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center space-x-1.5"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Enable Camera</span>
              </button>
            )}
          </div>

          {/* Purge All Database Records */}
          <div className="p-4 rounded-2xl bg-dark-900 border border-dark-700 flex items-center justify-between">
            <div>
              <h5 className="text-xs font-bold text-white">Purge Database Records</h5>
              <p className="text-[11px] text-slate-400 mt-0.5">Permanent deletion of SQLite tables</p>
            </div>
            <button
              onClick={handleDeleteAll}
              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete History</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
