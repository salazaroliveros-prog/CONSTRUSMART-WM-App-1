import React, { useMemo, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';

const faseGanttColor: Record<string, string> = {
  'planeación': 'bg-purple-400',
  'ejecución': 'bg-blue-500',
  'pausa': 'bg-amber-400',
  'finalizado': 'bg-emerald-500',
};

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const GanttView: React.FC = () => {
  const { presupuestos } = useAppContext();
  const [semanaOffset, setSemanaOffset] = useState(0);

  const semanas = useMemo(() => {
    const ahora = new Date();
    ahora.setDate(ahora.getDate() + semanaOffset * 7);
    const inicio = new Date(ahora);
    inicio.setDate(inicio.getDate() - inicio.getDay());
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(inicio);
      d.setDate(d.getDate() + i * 7);
      return d;
    });
  }, [semanaOffset]);

  const items = useMemo(() => {
    return presupuestos.filter(p => p.fase === 'ejecución' || p.fase === 'planeación').slice(0, 8);
  }, [presupuestos]);

  const duracionSemanas = (p: typeof presupuestos[0]) => {
    const totalSemanas = p.total > 0 ? Math.max(4, Math.round(p.total / 5000)) : 8;
    return Math.min(totalSemanas, 24);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-slate-700">Línea de Tiempo Gantt</h3>
        <div className="flex gap-1">
          <button onClick={() => setSemanaOffset(s => s - 4)} className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded btn-press-sm">‹ Anterior</button>
          <button onClick={() => setSemanaOffset(0)} className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded btn-press-sm">Hoy</button>
          <button onClick={() => setSemanaOffset(s => s + 4)} className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded btn-press-sm">Siguiente ›</button>
        </div>
      </div>

      {/* Header de semanas */}
      <div className="flex border-b border-slate-200 pb-1 mb-1" style={{ marginLeft: '140px' }}>
        {semanas.map((s, i) => (
          <div key={i} className="flex-1 text-[8px] text-slate-400 text-center" style={{ minWidth: 0 }}>
            <div>{s.getDate()}</div>
            <div>{MESES[s.getMonth()]}</div>
          </div>
        ))}
      </div>

      {/* Barras Gantt */}
      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {items.map(p => {
          const startWeek = Math.floor(Math.random() * 3);
          const duracion = duracionSemanas(p);
          const left = `${(startWeek / 12) * 100}%`;
          const width = `${(duracion / 12) * 100}%`;

          return (
            <div key={p.id} className="flex items-center gap-2">
              <div className="text-[10px] font-medium text-slate-700 truncate shrink-0" style={{ width: '130px' }}>
                {p.proyecto}
              </div>
              <div className="flex-1 relative h-4 bg-slate-100 rounded">
                <div
                  className={`absolute h-full rounded ${faseGanttColor[p.fase] || 'bg-slate-400'} opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
                  style={{ left, width, minWidth: '4px' }}
                  title={`${p.proyecto} · ${p.fase} · Avance: ${p.avanceFisico}%`}
                >
                  <div className="text-[7px] text-white font-bold px-1 leading-4 truncate">
                    {p.avanceFisico}%
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="text-center text-[10px] text-slate-400 py-6">Sin proyectos activos</div>
        )}
      </div>
    </div>
  );
};

export default GanttView;
