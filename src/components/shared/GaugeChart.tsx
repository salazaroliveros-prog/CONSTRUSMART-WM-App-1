import React from 'react';

const GaugeChart: React.FC<{ value: number; label: string; size?: number; color?: string }> = ({ value, label, size = 80, color = '#10B981' }) => {
  const r = 30;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 70 70">
        <circle cx="35" cy="35" r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
        <circle cx="35" cy="35" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 35 35)"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }} />
        <text x="35" y="32" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#1e293b">
          {Math.round(value)}%
        </text>
        <text x="35" y="46" textAnchor="middle" fontSize="8" fill="#64748b">
          {label}
        </text>
      </svg>
    </div>
  );
};

export default GaugeChart;
