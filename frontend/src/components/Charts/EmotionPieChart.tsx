import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { EmotionDistributionItem } from '../../types';

interface EmotionPieChartProps {
  distribution: EmotionDistributionItem[];
  title?: string;
}

export const EmotionPieChart: React.FC<EmotionPieChartProps> = ({
  distribution,
  title = 'Emotion Distribution',
}) => {
  const activeData = distribution.filter((d) => d.count > 0);

  return (
    <div className="p-5 rounded-2xl bg-dark-800 border border-dark-700 shadow-xl flex flex-col justify-between">
      <div className="mb-4 border-b border-dark-700 pb-3">
        <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
        <p className="text-[11px] text-slate-400">Class breakdown across all database observations</p>
      </div>

      <div className="w-full h-64">
        {activeData.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
            No observations recorded yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={activeData}
                dataKey="count"
                nameKey="emotion"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
              >
                {activeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#111827" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  borderColor: '#374151',
                  borderRadius: '0.75rem',
                  fontSize: '11px',
                }}
                formatter={(val: any, name: any, item: any) => [
                  `${val} (${item.payload.percentage}%)`,
                  name,
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
