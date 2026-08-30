import React from 'react';
import { Users, CheckCircle2 } from 'lucide-react';
import { FaceDetectionResult } from '../../types';

interface MultiFaceListProps {
  faces: FaceDetectionResult[];
  primaryFaceId: number | null;
  onSelectPrimary: (faceId: number) => void;
  modelAvailable: boolean;
}

const EMOTION_BADGES: Record<string, string> = {
  Happy: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Neutral: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  Surprise: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  Sad: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Fear: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  Angry: 'bg-red-500/20 text-red-300 border-red-500/30',
  Disgust: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
};

export const MultiFaceList: React.FC<MultiFaceListProps> = ({
  faces,
  primaryFaceId,
  onSelectPrimary,
  modelAvailable,
}) => {
  if (faces.length <= 1) return null;

  return (
    <div className="p-4 rounded-2xl bg-dark-800 border border-dark-700 shadow-xl">
      <div className="flex items-center justify-between mb-3 border-b border-dark-700 pb-2">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-brand-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Detected Subjects ({faces.length})
          </h3>
        </div>
        <span className="text-[11px] text-slate-400">Click to focus</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {faces.map((face) => {
          const isSelected = face.face_id === primaryFaceId;
          const badgeClass = EMOTION_BADGES[face.emotion] || 'bg-dark-900 text-slate-400 border-dark-700';

          return (
            <div
              key={face.face_id}
              onClick={() => onSelectPrimary(face.face_id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'bg-brand-primary/10 border-brand-primary shadow-md shadow-brand-primary/10'
                  : 'bg-dark-900/60 border-dark-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                  isSelected ? 'bg-brand-primary text-white' : 'bg-dark-800 text-slate-300'
                }`}>
                  #{face.face_id}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                    {face.face_identifier}
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary" />}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Box: {face.bounding_box.width}x{face.bounding_box.height}px
                  </p>
                </div>
              </div>

              {modelAvailable && (
                <div className="text-right">
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${badgeClass}`}>
                    {face.emotion}
                  </span>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                    {Math.round(face.confidence * 100)}%
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
