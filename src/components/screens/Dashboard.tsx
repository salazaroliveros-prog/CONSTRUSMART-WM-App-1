import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import PageShell from '@/components/shared/PageShell';
import GanttView from '@/components/shared/GanttView';
import ProjectHeatMap from '@/components/shared/ProjectHeatMap';
import ChartCard from '@/components/shared/ChartCard';
import { fmtQ } from '@/lib/exporters';
import { CoreEngineService } from '@/services/CoreEngineService';
import { AgenteInteligente } from '@/services/ai/AgenteInteligente';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Percent, Shield, AlertTriangle, ArrowLeft, ArrowRight, FolderKanban, Wallet, ShoppingCart, PieChartIcon, LineChartIcon, Activity, Target, GitCompare, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, RadialBarChart, RadialBar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

type KPIColor = 'emerald' | 'red' | 'blue' | 'indigo' | 'purple' | 'amber' | 'teal' | 'pink';

const KPI: React.FC<{ icon: React.ComponentType<{ className?: string }>; label: string; value: string; color: KPIColor; onClick?: () => void }> = ({ icon: Icon, label, value, color, onClick }) => {
  const colors: Record<string, string> = {
    emerald: 'from-emerald-500/90 to-emerald-600/90',
    red: 'from-red-500/90 to-red-600/90',
    blue: 'from-blue-600/90 to-blue-700/90',
    indigo: 'from-indigo-500/90 to-indigo-600/90',
    purple: 'from-purple-500/90 to-purple-600/90',
    amber: 'from-amber-500/90 to-amber-600/90',
    teal: 'from-teal-500/90 to-teal-600/90',
    pink: 'from-pink-500/90 to-pink-600/90',
  };
  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${colors[color]} text-white rounded-xl p-3 shadow-md flex flex-col justify-center animate-stagger-fade text-left w-full ${onClick ? 'hover:scale-105 active:scale-95 transition-all cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="p-1.5 rounded-lg bg-white/20"><Icon className="w-3.5 h-3.5" /></div>
      </div>
      <div className="text-tiny uppercase tracking-wider opacity-80 font-semibold">{label}</div>
      <div className="text-sm sm:text-base font-bold leading-tight mt-0.5">{value}</div>
    </button>
  );
};

