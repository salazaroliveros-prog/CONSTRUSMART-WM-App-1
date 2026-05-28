import React, { useMemo, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { GanttService, type RenglonCPM } from '@/services/seguimiento/GanttService';
import type { Renglon } from '@/data/renglones';

const faseColor: Record<string, string> = {
  planeación: 'bg-purple-400',
  ejecución: 'bg-blue-500',
  pausa: 'bg-amber-400',
  finalizado: 'bg-emerald-500',
};

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface ActividadGantt {
  nombre: string;
  inicioSemana: number;
  duracionSemanas: number;
  esCritica: boolean;
  holgura: number;
}

interface ProyectoGantt {
  id: string;
  proyecto: string;
  fase: string;
  avanceFisico: number;
  inicioSemana: number;
  duracionSemanas: number;
  actividades: ActividadGantt[];
}

interface GanttViewProps {
  proyectoId?: string;
}

const GanttView: React.FC<GanttViewProps> = ({ proyectoId }) => {
  const { presupuestos } = useAppContext();
  const [semanaOffset, setSemanaOffset] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const hoy = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + semanaOffset * 7);
    return d;
  }, [semanaOffset]);

  const semanaRef = useMemo(() => {
    const inicio = new Date(hoy);
    inicio.setDate(inicio.getDate() - inicio.getDay());
    return inicio.getTime();
  }, [hoy]);

  const totalSemanas = 12;

  const semanas = useMemo(() => {
    const inicio = new Date(hoy);
    inicio.setDate(inicio.getDate() - inicio.getDay());
    return Array.from({ length: totalSemanas }, (_, i) => {
      const d = new Date(inicio);
      d.setDate(d.getDate() + i * 7);
      return d;
    });
  }, [hoy]);

  const proyectos = useMemo((): ProyectoGantt[] => {
    const diffSemanas = (fecha: Date) =>
      Math.round((fecha.getTime() - semanaRef) / (7 * 86400000));
    const filtrados = proyectoId
      ? presupuestos.filter(p => p.id === proyectoId)
      : presupuestos.filter(p => p.fase === 'ejecución' || p.fase === 'planeación');

    return filtrados.slice(0, 6).map(p => {
      const lineasArr = (p.lineas || []) as (Renglon & { cantidad: number })[];
      const nodos: RenglonCPM[] = lineasArr.length > 0
        ? GanttService.calcularRutaCritica(lineasArr)
        : [];

      const inicio = p.fechaInicio ? new Date(p.fechaInicio) : null;
      const fin = p.fechaFin ? new Date(p.fechaFin) : null;

      let inicioSemana: number;
      let duracionSemanas: number;

      if (inicio && fin && fin > inicio) {
        inicioSemana = diffSemanas(inicio);
        duracionSemanas = Math.max(1, Math.round((fin.getTime() - inicio.getTime()) / (7 * 86400000)));
      } else if (nodos.length > 0) {
        duracionSemanas = GanttService.diasASemanas(nodos[nodos.length - 1]?.EF ?? 1);
        inicioSemana = inicio ? diffSemanas(inicio) : (presupuestos.indexOf(p) % 3);
      } else {
        duracionSemanas = 2;
        inicioSemana = 0;
      }

      const actividades: ActividadGantt[] = nodos.map(n => ({
        nombre: n.descripcion,
        inicioSemana: inicioSemana + GanttService.diasASemanas(n.ES),
        duracionSemanas: GanttService.diasASemanas(n.duracionDias),
        esCritica: n.esRutaCritica,
        holgura: n.holgura,
      }));

      return {
        id: p.id,
        proyecto: p.proyecto,
        fase: p.fase,
        avanceFisico: p.avanceFisico ?? 0,
        inicioSemana,
        duracionSemanas,
        actividades,
      };
    });
  }, [presupuestos, proyectoId, semanaRef]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="bg-card dark:bg-card rounded-xl shadow-sm border border-border p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-card-foreground">Línea de Tiempo Gantt</h3>
        <div className="flex gap-1">
          <button onClick={() => setSemanaOffset(s => s - 4)} className="text-[10px] px-2 py-0.5 bg-muted hover:bg-accent rounded">‹ Anterior</button>
          <button onClick={() => setSemanaOffset(0)} className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary hover:bg-primary/20 rounded">Hoy</button>
          <button onClick={() => setSemanaOffset(s => s + 4)} className="text-[10px] px-2 py-0.5 bg-muted hover:bg-accent rounded">Siguiente ›</button>
        </div>
      </div>

      <div className="flex border-b border-border pb-1 mb-1" style={{ marginLeft: '140px' }}>
        {semanas.map((s, i) => (
          <div key={i} className="flex-1 text-[8px] text-muted-foreground text-center" style={{ minWidth: 0 }}>
            <div>{s.getDate()}</div>
            <div>{MESES[s.getMonth()]}</div>
          </div>
        ))}
      </div>

      <div className="space-y-1 max-h-72 overflow-y-auto">
        {proyectos.map(p => {
          const leftPct = `${(p.inicioSemana / totalSemanas) * 100}%`;
          const widthPct = `${(p.duracionSemanas / totalSemanas) * 100}%`;

          return (
            <div key={p.id}>
              <div className="flex items-center gap-2">
                <div className="text-[10px] font-medium text-card-foreground truncate shrink-0 flex items-center gap-1" style={{ width: '130px' }}>
                  {p.actividades.length > 0 && (
                    <button onClick={() => toggleExpand(p.id)} className="text-muted-foreground hover:text-card-foreground p-0.5">
                      {expanded.has(p.id) ? '▾' : '▸'}
                    </button>
                  )}
                  <span className="truncate">{p.proyecto}</span>
                </div>
                <div className="flex-1 relative h-5 bg-muted rounded">
                  <div
                    className={`absolute h-full rounded ${faseColor[p.fase] || 'bg-muted-foreground'} opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
                    style={{ left: leftPct, width: widthPct, minWidth: '4px' }}
                    title={`${p.proyecto} · ${p.fase} · Avance: ${p.avanceFisico}%`}
                  >
                    <div className="text-[7px] text-white font-bold px-1 leading-5 truncate">{p.avanceFisico}%</div>
                  </div>
                </div>
              </div>

              {expanded.has(p.id) && p.actividades.map((act, i) => {
                const aLeft = `${(act.inicioSemana / totalSemanas) * 100}%`;
                const aWidth = `${(act.duracionSemanas / totalSemanas) * 100}%`;
                const barColor = act.esCritica
                  ? 'bg-red-500'
                  : act.holgura <= 2
                    ? 'bg-amber-400'
                    : 'bg-blue-400';
                return (
                  <div key={i} className="flex items-center gap-2 pl-4">
                    <div className="text-[8px] text-muted-foreground truncate shrink-0 italic flex items-center gap-1" style={{ width: '126px' }}>
                      {act.esCritica && <span className="text-red-500 font-bold" title="Ruta crítica">⚠</span>}
                      <span className="truncate">{act.nombre}</span>
                    </div>
                    <div className="flex-1 relative h-3 bg-muted/50 rounded">
                      <div
                        className={`absolute h-full rounded ${barColor} ${act.esCritica ? 'opacity-90' : 'opacity-70'}`}
                        style={{ left: aLeft, width: aWidth, minWidth: '3px' }}
                        title={`${act.nombre} · ${act.duracionSemanas.toFixed(1)} sem · Holgura: ${act.holgura.toFixed(1)} días${act.esCritica ? ' · RUTA CRÍTICA' : ''}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
        {proyectos.length === 0 && (
          <div className="text-center text-[10px] text-muted-foreground py-6">Sin proyectos activos</div>
        )}
      </div>
    </div>
  );
};

export default GanttView;