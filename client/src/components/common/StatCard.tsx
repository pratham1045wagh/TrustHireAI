import React from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description?: string;
  subtitle?: string;
  trend?: string;
  color?: 'brand' | 'ai' | 'emerald' | 'amber' | 'default';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  subtitle,
  color = 'brand',
}) => {
  const colorMap = {
    brand: 'bg-brand-50 text-brand-600 border-brand-100',
    ai: 'bg-ai-50 text-ai-600 border-ai-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    default: 'bg-slate-50 text-slate-600 border-slate-100',
  };

  const displayText = description || subtitle;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            {title}
          </p>
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </h3>
          {displayText && (
            <p className="text-xs text-slate-500 mt-1.5 font-normal">
              {displayText}
            </p>
          )}
        </div>
        <div className={`p-3.5 rounded-xl border ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
