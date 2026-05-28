import React from 'react';
import { CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

type Health = 'buena' | 'riesgo' | 'critica';

const iconMap = { buena: CheckCircle, riesgo: AlertTriangle, critica: AlertCircle };

const config: Record<Health, { label: string; color: string; bg: string }> = {
  buena: { label: 'Saludable', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  riesgo: { label: 'En Riesgo', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  critica: { label: 'Crítica', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-900/30' },
};

const HealthIndicator: React.FC<{ rentabilidad: number; proyectosActivos: number; deuda: number }> = ({ rentabilidad, proyectosActivos, deuda }) => {
  const health: Health = rentabilidad < 0 || deuda > 100000 ? 'critica' : rentabilidad < 10 || proyectosActivos === 0 ? 'riesgo' : 'buena';
  const c = config[health];
  const Icon = iconMap[health];
  return (
    <div className={`${c.bg} ${c.color} rounded-xl p-3 flex items-center gap-3`}>
      <Icon className="w-6 h-6 shrink-0" />
      <div>
        <div className="text-xs font-bold uppercase tracking-wider">{c.label}</div>
        <div className="text-[10px] opacity-80">Rent: {rentabilidad.toFixed(1)}% · Activos: {proyectosActivos}</div>
      </div>
    </div>
  );
};

export default HealthIndicator;
