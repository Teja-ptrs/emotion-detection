import React, { useState, useEffect } from 'react';
import { fetchInsights, fetchSessions } from '../services/api';
import { AIInsightResponse, Session } from '../types';
import { 
  Sparkles, 
  Lightbulb, 
  Layers, 
  ShieldAlert, 
  CheckCircle2, 
  TrendingUp
} from 'lucide-react';

export const AIInsightsPage: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionUuid, setSelectedSessionUuid] = useState<string>('');
  const [insightsData, setInsightsData] = useState<AIInsightResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadSessions() {
      try {
        const sessList = await fetchSessions();
        setSessions(sessList);
      } catch (err) {
        console.error('Error fetching sessions:', err);
      }
    }
    loadSessions();
  }, []);

  useEffect(() => {
    async function loadInsights() {
      setLoading(true);
      try {
        const data = await fetchInsights(selectedSessionUuid || undefined);
        setInsightsData(data);
      } catch (err) {
        console.error('Error fetching insights:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInsights();
  }, [selectedSessionUuid]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-dark-800 border border-dark-700 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-brand-primary text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Fact-Based Statistical Insights</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            AI Session Expression Summaries
          </h2>
          <p className="text-xs text-slate-400 max-w-xl mt-1">
            Mathematically grounded observations and distribution patterns generated strictly from recorded facial predictions.
          </p>
        </div>

        {/* Session Selector */}
        <div className="flex items-center space-x-2 bg-dark-900 px-3.5 py-2.5 rounded-2xl border border-dark-700 text-xs">
          <Layers className="w-4 h-4 text-slate-400" />
          <select
            value={selectedSessionUuid}
            onChange={(e) => setSelectedSessionUuid(e.target.value)}
            className="bg-transparent text-slate-200 focus:outline-none font-medium"
          >
            <option value="">Aggregate All Sessions</option>
            {sessions.map((s) => (
              <option key={s.session_uuid} value={s.session_uuid}>
                Session {s.session_uuid.slice(0, 8)} ({s.total_observations} obs)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary Insights Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Highlights (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-3xl bg-dark-800 border border-dark-700 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Statistical Snapshot</span>
            </h3>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-dark-900 border border-dark-700/60">
                <span className="text-[11px] text-slate-400 font-medium">Predominant Expression</span>
                <h4 className="text-lg font-bold text-emerald-400 mt-0.5">
                  {insightsData?.predominant_emotion || 'N/A'}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {insightsData ? `${insightsData.predominant_percentage}% of observations` : ''}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-dark-900 border border-dark-700/60">
                <span className="text-[11px] text-slate-400 font-medium">Average Confidence</span>
                <h4 className="text-lg font-bold text-brand-primary mt-0.5 font-mono">
                  {insightsData ? `${insightsData.average_confidence}%` : '0%'}
                </h4>
                <p className="text-[11px] text-slate-500">Mean softmax certainty</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-dark-900 border border-dark-700/60">
                <span className="text-[11px] text-slate-400 font-medium">Total Recorded Samples</span>
                <h4 className="text-lg font-bold text-white mt-0.5 font-mono">
                  {insightsData?.total_observations || 0}
                </h4>
                <p className="text-[11px] text-slate-500">Frames classified</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Generated Insight Statements (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-6 rounded-3xl bg-dark-800 border border-dark-700 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-primary" />
              <span>Generated Analytical Insights</span>
            </h3>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Deriving insights from dataset records...
              </div>
            ) : !insightsData || insightsData.insights.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No observations available to synthesize insights.
              </div>
            ) : (
              <div className="space-y-3">
                {insightsData.insights.map((text, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-dark-900/60 border border-dark-700 flex items-start space-x-3.5 hover:border-brand-primary/40 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mandatory Scientific Disclaimer Banner */}
      <div className="p-5 rounded-3xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex items-start space-x-3.5 shadow-lg">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-amber-300 mb-1">Scientific & Methodological Boundary</h4>
          <p className="text-amber-300/80 leading-relaxed">
            {insightsData?.scientific_disclaimer ||
              "This system estimates visible facial expressions from image data. Facial-expression recognition does not reliably determine a person's internal emotional or mental state."}
          </p>
        </div>
      </div>
    </div>
  );
};
