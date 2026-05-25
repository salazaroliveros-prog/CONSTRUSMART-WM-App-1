import React, { useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';

const faseColors: Record<string, string> = {
  'planeación': 'bg-purple-500',
  'ejecución': 'bg-blue-500',
  'pausa': 'bg-amber-500',
  'finalizado': 'bg-emerald-500',
};

const ProjectTimeline: React.FC = () => {
  const { presupuestos } = useAppContext();

  const items = useMemo(() => {
    return presupuestos
      .filter(p => p.fase === 'ejecución' || p.fase === 'planeación')
      .slice(0, 6);
  }, [presupuestos]);

  return (
    <div className="relative">
      {items.length === 0 && (
        <div className="text-center text-[10px] text-slate-400 py-6">
          Sin proyectos activos en timeline
        </div>
      )}
      <div className="space-y-0">
        {items.map((p, i) => (
          <div key={p.id} className="flex items-start gap-3 relative pb-3 group">
            {/* Línea vertical */}
            {i < items.length - 1 && (
              <div className="absolute left-[7px] top-4 bottom-0 w-0.5 bg-slate-200" />
            )}
            {/* Círculo */}
            <div className={`w-4 h-4 rounded-full mt-0.5 shrink-0 ring-2 ring-white ${faseColors[p.fase] || 'bg-slate-400'}`} />
            {/* Contenido */}
            <div className="flex-1 min-w-0 -mt-0.5">
              <div className="text-[11px] font-semibold text-slate-800 truncate group-hover:text-blue-700 transition-colors">
                {p.proyecto}
              </div>
              <div className="flex items-center gap-2 text-[9px] text-slate-500">
                <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-semibold ${
                  p.fase === 'planeación' ? 'bg-purple-100 text-purple-700' :
                  p.fase === 'ejecución' ? 'bg-blue-100 text-blue-700' :
                  p.fase === 'pausa' ? 'bg-amber-100 text-amber-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {p.fase}
                </span>
                <span>Q {(p.total / 1000).toFixed(0)}K</span>
                <span>Avance: {p.avanceFisico}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectTimeline;
