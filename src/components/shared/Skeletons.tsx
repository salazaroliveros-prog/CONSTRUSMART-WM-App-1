import React from 'react';

export const SkeletonCard: React.FC = () => (
  <div className="animate-pulse bg-slate-200 rounded-xl h-20 p-3">
    <div className="w-1/3 h-2.5 bg-slate-300 rounded mb-2" />
    <div className="w-1/2 h-4 bg-slate-300 rounded" />
  </div>
);

export const SkeletonRow: React.FC = () => (
  <div className="animate-pulse flex items-center gap-3 p-3 border-b border-slate-100">
    <div className="w-8 h-8 bg-slate-200 rounded-full" />
    <div className="flex-1 space-y-2">
      <div className="w-1/3 h-3 bg-slate-200 rounded" />
      <div className="w-1/2 h-2.5 bg-slate-200 rounded" />
    </div>
    <div className="w-16 h-3 bg-slate-200 rounded" />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="divide-y divide-slate-100">
    {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} />)}
  </div>
);

export const SkeletonKPIGrid: React.FC = () => (
  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
    {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
  </div>
);

export const SkeletonChart: React.FC = () => (
  <div className="animate-pulse bg-slate-200 rounded-xl h-32 p-4">
    <div className="w-1/4 h-3 bg-slate-300 rounded mb-3" />
    <div className="flex items-end gap-2 h-20">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex-1 bg-slate-300 rounded-t" style={{ height: `${30 + Math.random() * 70}%` }} />
      ))}
    </div>
  </div>
);
