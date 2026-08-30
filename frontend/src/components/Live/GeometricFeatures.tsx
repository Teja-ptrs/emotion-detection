import React from 'react';
import { Ruler } from 'lucide-react';
import { GeometricFeatures as GeoType } from '../../types';

interface GeometricFeaturesProps {
  features: GeoType | undefined;
}

export const GeometricFeatures: React.FC<GeometricFeaturesProps> = ({ features }) => {
  const metrics = [
    { label: 'Eye Openness (L)', value: features?.eye_openness_left, unit: 'ratio' },
    { label: 'Eye Openness (R)', value: features?.eye_openness_right, unit: 'ratio' },
    { label: 'Avg Eye Openness', value: features?.eye_openness_avg, unit: 'ratio' },
    { label: 'Mouth Openness', value: features?.mouth_openness, unit: 'norm' },
    { label: 'Mouth Width', value: features?.mouth_width, unit: 'norm' },
    { label: 'Eyebrow Raise (L)', value: features?.eyebrow_raise_left, unit: 'norm' },
    { label: 'Eyebrow Raise (R)', value: features?.eyebrow_raise_right, unit: 'norm' },
    { label: 'Avg Eyebrow Raise', value: features?.eyebrow_elevation_avg, unit: 'norm' },
    { label: 'Eye Distance', value: features?.eye_distance, unit: 'norm' },
    { label: 'Face Aspect Ratio', value: features?.face_aspect_ratio, unit: 'H/W' },
    { label: 'Jaw Position', value: features?.jaw_position, unit: 'norm' },
    { label: 'Nose to Mouth', value: features?.nose_to_mouth_distance, unit: 'norm' },
  ];

  return (
    <div className="p-5 rounded-2xl bg-dark-800 border border-dark-700 shadow-xl">
      <div className="flex items-center justify-between mb-4 border-b border-dark-700 pb-2">
        <div className="flex items-center space-x-2">
          <Ruler className="w-4 h-4 text-brand-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Facial Landmark Geometry
          </h3>
        </div>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
          MediaPipe 468
        </span>
      </div>

      {!features ? (
        <div className="py-8 text-center text-xs text-slate-500">
          Geometric feature extraction waiting for face mesh...
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {metrics.map((m, idx) => (
            <div key={idx} className="p-2.5 rounded-xl bg-dark-900/60 border border-dark-700/60 flex flex-col justify-between">
              <span className="text-[11px] text-slate-400 font-medium truncate">{m.label}</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-mono font-bold text-sm text-cyan-300">
                  {m.value !== undefined && m.value !== null ? m.value.toFixed(2) : '--'}
                </span>
                <span className="text-[10px] text-slate-500 uppercase">{m.unit}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
