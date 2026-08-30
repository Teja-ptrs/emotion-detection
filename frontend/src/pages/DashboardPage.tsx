import React, { useState, useEffect } from 'react';
import { fetchAnalyticsOverview, fetchTrends } from '../services/api';
import { AnalyticsOverview, EmotionTrendPoint, ActiveTab } from '../types';
import { EmotionPieChart } from '../components/Charts/EmotionPieChart';
import { EmotionTrendChart } from '../components/Charts/EmotionTrendChart';
import { 
  BarChart2, 
  Video, 
  Users, 
  Clock, 
  Sparkles, 
  Layers, 
  ShieldAlert
} from 'lucide-react';

interface DashboardPageProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ setActiveTab }) => {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [trends, setTrends] = useState<EmotionTrendPoint[]>([]);
  const [trendWindow, setTrendWindow] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [ov, tr] = await Promise.all([
          fetchAnalyticsOverview(),
          fetchTrends({ time_window: trendWindow }),
        ]);
        setAnalytics(ov);
        setTrends(tr.points);
      } catch (err) {
        console.error('[DashboardPage] Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [trendWindow]);

  if (loading && !analytics) {
    return (
      <div className="py-20 text-center text-slate-400 text-sm">
        Loading system dashboard and SQLite analytics...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-dark-800 via-brand-primary/15 to-dark-800 border border-dark-700 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
            System Overview & Metrics
          </span>
          <h2 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
            AI Facial Emotion Analysis Dashboard
          </h2>
          <p className="text-xs text-slate-400 max-w-xl mt-1">
            Real-time multi-face classification, 468 landmark tracking, and statistical expression aggregations powered by FER-2013 deep learning.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('live')}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-brand-primary/25 flex items-center space-x-2 transition-all transform hover:scale-[1.02]"
        >
          <Video className="w-4 h-4" />
          <span>Launch Live Camera</span>
        </button>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-dark-800 border border-dark-700 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Sessions</span>
            <Layers className="w-4 h-4 text-brand-primary" />
          </div>
          <h3 className="text-xl font-extrabold text-white font-mono">
            {analytics?.total_sessions || 0}
          </h3>
        </div>

        <div className="p-4 rounded-2xl bg-dark-800 border border-dark-700 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Observations</span>
            <BarChart2 className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-xl font-extrabold text-white font-mono">
            {analytics?.total_observations || 0}
          </h3>
        </div>

        <div className="p-4 rounded-2xl bg-dark-800 border border-dark-700 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Faces Tracked</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <h3 className="text-xl font-extrabold text-white font-mono">
            {analytics?.total_faces_detected || 0}
          </h3>
        </div>

        <div className="p-4 rounded-2xl bg-dark-800 border border-dark-700 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Avg Confidence</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <h3 className="text-xl font-extrabold text-white font-mono">
            {analytics ? `${Math.round(analytics.average_confidence * 100)}%` : '0%'}
          </h3>
        </div>

        <div className="p-4 rounded-2xl bg-dark-800 border border-dark-700 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Avg Session</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <h3 className="text-xl font-extrabold text-white font-mono">
            {analytics ? `${Math.round(analytics.average_session_duration_seconds)}s` : '0s'}
          </h3>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <EmotionTrendChart
            data={trends}
            title="Database Emotion Trends"
            selectedWindow={trendWindow}
            onSelectWindow={setTrendWindow}
            showFilters={true}
          />
        </div>

        <div className="lg:col-span-5">
          <EmotionPieChart
            distribution={analytics?.distribution || []}
            title="Cumulative Emotion Breakdown"
          />
        </div>
      </div>

      {/* Scientific Disclaimer Footer Banner */}
      <div className="p-4 rounded-2xl bg-dark-800/80 border border-dark-700 flex items-start space-x-3 text-xs text-slate-400">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-300">Scientific & Medical Disclaimer: </strong>
          {analytics?.disclaimer || "This system estimates visible facial expressions from image data. Facial-expression recognition does not reliably determine a person's internal emotional or mental state."}
        </p>
      </div>
    </div>
  );
};
