import React, { useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { TrendingUp, TrendingDown } from 'lucide-react';

const ProjectHeatMap: React.FC = () => {
  const { presupuestos, transacciones } = useAppContext();

  const proyectos = useMemo(() => {
    return presupuestos.filter(p => p.fase === 'ejecución' || p.fase === 'finalizado').map(p => {
      const txns = transacciones.filter(t => t.presupuestoId === p.id);
      const ingresos = txns.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.costoTotal, 0);
      const gastos = txns.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.costoTotal, 0);
      const margen = ingresos - gastos;
      const rent = p.total > 0 ? (margen / p.total) * 100 : 0;
      return { ...p, ingresos, gastos, margen, rentabilidad: rent };
    }).sort((a, b) => b.rentabilidad - a.rentabilidad).slice(0, 8);
  }, [presupuestos, transacciones]);

  const getColor = (rent: number) => {
    if (rent >= 15) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (rent >= 5) return 'bg-green-100 text-green-800 border-green-300';
    if (rent >= 0) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {proyectos.map(p => (
        <div key={p.id} className={`rounded-lg p-2 border ${getColor(p.rentabilidad)}`}>
          <div className="text-[10px] font-semibold truncate">{p.proyecto}</div>
          <div className="flex items-center gap-1 mt-0.5">
            {p.rentabilidad >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span className="text-xs font-bold">{p.rentabilidad >= 0 ? '+' : ''}{p.rentabilidad.toFixed(1)}%</span>
          </div>
          <div className="text-[9px] opacity-70 mt-0.5">Q {(p.margen / 1000).toFixed(1)}K</div>
        </div>
      ))}
      {proyectos.length === 0 && (
        <div className="col-span-full text-center text-[10px] text-slate-400 py-4">
          Sin proyectos activos para mostrar
        </div>
      )}
    </div>
  );
};

export default ProjectHeatMap;
