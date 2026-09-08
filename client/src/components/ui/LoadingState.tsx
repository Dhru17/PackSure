import React from 'react';

interface LoadingStateProps {
  rows?: number;
  type?: 'table' | 'cards' | 'panel';
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  rows = 4,
  type = 'table',
  message,
  className = '',
}) => {
  if (type === 'cards') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 ${className}`}>
        {Array.from({ length: rows }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white border border-[#D8DDE3] rounded-xl p-4 space-y-3 animate-pulse shadow-xs"
          >
            <div className="h-3 w-1/3 bg-[#E2E8F0] rounded" />
            <div className="h-7 w-1/2 bg-[#E2E8F0] rounded" />
            <div className="h-2.5 w-3/4 bg-[#E2E8F0] rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'panel') {
    return (
      <div className={`bg-white border border-[#D8DDE3] rounded-xl p-6 space-y-4 animate-pulse ${className}`}>
        <div className="h-4 w-1/4 bg-[#E2E8F0] rounded" />
        <div className="h-32 bg-[#F1F5F9] rounded-lg" />
        <div className="h-4 w-1/2 bg-[#E2E8F0] rounded" />
      </div>
    );
  }

  return (
    <div className={`border border-[#D8DDE3] rounded-xl overflow-hidden bg-white ${className}`}>
      {message && (
        <div className="p-3 bg-[#F8F9FA] border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B]">
          {message}
        </div>
      )}
      <div className="divide-y divide-[#E2E8F0] animate-pulse">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="p-3.5 flex items-center justify-between gap-4">
            <div className="h-3.5 w-1/4 bg-[#E2E8F0] rounded" />
            <div className="h-3.5 w-1/3 bg-[#E2E8F0] rounded" />
            <div className="h-3.5 w-16 bg-[#E2E8F0] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};
