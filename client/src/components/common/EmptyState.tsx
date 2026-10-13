import React from 'react';
import { FileText } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No resumes analyzed yet.',
  description = 'Upload your first PDF resume to extract structured insights and skill breakdown with Gemini AI.',
  actionText = 'Upload Resume',
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
      <div className="p-4 bg-ai-50 text-ai-600 rounded-full mb-4">
        {icon || <FileText className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-ai-600 hover:bg-ai-700 text-white font-medium text-sm shadow-sm transition-all hover:shadow"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
