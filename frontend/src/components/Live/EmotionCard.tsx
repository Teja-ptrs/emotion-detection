import React from 'react';
import { Smile, Frown, Flame, Zap, Eye, Meh, HelpCircle, HeartPulse } from 'lucide-react';
import { FaceDetectionResult } from '../../types';

interface EmotionCardProps {
  primaryFace: FaceDetectionResult | null;
  modelAvailable: boolean;
}

const EMOTION_ICONS: Record<string, any> = {
  Happy: Smile,
  Sad: Frown,
  Angry: Flame,
  Fear: Eye,
  Surprise: Zap,
  Neutral: Meh,
  Disgust: HeartPulse,
};

const EMOTION_STYLES: Record<string, { bg: string; text: string; border: string; desc: string }> = {
  Happy: { bg: 'from-emerald-500/20 to-teal-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', desc: 'Positive facial valence detected' },
  Sad: { bg: 'from-blue-500/20 to-cyan-500/10', text: 'text-blue-400', border: 'border-blue-500/30', desc: 'Lowered brow and mouth corners' },
  Angry: { bg: 'from-red-500/20 to-orange-500/10', text: 'text-red-400', border: 'border-red-500/30', desc: 'Lowered brow and tightened lips' },
  Fear: { bg: 'from-purple-500/20 to-indigo-500/10', text: 'text-purple-400', border: 'border-purple-500/30', desc: 'Raised eyelids and dilated tension' },
  Surprise: { bg: 'from-amber-500/20 to-yellow-500/10', text: 'text-amber-400', border: 'border-amber-500/30', desc: 'Raised eyebrows and open mouth' },
  Neutral: { bg: 'from-slate-500/20 to-gray-500/10', text: 'text-slate-300', border: 'border-slate-500/30', desc: 'Resting baseline facial configuration' },
  Disgust: { bg: 'from-pink-500/20 to-rose-500/10', text: 'text-pink-400', border: 'border-pink-500/30', desc: 'Nose wrinkling and raised upper lip' },
};

export const EmotionCard: React.FC<EmotionCardProps> = ({ primaryFace, modelAvailable }) => {
  if (!primaryFace) {
    return (
      <div className="p-6 rounded-2xl bg-dark-800 border border-dark-700 flex flex-col items-center justify-center text-center h-48">
        <HelpCircle className="w-10 h-10 text-slate-500 mb-2" />
        <h3 className="text-sm font-semibold text-slate-300">Awaiting Face Detection</h3>
        <p className="text-xs text-slate-500 mt-1">Position your face in front of the camera</p>
      </div>
    );
  }

  if (!modelAvailable || primaryFace.emotion === 'MODEL_UNAVAILABLE') {
    return (
      <div className="p-6 rounded-2xl bg-dark-800 border border-amber-500/30 flex flex-col items-center justify-center text-center h-48 bg-gradient-to-br from-amber-500/10 to-transparent">
        <HelpCircle className="w-10 h-10 text-amber-400 mb-2" />
        <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider">Model Offline</h3>
        <p className="text-xs text-amber-400/80 mt-1">Tracking {primaryFace.face_identifier} without CNN classification</p>
      </div>
    );
  }

  const emotion = primaryFace.emotion;
  const confidencePct = Math.round(primaryFace.confidence * 100);
  const style = EMOTION_STYLES[emotion] || EMOTION_STYLES['Neutral'];
  const Icon = EMOTION_ICONS[emotion] || Meh;

  return (
    <div className={`p-6 rounded-2xl bg-dark-800 border ${style.border} bg-gradient-to-br ${style.bg} relative overflow-hidden shadow-xl`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-dark-900/60 border border-dark-700 text-slate-300">
            {primaryFace.face_identifier}
          </span>
          <span className="text-xs text-slate-400 font-medium">Primary Subject</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-xs text-slate-400 font-mono">Live</span>
        </div>
      </div>

      <div className="flex items-center space-x-4 mb-4">
        <div className={`w-16 h-16 rounded-2xl bg-dark-900/80 border ${style.border} flex items-center justify-center shadow-lg`}>
          <Icon className={`w-9 h-9 ${style.text}`} />
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Predicted Expression</span>
          <h2 className={`text-2xl font-extrabold tracking-tight ${style.text}`}>
            {emotion}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{style.desc}</p>
        </div>
      </div>

      {/* Confidence Bar */}
      <div>
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="text-slate-400 font-medium">CNN Confidence</span>
          <span className="font-mono font-bold text-white text-sm">{confidencePct}%</span>
        </div>
        <div className="w-full h-2.5 bg-dark-900/80 rounded-full overflow-hidden p-0.5 border border-dark-700/80">
          <div
            className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-brand-primary to-brand-accent"
            style={{ width: `${Math.max(5, confidencePct)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
