import React, { useState, useEffect } from 'react';
import { fetchHistory, fetchSessions, deleteSession, deleteAllHistory } from '../services/api';
import { EmotionRecord, Session } from '../types';
import { 
  History as HistoryIcon, 
  Trash2, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Eye
} from 'lucide-react';

const EMOTION_BADGES: Record<string, string> = {
  Happy: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Neutral: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  Surprise: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  Sad: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Fear: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  Angry: 'bg-red-500/20 text-red-300 border-red-500/30',
  Disgust: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
};

export const HistoryPage: React.FC = () => {
  const [records, setRecords] = useState<EmotionRecord[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);
  const [selectedEmotion, setSelectedEmotion] = useState<string>('');
  const [selectedSessionUuid, setSelectedSessionUuid] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRecord, setSelectedRecord] = useState<EmotionRecord | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [histData, sessData] = await Promise.all([
        fetchHistory({
          session_uuid: selectedSessionUuid || undefined,
          emotion: selectedEmotion || undefined,
          page,
          page_size: pageSize,
        }),
        fetchSessions(),
      ]);
      setRecords(histData.records);
      setTotalRecords(histData.total_records);
      setSessions(sessData);
    } catch (err) {
      console.error('[HistoryPage] Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, selectedEmotion, selectedSessionUuid]);

  const handleDeleteSession = async (uuid: string) => {
    if (!window.confirm(`Delete session ${uuid} and all its emotion records?`)) return;
    try {
      await deleteSession(uuid);
      if (selectedSessionUuid === uuid) setSelectedSessionUuid('');
      await loadData();
    } catch (err) {
      console.error('Delete session error:', err);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('WARNING: Are you sure you want to permanently delete all history records?')) return;
    try {
      await deleteAllHistory();
      setPage(1);
      await loadData();
    } catch (err) {
      console.error('Delete all error:', err);
    }
  };

  const totalPages = Math.ceil(totalRecords / pageSize) || 1;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Controls */}
      <div className="p-6 rounded-3xl bg-dark-800 border border-dark-700 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-brand-primary text-xs font-bold uppercase tracking-wider mb-1">
            <HistoryIcon className="w-4 h-4" />
            <span>SQLite Database Records</span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Observation Session History
          </h2>
          <p className="text-xs text-slate-400">
            Total records: <strong className="text-white font-mono">{totalRecords}</strong>
          </p>
        </div>

        <button
          onClick={handleDeleteAll}
          disabled={totalRecords === 0}
          className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 disabled:opacity-40 text-red-400 border border-red-500/30 text-xs font-bold flex items-center space-x-2 transition-all"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete All History</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-dark-800 border border-dark-700 shadow-lg flex flex-wrap items-center gap-3">
        {/* Session Filter */}
        <div className="flex items-center space-x-2 bg-dark-900 px-3 py-2 rounded-xl border border-dark-700 text-xs">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedSessionUuid}
            onChange={(e) => {
              setSelectedSessionUuid(e.target.value);
              setPage(1);
            }}
            className="bg-transparent text-slate-200 focus:outline-none"
          >
            <option value="">All Recorded Sessions</option>
            {sessions.map((s) => (
              <option key={s.session_uuid} value={s.session_uuid}>
                Session {s.session_uuid.slice(0, 8)} ({s.total_observations} obs)
              </option>
            ))}
          </select>
        </div>

        {/* Emotion Filter */}
        <div className="flex items-center space-x-2 bg-dark-900 px-3 py-2 rounded-xl border border-dark-700 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedEmotion}
            onChange={(e) => {
              setSelectedEmotion(e.target.value);
              setPage(1);
            }}
            className="bg-transparent text-slate-200 focus:outline-none"
          >
            <option value="">All Emotions</option>
            <option value="Happy">Happy</option>
            <option value="Neutral">Neutral</option>
            <option value="Surprise">Surprise</option>
            <option value="Sad">Sad</option>
            <option value="Fear">Fear</option>
            <option value="Angry">Angry</option>
            <option value="Disgust">Disgust</option>
          </select>
        </div>

        {selectedSessionUuid && (
          <button
            onClick={() => handleDeleteSession(selectedSessionUuid)}
            className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center space-x-1.5 ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Filtered Session</span>
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-dark-800 border border-dark-700 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-dark-900/80 border-b border-dark-700 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">ID</th>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Face ID</th>
                <th className="px-5 py-3.5">Predicted Emotion</th>
                <th className="px-5 py-3.5">Confidence</th>
                <th className="px-5 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    Loading records from SQLite...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    No records found matching current criteria.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const badgeClass = EMOTION_BADGES[r.emotion] || 'bg-dark-900 text-slate-400 border-dark-700';
                  return (
                    <tr key={r.id} className="hover:bg-dark-700/30 transition-colors">
                      <td className="px-5 py-3 font-mono text-slate-500">#{r.id}</td>
                      <td className="px-5 py-3 font-mono text-slate-300">
                        {new Date(r.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-5 py-3 font-semibold text-white">{r.face_identifier}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${badgeClass}`}>
                          {r.emotion}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono font-bold text-slate-200">
                        {Math.round(r.confidence * 100)}%
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => setSelectedRecord(r)}
                          className="px-2.5 py-1 rounded-lg bg-dark-900 hover:bg-dark-700 text-slate-300 border border-dark-700 text-[11px] font-medium inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3 h-3 text-brand-primary" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-dark-700 bg-dark-900/50 flex items-center justify-between text-xs text-slate-400">
          <span>
            Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong>
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-xl bg-dark-800 border border-dark-700 text-slate-300 disabled:opacity-40 hover:bg-dark-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-xl bg-dark-800 border border-dark-700 text-slate-300 disabled:opacity-40 hover:bg-dark-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-dark-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-dark-700 pb-3">
              <h3 className="text-base font-bold text-white">Record Details #{selectedRecord.id}</h3>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-dark-900 border border-dark-700">
                <span className="text-slate-400">Timestamp</span>
                <p className="font-mono text-white mt-1">{new Date(selectedRecord.timestamp).toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-dark-900 border border-dark-700">
                <span className="text-slate-400">Subject</span>
                <p className="font-bold text-white mt-1">{selectedRecord.face_identifier}</p>
              </div>
              <div className="p-3 rounded-xl bg-dark-900 border border-dark-700">
                <span className="text-slate-400">Primary Emotion</span>
                <p className="font-bold text-emerald-400 mt-1">{selectedRecord.emotion}</p>
              </div>
              <div className="p-3 rounded-xl bg-dark-900 border border-dark-700">
                <span className="text-slate-400">Confidence</span>
                <p className="font-mono font-bold text-white mt-1">{Math.round(selectedRecord.confidence * 100)}%</p>
              </div>
            </div>

            {/* Probabilities Breakdown */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase mb-2">Softmax Probabilities</h4>
              <div className="space-y-1.5">
                {Object.entries(selectedRecord.probabilities || {}).map(([emo, val]) => (
                  <div key={emo} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-dark-900">
                    <span className="text-slate-400">{emo}</span>
                    <span className="font-mono text-white font-semibold">{Math.round(val * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedRecord(null)}
              className="w-full py-2.5 rounded-xl bg-dark-700 hover:bg-dark-600 text-white font-bold text-xs"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
