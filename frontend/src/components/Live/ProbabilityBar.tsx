import React from 'react';

interface ProbabilityBarProps {
  probabilities: Record<string, number> | undefined;
  modelAvailable: boolean;
}

const EMOTION_CONFIG: { key: string; label: string; color: string; barBg: string }[] = [
  { key: 'Happy', label: 'Happy', color: 'text-emerald-400', barBg: 'bg-emerald-500' },
  { key: 'Neutral', label: 'Neutral', color: 'text-slate-300', barBg: 'bg-slate-400' },
  { key: 'Surprise', label: 'Surprise', color: 'text-amber-400', barBg: 'bg-amber-500' },
  { key: 'Sad', label: 'Sad', color: 'text-blue-400', barBg: 'bg-blue-500' },
  { key: 'Fear', label: 'Fear', color: 'text-purple-400', barBg: 'bg-purple-500' },
  { key: 'Angry', label: 'Angry', color: 'text-red-400', barBg: 'bg-red-500' },
  { key: 'Disgust', label: 'Disgust', color: 'text-pink-400', barBg: 'bg-pink-500' },
];

export const ProbabilityBar: React.FC<ProbabilityBarProps> = ({ probabilities, modelAvailable }) => {
  return (
    <div className="p-5 rounded-2xl bg-dark-800 border border-dark-700 shadow-xl">
      <div className="flex items-center justify-between mb-3 border-b border-dark-700 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Softmax Probability Distribution
        </h3>
        <span className="text-[10px] text-slate-500 font-mono">7-Class FER-2013</span>
      </div>

      {!modelAvailable ? (
        <div className="py-8 text-center text-xs text-slate-500">
          Probability outputs inactive until model is loaded.
        </div>
      ) : !probabilities || Object.keys(probabilities).length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          Awaiting face inference data...
        </div>
      ) : (
        <div className="space-y-2.5">
          {EMOTION_CONFIG.map((item) => {
            const prob = probabilities[item.key] || 0.0;
            const pct = Math.round(prob * 100);

            return (
              <div key={item.key} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className={`font-medium ${item.color}`}>{item.label}</span>
                  <span className="font-mono text-slate-300 font-semibold">{pct}%</span>
                </div>
                <div className="w-full h-2 bg-dark-900 rounded-full overflow-hidden border border-dark-700/50">
                  <div
                    className={`h-full ${item.barBg} transition-all duration-200 rounded-full`}
                    style={{ width: `${Math.max(0, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
