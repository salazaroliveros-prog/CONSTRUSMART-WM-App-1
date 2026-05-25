import React from 'react';

type Health = 'buena' | 'riesgo' | 'critica';

const config: Record<Health, { label: string; color: string; bg: string; icon: string }> = {
  buena: { label: 'Saludable', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: '🟢' },
  riesgo: { label: 'En Riesgo', color: 'text-amber-700', bg: 'bg-amber-100', icon: '🟡' },
  critica: { label: 'Crítica', color: 'text-red-700', bg: 'bg-red-100', icon: '🔴' },
};

const HealthIndicator: React.FC<{ rentabilidad: number; proyectosActivos: number; deuda: number }> = ({ rentabilidad, proyectosActivos, deuda }) => {
  const health: Health = rentabilidad < 0 || deuda > 100000 ? 'critica' : rentabilidad < 10 || proyectosActivos === 0 ? 'riesgo' : 'buena';
  const c = config[health];
  return (
    <div className={`${c.bg} ${c.color} rounded-xl p-3 flex items-center gap-3`}>
      <span className="text-2xl">{c.icon}</span>
      <div>
        <div className="text-xs font-bold uppercase tracking-wider">{c.label}</div>
        <div className="text-[10px] opacity-80">Rent: {rentabilidad.toFixed(1)}% · Activos: {proyectosActivos}</div>
      </div>
    </div>
  );
};

export default HealthIndicator;
