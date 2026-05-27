import React, { useMemo, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { calcularAPU } from '@/data/renglones';
import type { Renglon } from '@/data/renglones';

const faseGanttColor: Record<string, string> = {
  'planeación': 'bg-purple-400',
  'ejecución': 'bg-blue-500',
  'pausa': 'bg-amber-400',
  'finalizado': 'bg-emerald-500',
};

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface Actividad {
  nombre: string;
  inicioSemana: number;
  duracionSemanas: number;
  color: string;
}

interface ProyectoGantt {
  id: string;
  proyecto: string;
  fase: string;
  avanceFisico: number;
  inicioSemana: number;
  duracionSemanas: number;
  actividades: Actividad[];
}

const GanttView: React.FC = () => {
  const { presupuestos } = useAppContext();
  const [semanaOffset, setSemanaOffset] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const hoy = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + semanaOffset * 7);
    return d;
  }, [semanaOffset]);

  const semanas = useMemo(() => {
    const inicio = new Date(hoy);
    inicio.setDate(inicio.getDate() - inicio.getDay());
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(inicio);
      d.setDate(d.getDate() + i * 7);
      return d;
    });
  }, [hoy]);

  const semanaRef = useMemo(() => {
    const inicio = new Date(hoy);
    inicio.setDate(inicio.getDate() - inicio.getDay());
    return inicio.getTime();
  }, [hoy]);

  const proyectos = useMemo(() => {
    const lineasColor = [
      'bg-blue-400', 'bg-cyan-400', 'bg-teal-400', 'bg-indigo-400',
      'bg-violet-400', 'bg-rose-400', 'bg-orange-400', 'bg-lime-500',
    ];

    function diffSemanas(fecha: Date): number {
      return Math.round((fecha.getTime() - semanaRef) / (7 * 86400000));
    }

    return presupuestos
      .filter(p => p.fase === 'ejecución' || p.fase === 'planeación')
      .slice(0, 8)
      .map(p => {
        const inicio = p.fechaInicio ? new Date(p.fechaInicio) : null;
        const fin = p.fechaFin ? new Date(p.fechaFin) : null;

        let inicioSemana: number;
        let duracionSemanas: number;

        if (inicio && fin && fin > inicio) {
          inicioSemana = diffSemanas(inicio);
          duracionSemanas = Math.max(1, Math.round((fin.getTime() - inicio.getTime()) / (7 * 86400000)));
        } else {
          const lineasArr = (p.lineas || []) as (Renglon & { cantidad: number })[];
          const totalDias = lineasArr.reduce((s, l) => s + calcularAPU(l).dias, 0);
          duracionSemanas = Math.max(2, Math.ceil(totalDias / 5));
          inicioSemana = inicio ? diffSemanas(inicio) : (presupuestos.indexOf(p) % 3);
        }

        const actividades: Actividad[] = [];
        const lineasArr = (p.lineas || []) as (Renglon & { cantidad: number })[];
        let accSem = 0;
        lineasArr.slice(0, 10).forEach((l, i) => {
          const d = calcularAPU(l).dias;
          const sem = Math.max(0.5, d / 5);
          if (accSem + sem <= duracionSemanas || actividades.length < 3) {
            actividades.push({
              nombre: l.descripcion || l.codigo,
              inicioSemana: inicioSemana + accSem,
              duracionSemanas: sem,
              color: lineasColor[i % lineasColor.length],
            });
            accSem += sem;
          }
        });

        return {
          id: p.id,
          proyecto: p.proyecto,
          fase: p.fase,
          avanceFisico: p.avanceFisico ?? 0,
          inicioSemana,
          duracionSemanas,
          actividades,
        } as ProyectoGantt;
      });
  }, [presupuestos, semanaRef]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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

      <div className="flex border-b border-slate-200 pb-1 mb-1" style={{ marginLeft: '140px' }}>
        {semanas.map((s, i) => (
          <div key={i} className="flex-1 text-[8px] text-slate-400 text-center" style={{ minWidth: 0 }}>
            <div>{s.getDate()}</div>
            <div>{MESES[s.getMonth()]}</div>
          </div>
        ))}
      </div>

      <div className="space-y-1 max-h-72 overflow-y-auto">
        {proyectos.map(p => {
          const leftPct = `${(p.inicioSemana / 12) * 100}%`;
          const widthPct = `${(p.duracionSemanas / 12) * 100}%`;

          return (
            <div key={p.id}>
              <div className="flex items-center gap-2">
                <div className="text-[10px] font-medium text-slate-700 truncate shrink-0 flex items-center gap-1" style={{ width: '130px' }}>
                  {p.actividades.length > 0 && (
                    <button
                      onClick={() => toggleExpand(p.id)}
                      className="text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      {expanded.has(p.id) ? '▾' : '▸'}
                    </button>
                  )}
                  <span className="truncate">{p.proyecto}</span>
                </div>
                <div className="flex-1 relative h-5 bg-slate-100 rounded">
                  <div
                    className={`absolute h-full rounded ${faseGanttColor[p.fase] || 'bg-slate-400'} opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
                    style={{ left: leftPct, width: widthPct, minWidth: '4px' }}
                    title={`${p.proyecto} · ${p.fase} · Avance: ${p.avanceFisico}%`}
                  >
                    <div className="text-[7px] text-white font-bold px-1 leading-5 truncate">
                      {p.avanceFisico}%
                    </div>
                  </div>
                </div>
              </div>

              {expanded.has(p.id) && p.actividades.map((act, i) => {
                const aLeft = `${(act.inicioSemana / 12) * 100}%`;
                const aWidth = `${(act.duracionSemanas / 12) * 100}%`;
                return (
                  <div key={i} className="flex items-center gap-2 pl-4">
                    <div className="text-[8px] text-slate-500 truncate shrink-0 italic" style={{ width: '126px' }}>
                      {act.nombre}
                    </div>
                    <div className="flex-1 relative h-3 bg-slate-50 rounded">
                      <div
                        className={`absolute h-full rounded ${act.color} opacity-70`}
                        style={{ left: aLeft, width: aWidth, minWidth: '3px' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
        {proyectos.length === 0 && (
          <div className="text-center text-[10px] text-slate-400 py-6">Sin proyectos activos</div>
        )}
      </div>
    </div>
  );
};

export default GanttView;
