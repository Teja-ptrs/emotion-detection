import React from 'react';
import { AppSettings } from '../types';
import { CameraDevice } from '../hooks/useCamera';
import { 
  Settings as SettingsIcon, 
  Camera, 
  Eye, 
  Sliders, 
  Database, 
  Sparkles, 
  Gauge
} from 'lucide-react';

interface SettingsPageProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  devices: CameraDevice[];
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  setSettings,
  devices,
}) => {
  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-dark-800 border border-dark-700 shadow-xl">
        <div className="flex items-center space-x-2 text-brand-primary text-xs font-bold uppercase tracking-wider mb-1">
          <SettingsIcon className="w-4 h-4" />
          <span>System Configuration</span>
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Application & Pipeline Settings
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Tune real-time video parameters, MediaPipe landmark rendering, smoothing filters, and database logging.
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-dark-800 border border-dark-700 shadow-xl space-y-6">
        {/* Camera Selection */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-dark-700/80">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-sm font-bold text-white">
              <Camera className="w-4 h-4 text-brand-primary" />
              <span>Camera Video Input Source</span>
            </div>
            <p className="text-xs text-slate-400">Select active hardware webcam device</p>
          </div>
          <select
            value={settings.selectedCameraId}
            onChange={(e) => updateSetting('selectedCameraId', e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-dark-900 border border-dark-700 text-xs text-white focus:outline-none"
          >
            <option value="">Default Camera</option>
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Show Landmarks Toggle */}
        <div className="flex items-center justify-between pb-6 border-b border-dark-700/80">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-sm font-bold text-white">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>MediaPipe Facial Landmarks Mesh</span>
            </div>
            <p className="text-xs text-slate-400">Render 468-point 3D landmark wireframe over detected faces</p>
          </div>
          <button
            onClick={() => updateSetting('showLandmarks', !settings.showLandmarks)}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.showLandmarks ? 'bg-brand-primary' : 'bg-dark-900 border border-dark-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.showLandmarks ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Show Confidence Overlay */}
        <div className="flex items-center justify-between pb-6 border-b border-dark-700/80">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-sm font-bold text-white">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Bounding Box Confidence Tag</span>
            </div>
            <p className="text-xs text-slate-400">Display numerical confidence percentage beside face bounding boxes</p>
          </div>
          <button
            onClick={() => updateSetting('showConfidence', !settings.showConfidence)}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.showConfidence ? 'bg-brand-primary' : 'bg-dark-900 border border-dark-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.showConfidence ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Prediction Rate FPS Slider */}
        <div className="space-y-3 pb-6 border-b border-dark-700/80">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-sm font-bold text-white">
                <Gauge className="w-4 h-4 text-emerald-400" />
                <span>Prediction Sampling Rate (FPS)</span>
              </div>
              <p className="text-xs text-slate-400">Inference request frequency (5–20 FPS)</p>
            </div>
            <span className="font-mono font-bold text-sm text-white px-2.5 py-1 bg-dark-900 border border-dark-700 rounded-lg">
              {settings.predictionFps} FPS
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="20"
            step="1"
            value={settings.predictionFps}
            onChange={(e) => updateSetting('predictionFps', Number(e.target.value))}
            className="w-full h-2 bg-dark-900 rounded-lg appearance-none cursor-pointer accent-brand-primary"
          />
        </div>

        {/* Temporal Smoothing Toggle */}
        <div className="flex items-center justify-between pb-6 border-b border-dark-700/80">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-sm font-bold text-white">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>Temporal Prediction Smoothing</span>
            </div>
            <p className="text-xs text-slate-400">Stabilize real-time probabilities across recent frames per Face ID</p>
          </div>
          <button
            onClick={() => updateSetting('predictionSmoothing', !settings.predictionSmoothing)}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.predictionSmoothing ? 'bg-brand-primary' : 'bg-dark-900 border border-dark-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.predictionSmoothing ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Enable History SQLite Storage */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-sm font-bold text-white">
              <Database className="w-4 h-4 text-blue-400" />
              <span>Session History Auto-Logging</span>
            </div>
            <p className="text-xs text-slate-400">Record observations into SQLite database during active recording sessions</p>
          </div>
          <button
            onClick={() => updateSetting('enableHistory', !settings.enableHistory)}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.enableHistory ? 'bg-brand-primary' : 'bg-dark-900 border border-dark-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.enableHistory ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
