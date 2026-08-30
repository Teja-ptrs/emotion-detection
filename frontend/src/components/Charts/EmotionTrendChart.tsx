import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { EmotionTrendPoint } from '../../types';

interface EmotionTrendChartProps {
  data: EmotionTrendPoint[];
  title?: string;
  selectedWindow?: string;
  onSelectWindow?: (win: string) => void;
  showFilters?: boolean;
}

const LINE_COLORS: Record<string, string> = {
  Happy: '#10B981',
  Neutral: '#9CA3AF',
  Surprise: '#F59E0B',
  Sad: '#3B82F6',
  Fear: '#8B5CF6',
  Angry: '#EF4444',
  Disgust: '#EC4899',
};

export const EmotionTrendChart: React.FC<EmotionTrendChartProps> = ({
  data,
  title = 'Emotion Trend Over Time',
  selectedWindow = 'current',
  onSelectWindow,
  showFilters = false,
}) => {
  const windows = [
    { id: 'current', label: 'Live Session' },
    { id: '1m', label: 'Last 1 Min' },
    { id: '5m', label: 'Last 5 Min' },
    { id: 'today', label: 'Today' },
    { id: 'all', label: 'All Time' },
  ];

  return (
    <div className="p-5 rounded-2xl bg-dark-800 border border-dark-700 shadow-xl flex flex-col justify-between">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-dark-700 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
          <p className="text-[11px] text-slate-400">Continuous model probability stream per frame</p>
        </div>

        {showFilters && onSelectWindow && (
          <div className="flex items-center space-x-1 bg-dark-900/80 p-1 rounded-xl border border-dark-700">
            {windows.map((w) => (
              <button
                key={w.id}
                onClick={() => onSelectWindow(w.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedWindow === w.id
                    ? 'bg-brand-primary text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-full h-64">
        {data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
            Awaiting live detection stream or recorded data...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              <XAxis
                dataKey="timestamp"
                stroke="#6B7280"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#6B7280"
                fontSize={10}
                domain={[0, 1]}
                tickFormatter={(v) => `${Math.round(v * 100)}%`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  borderColor: '#374151',
                  borderRadius: '0.75rem',
                  fontSize: '11px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                }}
                formatter={(val: any, name: any) => [`${Math.round(Number(val) * 100)}%`, name]}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                iconType="circle"
              />
              {Object.keys(LINE_COLORS).map((emotionKey) => (
                <Line
                  key={emotionKey}
                  type="monotone"
                  dataKey={emotionKey}
                  stroke={LINE_COLORS[emotionKey]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
