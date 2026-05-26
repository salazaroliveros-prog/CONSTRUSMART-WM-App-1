import React, { useMemo, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { PlanillaService } from '@/services/seguimiento/PlanillaService';
import { GanttService } from '@/services/seguimiento/GanttService';
import PageShell from '@/components/shared/PageShell';
import { fmtQ, downloadCSV, printPDF } from '@/lib/exporters';
import { Download, FileText, Play, Users, Clock, Filter } from 'lucide-react';
import type { Presupuesto } from '@/types/supabase';

const SeguimientoScreen: React.FC = () => {
  const { presupuestos, transacciones, transicionFase } = useAppContext();
  const [selectedProyecto, setSelectedProyecto] = useState<string | null>(null);

  const rutaCritica = useMemo(() => {
    if (!selectedProyecto) return [];
    const p = presupuestos.find(pr => pr.id === selectedProyecto);
    return p ? GanttService.calcularRutaCritica(p.lineas, 30) : [];
  }, [selectedProyecto, presupuestos]);

  const gastosPersonal = useMemo(() => {
    if (!selectedProyecto) return 0;
    return transacciones.filter(t => t.proyectoId === selectedProyecto && t.categoria === 'mano-obra')
                        .reduce((acc, t) => acc + t.costoTotal, 0);
  }, [selectedProyecto, transacciones]);

  const ejecucion = presupuestos.filter(p => p.fase === 'ejecución');
  const planeacion = presupuestos.filter(p => p.fase === 'planeación');
  const pausa = presupuestos.filter(p => p.fase === 'pausa');
  const finalizados = presupuestos.filter(p => p.fase === 'finalizado');

  const flujoMensual = useMemo(() => {
    const data: Record<string, { mes: string; ingresos: number; gastos: number }> = {};
    transacciones.forEach(t => {
      const mes = t.fecha.slice(0, 7);
      if (!data[mes]) data[mes] = { mes, ingresos: 0, gastos: 0 };
      if (t.tipo === 'ingreso') data[mes].ingresos += t.costoTotal;
      else data[mes].gastos += t.costoTotal;
    });
    return Object.values(data).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [transacciones]);

  const avanceData = ejecucion.map(p => ({
    name: p.proyecto.split(' ').slice(0, 3).join(' '),
    Físico: p.avanceFisico,
    Financiero: p.avanceFinanciero,
  }));

  const handleExportCSV = () => {
    const rows: (string | number)[] = [
      'Seguimiento de Proyectos - CONSTRUCTORA WM/M&S',
      `Fecha: ${new Date().toLocaleDateString('es-GT')}`,
      '',
      'Proyecto,Cliente,Tipo,Fase,Presupuesto,Avance Físico %,Avance Financiero %,Ingresos,Gastos,Pendiente',
      ...presupuestos.map(p => [p.proyecto, p.cliente, p.tipologia, p.fase, p.total, p.avanceFisico, p.avanceFinanciero, p.ingresos, p.gastos, p.pendienteAportar].join(',')),
    ];
    downloadCSV(`seguimiento_proyectos_${new Date().toISOString().split('T')[0]}.csv`, rows.map(r => Array.isArray(r) ? r : [r]));
  };

  const handleExportPDF = () => {
    const body = `
      <h2>Proyectos en Ejecución</h2>
      <table>
        <thead><tr><th>Proyecto</th><th>Cliente</th><th class="num">Presupuesto</th><th class="num">A. Físico</th><th class="num">A. Financ.</th><th class="num">Ingresos</th><th class="num">Gastos</th></tr></thead>
        <tbody>${ejecucion.map(p => `<tr><td>${p.proyecto}</td><td>${p.cliente}</td><td class="num">${fmtQ(p.total)}</td><td class="num">${p.avanceFisico}%</td><td class="num">${p.avanceFinanciero}%</td><td class="num">${fmtQ(p.ingresos)}</td><td class="num">${fmtQ(p.gastos)}</td></tr>`).join('')}</tbody>
      </table>
      <h2>Proyectos en Planeación</h2>
      <table>
        <thead><tr><th>Proyecto</th><th>Cliente</th><th>Tipo</th><th class="num">Presupuesto</th></tr></thead>
        <tbody>${planeacion.map(p => `<tr><td>${p.proyecto}</td><td>${p.cliente}</td><td>${p.tipologia}</td><td class="num">${fmtQ(p.total)}</td></tr>`).join('')}</tbody>
      </table>
    `;
    printPDF('Informe de Seguimiento de Proyectos', body);
  };

  return (
    <PageShell showHome={false} title="Seguimiento de Proyectos">
      <div className="p-3 sm:p-5 max-w-[1600px] mx-auto space-y-4">
        {/* Selector de Proyecto */}
        <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center gap-4">
          <Filter className="w-4 h-4 text-slate-500" />
          <select onChange={(e) => setSelectedProyecto(e.target.value)} className="flex-1 p-2 border rounded-lg text-sm" value={selectedProyecto || ''}>
            <option value="">Seleccione un proyecto...</option>
            {presupuestos.map(p => <option key={p.id} value={p.id}>{p.proyecto}</option>)}
          </select>
        </div>

        {selectedProyecto && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Gantt / Ruta Crítica */}
            <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-sm border">
               <h3 className="text-xs font-bold uppercase mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-600"/> Ruta Crítica</h3>
               {rutaCritica.length > 0 ? rutaCritica.map((r: any) => (
                 <div key={r.id} className="flex justify-between p-2 border-b text-[11px]">
                   <span>{r.descripcion}</span>
                   <span className={r.esRutaCritica ? 'text-red-600 font-bold' : 'text-slate-500'}>Prioridad Alta</span>
                 </div>
               )) : <div className="text-center py-4 text-slate-400 text-xs">Sin renglones en ruta crítica</div>}
            </div>

            {/* Panel de Personal */}
            <div className="bg-white p-4 rounded-xl shadow-sm border">
               <h3 className="text-xs font-bold uppercase mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-emerald-600"/> Control de Planilla</h3>
               <div className="p-3 bg-blue-50 rounded-lg">
                 <div className="text-[10px] text-blue-600 uppercase font-semibold">Inversión Personal</div>
                 <div className="text-lg font-bold text-blue-900">{fmtQ(gastosPersonal)}</div>
               </div>
            </div>
          </div>
        )}
        
        {/* ... (mantener el resto de la pantalla de proyectos original) ... */}


        <div className="flex justify-end gap-2">
          <button onClick={handleExportCSV} className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white px-3 py-2 rounded-lg text-sm font-semibold">
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-semibold">
            <FileText className="w-4 h-4" /> Exportar PDF
          </button>
        </div>

        <ProyectosTabla titulo="Proyectos en Ejecución" proyectos={ejecucion} color="emerald" onAction={(p) => {
          if (p.fase === 'ejecución') transicionFase(p.id, 'pausa');
          else if (p.fase === 'pausa') transicionFase(p.id, 'ejecución');
        }} actionLabel={(p) => p.fase === 'pausa' ? 'Reanudar' : 'Pausar'} />

        <ProyectosTabla titulo="Proyectos en Planeación" proyectos={planeacion} color="amber" onAction={(p) => transicionFase(p.id, 'ejecución')} actionLabel={() => 'Iniciar'} />

        {pausa.length > 0 && (
          <ProyectosTabla titulo="Proyectos en Pausa" proyectos={pausa} color="amber" onAction={(p) => transicionFase(p.id, 'ejecución')} actionLabel={() => 'Reanudar'} />
        )}
        {finalizados.length > 0 && (
          <ProyectosTabla titulo="Proyectos Finalizados" proyectos={finalizados} color="emerald" />
        )}
      </div>
    </PageShell>
  );
};

