import React from 'react';

interface ProgressBarProps {
  percentage: number;
  label?: string;
  subText?: string;
  color?: 'brand' | 'ai' | 'emerald';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  label,
  subText,
  color = 'ai',
}) => {
  const colorMap = {
    brand: 'bg-brand-600',
    ai: 'bg-gradient-to-r from-ai-600 to-brand-500',
    emerald: 'bg-emerald-500',
  };

  const clamped = Math.min(100, Math.max(0, percentage));

  return (
    <div className="w-full">
      {(label || subText) && (
        <div className="flex justify-between items-center text-sm font-medium mb-1.5">
          {label && <span className="text-slate-700">{label}</span>}
          {subText && <span className="text-slate-500 font-mono">{subText}</span>}
        </div>
      )}
      <div className="w-full bg-slate-200/80 rounded-full h-3 overflow-hidden p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorMap[color]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
