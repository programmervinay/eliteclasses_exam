import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  fullScreen = false,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-6 space-y-4">
      <div className="relative w-12 h-12">
        <div className="w-12 h-12 rounded-full border-4 border-brand-200 dark:border-brand-950 animate-pulse"></div>
        <div className="w-12 h-12 rounded-full border-4 border-transparent border-t-brand-600 dark:border-t-brand-400 animate-spin absolute top-0 left-0"></div>
      </div>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 animate-pulse">
        {message}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};
