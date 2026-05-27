import React, { useMemo, useState, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { PlanillaService } from '@/services/seguimiento/PlanillaService';
import { GanttService } from '@/services/seguimiento/GanttService';
import PageShell from '@/components/shared/PageShell';
import GanttView from '@/components/shared/GanttView';
import { BitacoraAvancePanel } from '@/components/shared/BitacoraAvancePanel';
import { fmtQ, downloadCSV, printPDF } from '@/lib/exporters';
import { Download, FileText, Play, Users, Clock, Filter, TrendingUp, TrendingDown, BarChart3, PieChartIcon, Wallet, FolderKanban, Percent, ArrowLeft, ArrowRight, Eye, DollarSign, Calendar } from 'lucide-react';
import type { Presupuesto } from '@/types/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const PIE_COLORS = ['#1E3A8A', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
const KPIColorMap: Record<string, string> = {
  emerald: 'from-emerald-500/90 to-emerald-600/90',
  blue: 'from-blue-600/90 to-blue-700/90',
  indigo: 'from-indigo-500/90 to-indigo-600/90',
  amber: 'from-amber-500/90 to-amber-600/90',
  red: 'from-red-500/90 to-red-600/90',
  teal: 'from-teal-500/90 to-teal-600/90',
};

const KPI: React.FC<{ icon: React.ComponentType<{ className?: string }>; label: string; value: string; color: string }> = ({ icon: Icon, label, value, color }) => (
  <div className={`bg-gradient-to-br ${KPIColorMap[color]} text-white rounded-xl p-3 shadow-md flex flex-col justify-center`}>
    <div className="flex items-center justify-between mb-1">
      <div className="p-1.5 rounded-lg bg-white/20"><Icon className="w-3.5 h-3.5" /></div>
    </div>
    <div className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">{label}</div>
    <div className="text-sm sm:text-base font-bold leading-tight mt-0.5">{value}</div>
  </div>
);

const SeguimientoScreen: React.FC = () => {
  const { presupuestos, transacciones, transicionFase } = useAppContext();
  const [selectedProyecto, setSelectedProyecto] = useState<string | null>(null);
  const [pagina, setPagina] = useState(0);
  const totalPaginas = 3;

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

  const stats = useMemo(() => {
    const ingresos = transacciones.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.costoTotal, 0);
    const gastos = transacciones.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.costoTotal, 0);
    const totalPresupuestado = presupuestos.reduce((s, p) => s + (p.total || 0), 0);
    const avancePromedio = ejecucion.length > 0 ? ejecucion.reduce((s, p) => s + (p.avanceFisico || 0), 0) / ejecucion.length : 0;
    return { ingresos, gastos, totalPresupuestado, avancePromedio, activos: ejecucion.length + planeacion.length, balance: ingresos - gastos };
  }, [presupuestos, transacciones, ejecucion, planeacion.length]);

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

  const avanceData = useMemo(() => {
    if (ejecucion.length === 0) return [{ name: 'Sin datos', fisico: 0, financiero: 0 }];
    return ejecucion.slice(0, 10).map(p => ({
      name: p.proyecto.slice(0, 14),
      fisico: p.avanceFisico ?? 0,
      financiero: p.avanceFinanciero ?? 0,
    }));
  }, [ejecucion]);

  const gastosPorCategoria = useMemo(() => {
    const cats: Record<string, number> = {};
    transacciones.filter(t => t.tipo === 'gasto').forEach(t => {
      cats[t.categoria] = (cats[t.categoria] || 0) + t.costoTotal;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [transacciones]);

  const faseDistribucion = useMemo(() => {
    const map: Record<string, number> = {};
    presupuestos.forEach(p => { map[p.fase] = (map[p.fase] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [presupuestos]);

  const nextPage = useCallback(() => setPagina(p => (p + 1) % totalPaginas), []);
  const prevPage = useCallback(() => setPagina(p => (p - 1 + totalPaginas) % totalPaginas), []);

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
      <div className="min-h-dvh flex flex-col p-2 sm:p-3">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Página {pagina + 1} / {totalPaginas}</span>
            <button onClick={prevPage} className="p-1 rounded hover:bg-slate-100 text-slate-500"><ArrowLeft className="w-4 h-4" /></button>
            <div className="flex gap-1">
              {Array.from({ length: totalPaginas }).map((_, i) => (
                <button key={i} onClick={() => setPagina(i)} className={`w-2 h-2 rounded-full transition ${i === pagina ? 'bg-blue-700' : 'bg-slate-300'}`} />
              ))}
            </div>
            <button onClick={nextPage} className="p-1 rounded hover:bg-slate-100 text-slate-500"><ArrowRight className="w-4 h-4" /></button>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select onChange={(e) => setSelectedProyecto(e.target.value)} className="text-[10px] px-2 py-1 border rounded bg-white" value={selectedProyecto || ''}>
              <option value="">Seleccione un proyecto...</option>
              {presupuestos.map(p => <option key={p.id} value={p.id}>{p.proyecto}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          {pagina === 0 && (
            <div className="grid grid-cols-12 gap-3 h-full">
              <div className="col-span-12 grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-2">
                <KPI icon={FolderKanban} label="Activos" value={String(stats.activos)} color="indigo" />
                <KPI icon={TrendingUp} label="Avance Prom." value={`${stats.avancePromedio.toFixed(1)}%`} color="blue" />
                <KPI icon={Wallet} label="Presupuestado" value={fmtQ(stats.totalPresupuestado)} color="emerald" />
                <KPI icon={TrendingDown} label="Gastos" value={fmtQ(stats.gastos)} color="red" />
                <KPI icon={Percent} label="Balance" value={fmtQ(stats.balance)} color={stats.balance >= 0 ? 'teal' : 'amber'} />
              </div>
              <div className="col-span-12 lg:col-span-7 bg-white rounded-xl shadow-md p-3 flex flex-col">
                <h3 className="font-bold text-xs text-slate-800 mb-1 flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-blue-700" />Avance Físico vs Financiero</h3>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={avanceData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={{ fontSize: 10 }} />
                      <Bar dataKey="fisico" fill="#1E3A8A" name="Físico %" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="financiero" fill="#10B981" name="Financiero %" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="col-span-12 lg:col-span-5 bg-white rounded-xl shadow-md p-3 flex flex-col">
                <h3 className="font-bold text-xs text-slate-800 mb-1 flex items-center gap-1.5"><PieChartIcon className="w-3.5 h-3.5 text-blue-700" />Distribución por Fase</h3>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={faseDistribucion} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {faseDistribucion.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {pagina === 1 && (
            <div className="grid grid-cols-12 gap-3 h-full">
              <div className="col-span-12 lg:col-span-7 bg-white rounded-xl shadow-md p-3 flex flex-col">
                <h3 className="font-bold text-xs text-slate-800 mb-1 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-blue-700" />Flujo de Caja Mensual</h3>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={flujoMensual} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="mes" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={{ fontSize: 10 }} formatter={(v: number) => fmtQ(v)} />
                      <Line type="monotone" dataKey="ingresos" stroke="#10B981" strokeWidth={2} name="Ingresos" />
                      <Line type="monotone" dataKey="gastos" stroke="#EF4444" strokeWidth={2} name="Gastos" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="col-span-12 lg:col-span-5 bg-white rounded-xl shadow-md p-3 flex flex-col">
                <h3 className="font-bold text-xs text-slate-800 mb-1 flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5 text-blue-700" />Gastos por Categoría</h3>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={gastosPorCategoria} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {gastosPorCategoria.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 10 }} formatter={(v: number) => fmtQ(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="col-span-12 bg-white rounded-xl shadow-md p-3">
                <h3 className="font-bold text-xs text-slate-800 mb-1 flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-blue-700" />Comparativa Mensual Ingresos vs Gastos</h3>
                <div className="h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={flujoMensual} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <XAxis dataKey="mes" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={{ fontSize: 10 }} formatter={(v: number) => fmtQ(v)} />
                      <Bar dataKey="ingresos" fill="#10B981" name="Ingresos" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="gastos" fill="#EF4444" name="Gastos" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {pagina === 2 && (
            <div className="grid grid-cols-12 gap-3 h-full">
              <div className="col-span-12 lg:col-span-4 bg-white rounded-xl shadow-md p-3 flex flex-col overflow-y-auto">
                <h3 className="font-bold text-xs text-slate-800 mb-2 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-blue-700" />Ruta Crítica</h3>
                <div className="flex-1 min-h-0 overflow-y-auto space-y-1">
                  {rutaCritica.length > 0 ? rutaCritica.filter(r => r.esRutaCritica).map((r: any) => (
                    <div key={r.id} className="flex justify-between p-2 border-b text-[11px]">
                      <span className="font-medium text-red-700">{r.descripcion}</span>
                      <span className="text-red-600 font-bold">{r.duracionDias}d</span>
                    </div>
                  )) : <div className="text-center py-4 text-slate-400 text-xs">Seleccione un proyecto para ver su ruta crítica</div>}
                </div>
              </div>
              <div className="col-span-12 lg:col-span-5 bg-white rounded-xl shadow-md p-3 flex flex-col">
                <h3 className="font-bold text-xs text-slate-800 mb-2 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-blue-700" />Gantt — {selectedProyecto ? presupuestos.find(p => p.id === selectedProyecto)?.proyecto : 'Seleccione un proyecto'}</h3>
                <div className="flex-1 min-h-0">
                  <GanttView presupuestos={selectedProyecto ? presupuestos.filter(p => p.id === selectedProyecto) : []} />
                </div>
              </div>
              <div className="col-span-12 lg:col-span-3 bg-white rounded-xl shadow-md p-3 flex flex-col overflow-y-auto">
                <h3 className="font-bold text-xs text-slate-800 mb-2 flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-emerald-600" />Control de Planilla</h3>
                <div className="space-y-2">
                  {selectedProyecto ? (
                    <>
                      <div className="p-3 bg-blue-50 rounded-lg text-center">
                        <div className="text-[10px] text-blue-600 uppercase font-semibold">Total Invertido</div>
                        <div className="text-xl font-bold text-blue-900">{fmtQ(gastosPersonal)}</div>
                      </div>
                      <div className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Últimos Pagos</div>
                      {transacciones.filter(t => t.proyectoId === selectedProyecto && t.categoria === 'mano-obra').slice(0, 5).map(t => (
                        <div key={t.id} className="flex justify-between items-center py-1.5 border-b text-[11px]">
                          <div>
                            <div className="text-slate-700">{t.descripcion || 'Pago'}</div>
                            <div className="text-slate-400">{t.fecha}</div>
                          </div>
                          <div className="font-semibold text-emerald-700">{fmtQ(t.costoTotal)}</div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs">Seleccione un proyecto arriba</div>
                  )}
                </div>
              </div>
              {selectedProyecto && (
                <div className="col-span-12 bg-white rounded-xl shadow-md p-3">
                  <BitacoraAvancePanel presupuestoId={selectedProyecto} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tables section (below the chart viewport) */}
      <div className="p-2 sm:p-3 space-y-4">
          <ProyectosTabla titulo="Proyectos en Ejecución" proyectos={ejecucion} color="emerald" onAction={(p) => {
            if (p.fase === 'ejecución') transicionFase(p.id, 'pausa');
            else if (p.fase === 'pausa') transicionFase(p.id, 'ejecución');
          }} actionLabel={(p) => p.fase === 'pausa' ? 'Reanudar' : 'Pausar'} onVer={(p) => { setSelectedProyecto(p.id); setPagina(2); }} />

        <ProyectosTabla titulo="Proyectos en Planeación" proyectos={planeacion} color="amber" onAction={(p) => transicionFase(p.id, 'ejecución')} actionLabel={() => 'Iniciar'} onVer={(p) => { setSelectedProyecto(p.id); setPagina(2); }} />

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
  onVer?: (p: Presupuesto) => void;
}> = ({ titulo, proyectos, color, onAction, actionLabel, onVer }) => {
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
                  <div className="flex items-center justify-center gap-1">
                    {onVer && (
                      <button onClick={() => onVer(p)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 transition">
                        <Eye className="w-3 h-3" /> Ver
                      </button>
                    )}
                    {onAction && actionLabel ? (
                      <button onClick={() => onAction(p)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-white bg-blue-600 hover:bg-blue-700 transition">
                        <Play className="w-3 h-3" /> {actionLabel(p)}
                      </button>
                    ) : null}
                  </div>
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