const ProyectosTabla: React.FC<{
  titulo: string;
  proyectos: Presupuesto[];
  color: string;
  onAction?: (p: Presupuesto) => void;
  actionLabel?: (p: Presupuesto) => string;
}> = ({ titulo, proyectos, color, onAction, actionLabel }) => {
  const colors: Record<string, string> = {
    emerald: 'from-emerald-600 to-emerald-700',
    amber: 'from-amber-600 to-amber-700',
  };
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className={`bg-gradient-to-r ${colors[color]} text-white p-3 flex items-center justify-between`}>
        <h3 className="font-bold text-sm">{titulo} ({proyectos.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-2.5 text-left">Proyecto</th>
              <th className="p-2.5 text-left hidden md:table-cell">Cliente</th>
              <th className="p-2.5 text-left">Avance Físico</th>
              <th className="p-2.5 text-right">Ingresos</th>
              <th className="p-2.5 text-right">Gastos</th>
              <th className="p-2.5 text-center">Acción</th>
            </tr>
          </thead>
          <tbody>
            {proyectos.map(p => (
              <tr key={p.id} className="border-b hover:bg-blue-50/30">
                <td className="p-2.5">
                  <div className="font-semibold text-slate-800">{p.proyecto}</div>
                  <div className="text-[10px] text-slate-500">{p.tipologia || 'General'} · {fmtQ(p.total)}</div>
                </td>
                <td className="p-2.5 hidden md:table-cell">{p.cliente}</td>
                <td className="p-2.5">
                  <Progreso valor={p.avanceFisico} color="bg-blue-600" />
                </td>
                <td className="p-2.5 text-right text-emerald-700 font-semibold">{fmtQ(p.ingresos)}</td>
                <td className="p-2.5 text-right text-red-700 font-semibold">{fmtQ(p.gastos)}</td>
                <td className="p-2.5 text-center">
                  {onAction && actionLabel ? (
                    <button onClick={() => onAction(p)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold text-white bg-blue-600 hover:bg-blue-700 transition">
                      <Play className="w-3 h-3" /> {actionLabel(p)}
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400">-</span>
                  )}
                </td>
              </tr>
            ))}
            {proyectos.length === 0 && (
              <tr><td colSpan={7} className="text-center py-6 text-slate-400">Sin proyectos en esta categoría</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Progreso: React.FC<{ valor: number; color: string }> = ({ valor, color }) => (
  <div className="flex items-center gap-2 min-w-[120px]">
    <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
      <div className={`${color} h-full transition-all`} style={{ width: `${valor}%` }} />
    </div>
    <span className="text-[10px] font-semibold w-8 text-right">{valor}%</span>
  </div>
);

export default SeguimientoScreen;
