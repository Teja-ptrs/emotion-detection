import React, { useState, useEffect } from 'react';
import { fetchAnalyticsOverview } from '../services/api';
import { AnalyticsOverview } from '../types';
import { EmotionPieChart } from '../components/Charts/EmotionPieChart';
import { 
  BarChart3, 
  TrendingUp, 
  Repeat, 
  Target, 
  Sparkles
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      try {
        const data = await fetchAnalyticsOverview();
        setAnalytics(data);
      } catch (err) {
        console.error('[AnalyticsPage] Error loading analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading && !analytics) {
    return (
      <div className="py-20 text-center text-slate-400 text-sm">
        Calculating statistical aggregations from SQLite records...
      </div>
    );
  }

  const distribution = analytics?.distribution || [];
  const matrix = analytics?.transitions?.matrix || {};
  const emotionClasses = analytics?.transitions?.emotions || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-dark-800 border border-dark-700 shadow-xl">
        <div className="flex items-center space-x-2 text-brand-primary text-xs font-bold uppercase tracking-wider mb-1">
          <BarChart3 className="w-4 h-4" />
          <span>Real SQLite Analytics</span>
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Statistical Expression Analytics
        </h2>
        <p className="text-xs text-slate-400 max-w-xl mt-1">
          Aggregated quantitative distributions and temporal transition matrices computed strictly from genuine CNN model predictions.
        </p>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-dark-800 border border-dark-700 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Predominant Expression</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-xl font-extrabold text-white">
            {analytics?.predominant_emotion || 'None'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {analytics?.predominant_emotion_percentage || 0}% of all records
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-dark-800 border border-dark-700 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Average Model Confidence</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <h3 className="text-xl font-extrabold text-white font-mono">
            {analytics ? `${Math.round(analytics.average_confidence * 100)}%` : '0%'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Softmax certainty metric</p>
        </div>

        <div className="p-5 rounded-2xl bg-dark-800 border border-dark-700 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Sampled Frames</span>
            <TrendingUp className="w-4 h-4 text-brand-primary" />
          </div>
          <h3 className="text-xl font-extrabold text-white font-mono">
            {analytics?.total_observations || 0}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Across {analytics?.total_sessions || 0} sessions</p>
        </div>

        <div className="p-5 rounded-2xl bg-dark-800 border border-dark-700 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Unique Tracked Faces</span>
            <Repeat className="w-4 h-4 text-cyan-400" />
          </div>
          <h3 className="text-xl font-extrabold text-white font-mono">
            {analytics?.total_faces_detected || 0}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Centroid persistent IDs</p>
        </div>
      </div>

      {/* Distribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <EmotionPieChart
            distribution={distribution}
            title="Class Frequency Distribution"
          />
        </div>

        <div className="lg:col-span-7 p-5 rounded-2xl bg-dark-800 border border-dark-700 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-1">Observation Counts by Class</h3>
          <p className="text-[11px] text-slate-400 mb-4">Granular count and percentage per category</p>
          <div className="space-y-3">
            {distribution.map((item) => (
              <div key={item.emotion} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-200">{item.emotion}</span>
                  <div className="space-x-2 font-mono">
                    <span className="text-slate-400">{item.count} samples</span>
                    <strong className="text-white">{item.percentage}%</strong>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-dark-900 rounded-full overflow-hidden border border-dark-700">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(0, item.percentage)}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Emotion Transitions Matrix */}
      <div className="p-6 rounded-3xl bg-dark-800 border border-dark-700 shadow-xl space-y-4">
        <div className="flex items-center space-x-2">
          <Repeat className="w-5 h-5 text-brand-primary" />
          <div>
            <h3 className="text-sm font-bold text-white">Expression Transition Frequency Matrix</h3>
            <p className="text-xs text-slate-400">Sequential changes from Emotion (t) to Emotion (t+1)</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              <tr className="bg-dark-900/80 text-slate-400 border-b border-dark-700">
                <th className="p-2.5 text-left font-bold">From \ To</th>
                {emotionClasses.map((emo) => (
                  <th key={emo} className="p-2.5 font-bold">{emo}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50">
              {emotionClasses.map((fromEmo) => (
                <tr key={fromEmo} className="hover:bg-dark-700/30">
                  <td className="p-2.5 text-left font-bold text-slate-300 bg-dark-900/40">{fromEmo}</td>
                  {emotionClasses.map((toEmo) => {
                    const count = matrix[fromEmo]?.[toEmo] || 0;
                    return (
                      <td
                        key={toEmo}
                        className={`p-2.5 font-mono ${
                          count > 0 ? 'text-brand-accent font-bold bg-cyan-500/5' : 'text-slate-600'
                        }`}
                      >
                        {count}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