const PIE_COLORS = ['#1E3A8A', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16', '#F97316'];
const CHARTS_PER_PAGE = 6;

interface ChartDef {
  id: string;
  title: string;
  icon: React.ReactNode;
  span: string;
  height: string;
  render: () => React.ReactNode;
}

const Dashboard: React.FC = () => {
  const { presupuestos, transacciones, proveedores, ordenesCompra, setView, transicionFase } = useAppContext();
  const [pagina, setPagina] = useState(0);
  const [carouselDir, setCarouselDir] = useState<'left' | 'right'>('right');
  const [alertas, setAlertas] = useState<any[]>([]);
  const [filtroProyecto, setFiltroProyecto] = useState('todos');
  const [chartOrder, setChartOrder] = useState<string[][]>(() => {
    try {
      const saved = localStorage.getItem('dash_charts');
      return saved ? JSON.parse(saved) : [['kpi','curvas','gantt','fase','avance','tendencia'], ['flujo-caja','gastos-cat','comp-mensual','ingresos-proy','acumulado'], ['heatmap','alertas','balance-acum','radar-rent','gauge-rent']];
    } catch { return [['kpi','curvas','gantt','fase','avance','tendencia'], ['flujo-caja','gastos-cat','comp-mensual','ingresos-proy','acumulado'], ['heatmap','alertas','balance-acum','radar-rent','gauge-rent']]; }
  });
  const [hiddenCharts, setHiddenCharts] = useState<Set<string>>(new Set());
  const [expandedCharts, setExpandedCharts] = useState<Set<string>>(new Set());

  // Save chart order to localStorage
  useEffect(() => { localStorage.setItem('dash_charts', JSON.stringify(chartOrder)); }, [chartOrder]);

  // --- Data computations ---
  const presupuestosFiltrados = useMemo(
    () => (filtroProyecto === 'todos' ? presupuestos : presupuestos.filter(p => p.id === filtroProyecto)),
    [filtroProyecto, presupuestos]
  );
  const transaccionesFiltradas = useMemo(
    () => (filtroProyecto === 'todos' ? transacciones : transacciones.filter(t => t.proyectoId === filtroProyecto)),
    [filtroProyecto, transacciones]
  );

  const stats = useMemo(() => {
    const ingresos = transaccionesFiltradas.filter(t => t.tipo === 'ingreso').reduce((sum, t) => sum + t.costoTotal, 0);
    const gastos = transaccionesFiltradas.filter(t => t.tipo === 'gasto').reduce((sum, t) => sum + t.costoTotal, 0);
    const totalPresupuestado = presupuestosFiltrados.reduce((sum, p) => sum + (p.total || 0), 0);
    const ocPendientes = ordenesCompra.filter(oc => ['pendiente', 'aprobada', 'recibida_parcial'].includes(oc.estatus)).length;
    const rentabilidad = ingresos === 0 ? 0 : ((ingresos - gastos) / ingresos) * 100;
    return { ingresos, gastos, balance: ingresos - gastos, activos: presupuestosFiltrados.length, rentabilidad, ocPendientes, totalPresupuestado };
  }, [transaccionesFiltradas, presupuestosFiltrados, ordenesCompra]);

  const curvaSData = useMemo(() => CoreEngineService.calcularCurvaS(presupuestosFiltrados, transaccionesFiltradas), [presupuestosFiltrados, transaccionesFiltradas]);
  const flujoMensual = useMemo(() => {
    const byMes: Record<string, { mes: string; ingresos: number; gastos: number }> = {};
    transaccionesFiltradas.forEach(t => {
      const mes = t.fecha?.slice(0, 7) || 'sin-fecha';
      if (!byMes[mes]) byMes[mes] = { mes, ingresos: 0, gastos: 0 };
      if (t.tipo === 'ingreso') byMes[mes].ingresos += t.costoTotal;
      else byMes[mes].gastos += t.costoTotal;
    });
    return Object.values(byMes).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [transaccionesFiltradas]);

  const gastosPorCategoria = useMemo(() => {
    const categorias: Record<string, number> = {};
    transaccionesFiltradas.filter(t => t.tipo === 'gasto').forEach(t => { categorias[t.categoria] = (categorias[t.categoria] || 0) + t.costoTotal; });
    return Object.entries(categorias).map(([name, value]) => ({ name, value }));
  }, [transaccionesFiltradas]);

  const ingresosPorProyecto = useMemo(() => {
    const map: Record<string, number> = {};
    transaccionesFiltradas.filter(t => t.tipo === 'ingreso').forEach(t => {
      const key = presupuestos.find(p => p.id === t.proyectoId)?.proyecto || 'Admin';
      map[key] = (map[key] || 0) + t.costoTotal;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [transaccionesFiltradas, presupuestos]);

  const faseDistribucion = useMemo(() => {
    const map: Record<string, number> = {};
    presupuestosFiltrados.forEach(p => { map[p.fase] = (map[p.fase] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [presupuestosFiltrados]);

  const avanceData = useMemo(() => {
    return presupuestosFiltrados.slice(0, 10).map(p => ({
      name: p.proyecto.slice(0, 12), fisico: p.avanceFisico ?? 0, financiero: p.avanceFinanciero ?? 0,
    }));
  }, [presupuestosFiltrados]);

  const balanceAcumulado = useMemo(() => {
    let acum = 0;
    return flujoMensual.map(d => { acum += d.ingresos - d.gastos; return { ...d, balance: acum }; });
  }, [flujoMensual]);

  const rentabilidadPorProyecto = useMemo(() => {
    return presupuestos.map(p => {
      const ing = transacciones.filter(t => t.proyectoId === p.id && t.tipo === 'ingreso').reduce((s, t) => s + t.costoTotal, 0);
      const gas = transacciones.filter(t => t.proyectoId === p.id && t.tipo === 'gasto').reduce((s, t) => s + t.costoTotal, 0);
      const margen = ing === 0 ? 0 : ((ing - gas) / ing) * 100;
      return { name: p.proyecto.slice(0, 14), valor: Math.max(0, margen + 50), margen };
    });
  }, [presupuestos, transacciones]);

  useEffect(() => {
    let activo = true;
    const cargarAlertas = async () => {
      const resultados = await Promise.all(presupuestos.map(p => AgenteInteligente.diagnosticarProyecto(p, transacciones)));
      if (activo) setAlertas(resultados.flat());
    };
    cargarAlertas();
    return () => { activo = false; };
  }, [presupuestos, transacciones]);

  const currentPageCharts = useMemo(() => chartOrder[pagina] || [], [chartOrder, pagina]);
  const totalPaginas = chartOrder.length;

  // Filter visible charts
  const visibleCharts = useMemo(() => currentPageCharts.filter(id => !hiddenCharts.has(id)), [currentPageCharts, hiddenCharts]);

  // If all hidden on current page, auto-add them back
  useEffect(() => {
    if (visibleCharts.length === 0 && currentPageCharts.length > 0) {
      setHiddenCharts(prev => { const next = new Set(prev); currentPageCharts.forEach(id => next.delete(id)); return next; });
    }
  }, [visibleCharts.length, currentPageCharts]);

  const nextPage = useCallback(() => { setCarouselDir('right'); setPagina(p => (p + 1) % totalPaginas); }, [totalPaginas]);
  const prevPage = useCallback(() => { setCarouselDir('left'); setPagina(p => (p - 1 + totalPaginas) % totalPaginas); }, [totalPaginas]);

  const handleDrop = useCallback((sourceId: string, targetId: string) => {
    setChartOrder(prev => {
      const newOrder = prev.map(page => [...page]);
      const pageIdx = newOrder.findIndex(page => page.includes(sourceId));
      if (pageIdx === -1) return prev;
      const srcIdx = newOrder[pageIdx].indexOf(sourceId);
      const tgtIdx = newOrder[pageIdx].indexOf(targetId);
      if (srcIdx === -1 || tgtIdx === -1) return prev;
      // Swap positions
      [newOrder[pageIdx][srcIdx], newOrder[pageIdx][tgtIdx]] = [newOrder[pageIdx][tgtIdx], newOrder[pageIdx][srcIdx]];
      return newOrder;
    });
  }, []);

  const handleRemove = useCallback((id: string) => {
    setHiddenCharts(prev => new Set(prev).add(id));
  }, []);

  const handleExportDashboard = () => {
    const rows = [
      ['CONSTRUCTORA WM/M&S - Resumen Ejecutivo'],
      [`Fecha: ${new Date().toLocaleDateString()}`],
      [],
      ['KPIs Principales'],
      ['Métrica', 'Valor'],
      ['Ingresos Totales', fmtQ(stats.ingresos)],
      ['Gastos Totales', fmtQ(stats.gastos)],
      ['Balance Neto', fmtQ(stats.balance)],
      ['Rentabilidad Promedio', `${stats.rentabilidad.toFixed(1)}%`],
      ['Proyectos Activos', stats.activos],
      ['OC Pendientes', stats.ocPendientes],
    ];
    import('@/lib/exporters').then(({ downloadCSV }) => {
      downloadCSV(`resumen_ejecutivo_${new Date().toISOString().slice(0,10)}.csv`, rows);
    });
  };

  const chartDefinitions = useMemo((): Record<string, ChartDef> => ({
    'kpi': {
      id: 'kpi', title: 'KPIs', icon: <TrendingUp className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12', height: 'min-h-[90px]',
      render: () => (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-2">
          <KPI icon={TrendingUp} label="Ingresos" value={fmtQ(stats.ingresos)} color="emerald" onClick={() => setView('financiero')} />
          <KPI icon={TrendingDown} label="Gastos" value={fmtQ(stats.gastos)} color="red" onClick={() => setView('financiero')} />
          <KPI icon={Wallet} label="Balance" value={fmtQ(stats.balance)} color={stats.balance >= 0 ? 'blue' : 'red'} onClick={() => setView('financiero')} />
          <KPI icon={FolderKanban} label="Proyectos" value={String(stats.activos)} color="indigo" onClick={() => setView('proyectos')} />
          <KPI icon={Percent} label="Rentab." value={`${stats.rentabilidad.toFixed(1)}%`} color={stats.rentabilidad >= 0 ? 'teal' : 'amber'} onClick={() => setView('financiero')} />
          <KPI icon={ShoppingCart} label="OC Pend." value={String(stats.ocPendientes)} color="purple" onClick={() => setView('compras')} />
        </div>
      ),
    },
    'curvas': {
      id: 'curvas', title: 'Curva S (Valor Ganado)', icon: <BarChart3 className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 lg:col-span-7', height: 'min-h-[180px]',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={curvaSData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="proyecto" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} />
            <Tooltip formatter={(v: number) => fmtQ(v)} />
            <Legend wrapperStyle={{ fontSize: 9 }} />
            <Area type="monotone" dataKey="pv" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} name="Presupuestado" animationBegin={200} animationDuration={800} />
            <Area type="monotone" dataKey="ev" stroke="#10B981" fill="#10B981" fillOpacity={0.3} name="Valor Ganado" animationBegin={400} animationDuration={800} />
            <Area type="monotone" dataKey="ac" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} name="Costo Real" animationBegin={600} animationDuration={800} />
          </AreaChart>
        </ResponsiveContainer>
      ),
    },
    'gantt': {
      id: 'gantt', title: 'Proyectos en Gantt', icon: <Activity className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 lg:col-span-5', height: 'min-h-[180px]',
      render: () => <div className="h-full overflow-hidden"><GanttView /></div>,
    },
    'fase': {
      id: 'fase', title: 'Proyectos por Fase', icon: <PieChartIcon className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 sm:col-span-6 lg:col-span-3', height: 'min-h-[140px]',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={faseDistribucion} cx="50%" cy="50%" innerRadius={30} outerRadius={60} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
              {faseDistribucion.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      ),
    },
    'avance': {
      id: 'avance', title: 'Avance Físico vs Financiero', icon: <GitCompare className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 sm:col-span-6 lg:col-span-3', height: 'min-h-[140px]',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={avanceData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 8 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 8 }} />
            <Bar dataKey="fisico" fill="#1E3A8A" name="Físico" radius={[2, 2, 0, 0]} />
            <Bar dataKey="financiero" fill="#10B981" name="Financiero" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    'tendencia': {
      id: 'tendencia', title: 'Tendencia Ingresos vs Gastos', icon: <LineChartIcon className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 sm:col-span-6 lg:col-span-3', height: 'min-h-[140px]',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={flujoMensual} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="mes" tick={{ fontSize: 8 }} />
            <YAxis tick={{ fontSize: 8 }} />
            <Line type="monotone" dataKey="ingresos" stroke="#10B981" strokeWidth={2} name="Ingresos" dot={false} />
            <Line type="monotone" dataKey="gastos" stroke="#EF4444" strokeWidth={2} name="Gastos" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ),
    },
    'flujo-caja': {
      id: 'flujo-caja', title: 'Flujo de Caja Mensual', icon: <LineChartIcon className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 lg:col-span-7', height: 'min-h-[180px]',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={flujoMensual} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="mes" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} />
            <Tooltip formatter={(v: number) => fmtQ(v)} />
            <Legend wrapperStyle={{ fontSize: 9 }} />
            <Line type="monotone" dataKey="ingresos" stroke="#10B981" strokeWidth={2} name="Ingresos" />
            <Line type="monotone" dataKey="gastos" stroke="#EF4444" strokeWidth={2} name="Gastos" />
          </LineChart>
        </ResponsiveContainer>
      ),
    },
    'gastos-cat': {
      id: 'gastos-cat', title: 'Gastos por Categoría', icon: <PieChartIcon className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 sm:col-span-6 lg:col-span-5', height: 'min-h-[180px]',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={gastosPorCategoria} cx="50%" cy="50%" innerRadius={40} outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
              {gastosPorCategoria.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v: number) => fmtQ(v)} />
          </PieChart>
        </ResponsiveContainer>
      ),
    },
    'comp-mensual': {
      id: 'comp-mensual', title: 'Comparativa Mensual', icon: <BarChart3 className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12', height: 'min-h-[120px]',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={flujoMensual} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <XAxis dataKey="mes" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} />
            <Tooltip formatter={(v: number) => fmtQ(v)} />
            <Bar dataKey="ingresos" fill="#10B981" name="Ingresos" radius={[2, 2, 0, 0]} />
            <Bar dataKey="gastos" fill="#EF4444" name="Gastos" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    'ingresos-proy': {
      id: 'ingresos-proy', title: 'Ingresos por Proyecto', icon: <DollarSign className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 sm:col-span-6 lg:col-span-5', height: 'min-h-[140px]',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ingresosPorProyecto} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 8 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 8 }} width={70} />
            <Tooltip formatter={(v: number) => fmtQ(v)} />
            <Bar dataKey="value" fill="#1E3A8A" radius={[0, 3, 3, 0]} name="Ingresos" />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    'acumulado': {
      id: 'acumulado', title: 'Acumulado Ingresos vs Gastos', icon: <Target className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 sm:col-span-6 lg:col-span-4', height: 'min-h-[140px]',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={balanceAcumulado} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="mes" tick={{ fontSize: 8 }} />
            <YAxis tick={{ fontSize: 8 }} />
            <Area type="monotone" dataKey="balance" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} name="Balance Acum." />
          </AreaChart>
        </ResponsiveContainer>
      ),
    },
    'heatmap': {
      id: 'heatmap', title: 'Rentabilidad por Proyecto', icon: <Shield className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 lg:col-span-7', height: 'min-h-[200px]',
      render: () => <ProjectHeatMap />,
    },
    'alertas': {
      id: 'alertas', title: 'Alertas Inteligentes', icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
      span: 'col-span-12 sm:col-span-6 lg:col-span-5', height: 'min-h-[200px]',
      render: () => (
        <div className="overflow-y-auto h-full p-2 space-y-1.5">
          {alertas.length === 0 ? (
            <div className="text-[11px] text-muted-foreground text-center py-6">Sin alertas activas</div>
          ) : (
            alertas.map((a, i) => (
              <div key={i} className={`text-[10px] p-2 rounded flex items-start gap-1.5 ${a.tipo === 'alerta' ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'}`}>
                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                <div>
                  <strong>{a.proyecto}:</strong> {a.mensaje}
                  {a.tipo === 'sugerencia' && (
                    <button onClick={() => transicionFase(presupuestos.find(p => p.proyecto === a.proyecto)?.id || '', 'ejecución')} className="block text-[9px] mt-1 underline">
                      Activar proyecto ahora
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ),
    },
    'balance-acum': {
      id: 'balance-acum', title: 'Evolución del Balance', icon: <TrendingUp className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 sm:col-span-6 lg:col-span-4', height: 'min-h-[160px]',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={balanceAcumulado} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="mes" tick={{ fontSize: 8 }} />
            <YAxis tick={{ fontSize: 8 }} />
            <Line type="monotone" dataKey="balance" stroke="#8B5CF6" strokeWidth={2} name="Balance" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ),
    },
    'radar-rent': {
      id: 'radar-rent', title: 'Rentabilidad por Proyecto', icon: <Target className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 sm:col-span-6 lg:col-span-4', height: 'min-h-[160px]',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" barSize={10} data={rentabilidadPorProyecto}>
            <RadialBar min={15} background dataKey="valor" fill="#1E3A8A" label={{ fontSize: 8, position: 'insideStart' }} />
          </RadialBarChart>
        </ResponsiveContainer>
      ),
    },
    'gauge-rent': {
      id: 'gauge-rent', title: 'Rentabilidad General', icon: <Percent className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 sm:col-span-6 lg:col-span-4', height: 'min-h-[160px]',
      render: () => {
        const rentVal = Math.max(0, Math.min(100, stats.rentabilidad + 50));
        return (
          <div className="flex flex-col items-center justify-center h-full gap-1 p-2">
            <div className="relative w-24 h-24">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <circle cx="60" cy="60" r="54" fill="none" stroke={stats.rentabilidad >= 0 ? '#10B981' : '#EF4444'} strokeWidth="8" strokeDasharray={`${(rentVal / 100) * 339.292} 339.292`} strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold" style={{ color: stats.rentabilidad >= 0 ? '#10B981' : '#EF4444' }}>{stats.rentabilidad.toFixed(1)}%</span>
              </div>
            </div>
            <span className="text-[9px] text-muted-foreground">{stats.rentabilidad >= 0 ? 'Rentabilidad positiva' : 'Pérdida neta'}</span>
          </div>
        );
      },
    },
  }), [curvaSData, flujoMensual, gastosPorCategoria, ingresosPorProyecto, faseDistribucion, avanceData, balanceAcumulado, rentabilidadPorProyecto, stats, alertas, presupuestos, setView, transicionFase]);

const layoutClass = "h-dvh flex flex-col p-0.5 sm:p-2 md:p-3 overflow-hidden";
const pageClass = "flex-1 grid grid-cols-12 gap-1 sm:gap-2 overflow-hidden";

  return (
    <PageShell title="Panel de Control">
      <div className={layoutClass}>
        {/* Navbar */}
        <div className="flex items-center justify-between mb-1.5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Página {pagina + 1} / {totalPaginas}</span>
            <button onClick={prevPage} className="p-1.5 rounded hover:bg-accent text-muted-foreground"><ArrowLeft className="w-4 h-4" /></button>
            <div className="flex gap-1">
              {Array.from({ length: totalPaginas }).map((_, i) => (
                <button key={i} onClick={() => setPagina(i)} className={`w-2.5 h-2.5 rounded-full transition-all ${i === pagina ? 'bg-blue-700 dark:bg-blue-400 scale-125' : 'bg-muted dark:bg-muted'}`} />
              ))}
            </div>
            <button onClick={nextPage} className="p-1.5 rounded hover:bg-accent text-muted-foreground"><ArrowRight className="w-4 h-4" /></button>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={handleExportDashboard}
              className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
            >
              <Download className="w-3 h-3 mr-1.5" />
              EXPORTAR RESUMEN
            </Button>
            <select value={filtroProyecto} onChange={e => setFiltroProyecto(e.target.value)} className="input-standard text-tiny py-1 h-8 w-auto min-w-[180px]">
              <option value="todos">Todos los proyectos</option>
              {presupuestos.map(p => <option key={p.id} value={p.id}>{p.proyecto}</option>)}
            </select>
          </div>
        </div>

        {/* Charts grid - 0 scroll */}
        <div key={pagina} className={`${pageClass} ${carouselDir === 'right' ? 'animate-carousel-right' : 'animate-carousel-left'}`}>
          {visibleCharts.length > 0 ? (
            visibleCharts.map((chartId, idx) => {
              const def = chartDefinitions[chartId];
              if (!def) return null;
              return (
                <ChartCard
                  key={chartId}
                  id={chartId}
                  title={def.title}
                  icon={def.icon}
                  span={def.span}
                  height={def.height}
                  onDrop={handleDrop}
                  onRemove={handleRemove}
                  delay={idx * 50}
                >
                  {def.render()}
                </ChartCard>
              );
            })
          ) : (
            <div className="col-span-12 flex items-center justify-center text-muted-foreground text-xs">
              Todas las gráficas ocultas. <button onClick={() => { setHiddenCharts(new Set()); }} className="underline ml-1 text-primary">Restaurar todas</button>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default React.memo(Dashboard);