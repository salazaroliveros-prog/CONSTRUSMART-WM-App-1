import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { GanttService } from '@/services/seguimiento/GanttService';
import type { RenglonCPM } from '@/services/seguimiento/GanttService';
import type { Renglon } from '@/data/renglones';
import PageShell from '@/components/shared/PageShell';
import GanttView from '@/components/shared/GanttView';
import { BitacoraAvancePanel } from '@/components/shared/BitacoraAvancePanel';
import ChartCard from '@/components/shared/ChartCard';
import { fmtQ } from '@/lib/exporters';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, FolderKanban, Percent, ArrowLeft, ArrowRight, BarChart3, PieChartIcon, LineChartIcon, Activity, DollarSign, Users, Calendar, Clock, ShieldCheck, Target } from 'lucide-react';

const PIE_COLORS = ['#1E3A8A', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16'];
const KPIColorMap: Record<string, string> = {
  emerald: 'from-emerald-500/90 to-emerald-600/90',
  blue: 'from-blue-600/90 to-blue-700/90',
  indigo: 'from-indigo-500/90 to-indigo-600/90',
  amber: 'from-amber-500/90 to-amber-600/90',
  red: 'from-red-500/90 to-red-600/90',
  teal: 'from-teal-500/90 to-teal-600/90',
  purple: 'from-purple-600/90 to-purple-700/90',
};

interface ChartDef {
  id: string;
  title: string;
  icon: React.ReactNode;
  span: string;
  height: string;
  render: () => React.ReactNode;
}

const SeguimientoScreen: React.FC = () => {
  const { presupuestos, transacciones, transicionFase, addTransaccion, empleados } = useAppContext();
  const [selectedProyecto, setSelectedProyecto] = useState<string | null>(null);
  const [pagina, setPagina] = useState(0);
  const [hiddenCharts, setHiddenCharts] = useState<Set<string>>(new Set());
  
  const [showPagoForm, setShowPagoForm] = useState(false);
  const [pagoForm, setPagoForm] = useState({
    empleadoId: '', monto: 0, fecha: new Date().toISOString().split('T')[0], descripcion: ''
  });
  const [pagoLoading, setPagoLoading] = useState(false);

  const handleRegistrarPago = async () => {
    if (!selectedProyecto) { toast.error('Seleccione un proyecto primero'); return; }
    if (!pagoForm.empleadoId) { toast.error('Seleccione un empleado'); return; }
    if (pagoForm.monto <= 0) { toast.error('Ingrese un monto válido'); return; }

    setPagoLoading(true);
    try {
      const { PlanillaService } = await import('@/services/seguimiento/PlanillaService');
      const tx = await PlanillaService.registrarPago(
        'currentUser', // el servicio lo maneja o usa addTransaccion
        { 
          ...pagoForm, 
          proyectoId: selectedProyecto 
        }
      );
      
      // El contexto se actualiza automáticamente si usamos addTransaccion
      // Pero PlanillaService.registrarPago usa FinancieroService directo.
      // Así que lo agregamos manualmente al contexto para que sea reactivo.
      await addTransaccion({
        tipo: 'gasto',
        descripcion: tx.descripcion,
        cantidad: tx.cantidad,
        unidad: tx.unidad,
        categoria: 'mano-obra',
        costoUnitario: tx.costoUnitario,
        costoTotal: tx.costoTotal,
        fecha: tx.fecha,
        proyectoId: tx.proyectoId,
        empleadoId: tx.empleadoId
      });

      toast.success('Pago de planilla registrado');
      setShowPagoForm(false);
      setPagoForm({ empleadoId: '', monto: 0, fecha: new Date().toISOString().split('T')[0], descripcion: '' });
    } catch (err) {
      console.error(err);
      toast.error('Error al registrar pago');
    } finally {
      setPagoLoading(false);
    }
  };

  const [chartOrder, setChartOrder] = useState<string[][]>(() => {
    try {
      const saved = localStorage.getItem('seg_charts');
      return saved ? JSON.parse(saved) : [
        ['kpi', 'avance-bar', 'fase-donut', 'presup-vs-real', 'evo-avance', 'costos-acum'],
        ['flujo-caja', 'gastos-cat', 'comp-mensual', 'ingresos-proy', 'margen-mensual'],
        ['gantt', 'ruta-critica', 'planilla', 'bitacora', 'presup-vs-planilla', 'avance-semanal'],
      ];
    } catch { return [
      ['kpi', 'avance-bar', 'fase-donut', 'presup-vs-real', 'evo-avance', 'costos-acum'],
      ['flujo-caja', 'gastos-cat', 'comp-mensual', 'ingresos-proy', 'margen-mensual'],
      ['gantt', 'ruta-critica', 'planilla', 'bitacora', 'presup-vs-planilla', 'avance-semanal'],
    ]; }
  });

  // Save chart order
  useEffect(() => { localStorage.setItem('seg_charts', JSON.stringify(chartOrder)); }, [chartOrder]);

  // Filtrar transacciones según proyecto seleccionado
  const transaccionesFiltradas = useMemo(() => {
    if (!selectedProyecto) return transacciones;
    return transacciones.filter(t => t.proyectoId === selectedProyecto);
  }, [transacciones, selectedProyecto]);

  const presupuestosFiltrados = useMemo(() => {
    if (!selectedProyecto) return presupuestos;
    return presupuestos.filter(p => p.id === selectedProyecto);
  }, [presupuestos, selectedProyecto]);

  // Data computations
  const ejecucion = presupuestosFiltrados.filter(p => p.fase === 'ejecución');
  const planeacion = presupuestosFiltrados.filter(p => p.fase === 'planeación');
  const pausa = presupuestosFiltrados.filter(p => p.fase === 'pausa');
  const finalizados = presupuestosFiltrados.filter(p => p.fase === 'finalizado');

   
   
  const stats = useMemo(() => {
    const filtrados = selectedProyecto ? presupuestos.filter(p => p.id === selectedProyecto) : presupuestos;
    const ejec = filtrados.filter(p => p.fase === 'ejecución');
    const planea = filtrados.filter(p => p.fase === 'planeación');
    const ingresos = transaccionesFiltradas.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.costoTotal, 0);
    const gastos = transaccionesFiltradas.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.costoTotal, 0);
    const avancePromedio = ejec.length > 0 ? ejec.reduce((s, p) => s + (p.avanceFisico || 0), 0) / ejec.length : 0;
    return { ingresos, gastos, totalPresupuestado: filtrados.reduce((s, p) => s + (p.total || 0), 0), avancePromedio, activos: ejec.length + planea.length, balance: ingresos - gastos };
  }, [presupuestos, selectedProyecto, transaccionesFiltradas]);

  const flujoMensual = useMemo(() => {
    const data: Record<string, { mes: string; ingresos: number; gastos: number }> = {};
    transaccionesFiltradas.forEach(t => {
      const mes = (t.fecha || '').slice(0, 7);
      if (!mes) return;
      if (!data[mes]) data[mes] = { mes, ingresos: 0, gastos: 0 };
      if (t.tipo === 'ingreso') data[mes].ingresos += t.costoTotal;
      else data[mes].gastos += t.costoTotal;
    });
    return Object.values(data).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [transaccionesFiltradas]);

   
  const avanceProyectos = useMemo(() => {
    const filtrados = selectedProyecto ? presupuestos.filter(p => p.id === selectedProyecto) : presupuestos;
    const ejec = filtrados.filter(p => p.fase === 'ejecución');
    if (ejec.length === 0) return [{ name: 'Sin datos', fisico: 0, financiero: 0 }];
    return ejec.slice(0, 10).map(p => ({
      name: p.proyecto.slice(0, 14), fisico: p.avanceFisico ?? 0, financiero: p.avanceFinanciero ?? 0,
    }));
  }, [presupuestos, selectedProyecto]);

  const gastosPorCategoria = useMemo(() => {
    const cats: Record<string, number> = {};
    transaccionesFiltradas.filter(t => t.tipo === 'gasto').forEach(t => { cats[t.categoria] = (cats[t.categoria] || 0) + t.costoTotal; });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [transaccionesFiltradas]);

   
  const faseDistribucion = useMemo(() => {
    const filtrados = selectedProyecto ? presupuestos.filter(p => p.id === selectedProyecto) : presupuestos;
    const map: Record<string, number> = {};
    filtrados.forEach(p => { map[p.fase] = (map[p.fase] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [presupuestos, selectedProyecto]);

  // Presupuesto vs Real por proyecto
   
  const presupuestoVsReal = useMemo(() => {
    const filtrados = selectedProyecto ? presupuestos.filter(p => p.id === selectedProyecto) : presupuestos;
    return filtrados.slice(0, 10).map(p => {
      const real = transaccionesFiltradas.filter(t => t.proyectoId === p.id && t.tipo === 'gasto').reduce((s, t) => s + t.costoTotal, 0);
      return { name: p.proyecto.slice(0, 12), presupuesto: p.total || 0, real };
    });
  }, [presupuestos, selectedProyecto, transaccionesFiltradas]);

  // Ingresos por proyecto
  const ingresosPorProyecto = useMemo(() => {
    const filtrados = selectedProyecto ? presupuestos.filter(p => p.id === selectedProyecto) : presupuestos;
    const map: Record<string, number> = {};
    transaccionesFiltradas.filter(t => t.tipo === 'ingreso').forEach(t => {
      const key = filtrados.find(p => p.id === t.proyectoId)?.proyecto || 'Admin';
      map[key] = (map[key] || 0) + t.costoTotal;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [presupuestos, selectedProyecto, transaccionesFiltradas]);

  // Margen mensual
  const margenMensual = useMemo(() => {
    return flujoMensual.map(d => ({ ...d, margen: ((d.ingresos - d.gastos) / (d.ingresos || 1)) * 100 }));
  }, [flujoMensual]);

  // Costos acumulados
  const costosAcumulados = useMemo(() => {
    let acum = 0; let acumi = 0;
    return flujoMensual.map(d => {
      acum += d.gastos;
      acumi += d.ingresos;
      return { ...d, gastoAcum: acum, ingresoAcum: acumi };
    });
  }, [flujoMensual]);

  // Ruta crítica
  const rutaCritica = useMemo(() => {
    if (!selectedProyecto) return [];
    const p = presupuestos.find(pr => pr.id === selectedProyecto);
    if (!p) return [];
    const lineas = (p.lineas || []) as (Renglon & { cantidad: number })[];
    return GanttService.calcularRutaCritica(lineas);
  }, [selectedProyecto, presupuestos]);

  // Gastos de planilla
  const gastosPersonal = useMemo(() => {
    if (!selectedProyecto) return 0;
    return transacciones.filter(t => t.proyectoId === selectedProyecto && t.categoria === 'mano-obra').reduce((acc, t) => acc + t.costoTotal, 0);
  }, [selectedProyecto, transacciones]);

  // Presupuesto total del proyecto seleccionado
  const presupuestoSeleccionado = useMemo(() => {
    if (!selectedProyecto) return 0;
    return presupuestos.find(p => p.id === selectedProyecto)?.total || 0;
  }, [selectedProyecto, presupuestos]);

  // Avance semanal simulado
  const avanceSemanal = useMemo(() => {
    const semanas = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'];
    return semanas.map((s, i) => ({
      name: s,
      avance: Math.min(100, (i + 1) * (stats.avancePromedio / 6)),
      plan: Math.min(100, (i + 1) * 16.67),
    }));
  }, [stats.avancePromedio]);

  const currentPageCharts = useMemo(() => chartOrder[pagina] || [], [chartOrder, pagina]);
  const totalPaginas = chartOrder.length;
  const visibleCharts = useMemo(() => currentPageCharts.filter(id => !hiddenCharts.has(id)), [currentPageCharts, hiddenCharts]);

  // Auto-restore if all hidden
  useEffect(() => {
    if (visibleCharts.length === 0 && currentPageCharts.length > 0) {
      setHiddenCharts(prev => { const next = new Set(prev); currentPageCharts.forEach(id => next.delete(id)); return next; });
    }
  }, [visibleCharts.length, currentPageCharts]);

  const nextPage = useCallback(() => setPagina(p => (p + 1) % totalPaginas), [totalPaginas]);
  const prevPage = useCallback(() => setPagina(p => (p - 1 + totalPaginas) % totalPaginas), [totalPaginas]);

  const handleDrop = useCallback((sourceId: string, targetId: string) => {
    setChartOrder(prev => {
      const newOrder = prev.map(page => [...page]);
      const pageIdx = newOrder.findIndex(page => page.includes(sourceId));
      if (pageIdx === -1) return prev;
      const srcIdx = newOrder[pageIdx].indexOf(sourceId);
      const tgtIdx = newOrder[pageIdx].indexOf(targetId);
      if (srcIdx === -1 || tgtIdx === -1) return prev;
      [newOrder[pageIdx][srcIdx], newOrder[pageIdx][tgtIdx]] = [newOrder[pageIdx][tgtIdx], newOrder[pageIdx][srcIdx]];
      return newOrder;
    });
  }, []);

  const handleRemove = useCallback((id: string) => { setHiddenCharts(prev => new Set(prev).add(id)); }, []);

  const chartDefinitions = useMemo((): Record<string, ChartDef> => ({
    'kpi': {
      id: 'kpi', title: 'KPIs', icon: <FolderKanban className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12', height: 'min-h-[90px]',
      render: () => (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-2">
          <div className={`bg-gradient-to-br ${KPIColorMap.indigo} text-white rounded-xl p-3 shadow-md flex flex-col justify-center`}>
            <div className="flex items-center justify-between mb-1"><div className="p-1.5 rounded-lg bg-white/20"><FolderKanban className="w-3.5 h-3.5" /></div></div>
            <div className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">Activos</div>
            <div className="text-sm sm:text-base font-bold leading-tight mt-0.5">{String(stats.activos)}</div>
          </div>
          <div className={`bg-gradient-to-br ${KPIColorMap.blue} text-white rounded-xl p-3 shadow-md flex flex-col justify-center`}>
            <div className="flex items-center justify-between mb-1"><div className="p-1.5 rounded-lg bg-white/20"><TrendingUp className="w-3.5 h-3.5" /></div></div>
            <div className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">Avance Prom.</div>
            <div className="text-sm sm:text-base font-bold leading-tight mt-0.5">{stats.avancePromedio.toFixed(1)}%</div>
          </div>
          <div className={`bg-gradient-to-br ${KPIColorMap.emerald} text-white rounded-xl p-3 shadow-md flex flex-col justify-center`}>
            <div className="flex items-center justify-between mb-1"><div className="p-1.5 rounded-lg bg-white/20"><Wallet className="w-3.5 h-3.5" /></div></div>
            <div className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">Presupuestado</div>
            <div className="text-sm sm:text-base font-bold leading-tight mt-0.5">{fmtQ(stats.totalPresupuestado)}</div>
          </div>
          <div className={`bg-gradient-to-br ${KPIColorMap.red} text-white rounded-xl p-3 shadow-md flex flex-col justify-center`}>
            <div className="flex items-center justify-between mb-1"><div className="p-1.5 rounded-lg bg-white/20"><TrendingDown className="w-3.5 h-3.5" /></div></div>
            <div className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">Gastos</div>
            <div className="text-sm sm:text-base font-bold leading-tight mt-0.5">{fmtQ(stats.gastos)}</div>
          </div>
          <div className={`bg-gradient-to-br ${stats.balance >= 0 ? KPIColorMap.teal : KPIColorMap.amber} text-white rounded-xl p-3 shadow-md flex flex-col justify-center`}>
            <div className="flex items-center justify-between mb-1"><div className="p-1.5 rounded-lg bg-white/20"><Percent className="w-3.5 h-3.5" /></div></div>
            <div className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">Balance</div>
            <div className="text-sm sm:text-base font-bold leading-tight mt-0.5">{fmtQ(stats.balance)}</div>
          </div>
        </div>
      ),
    },
    'avance-bar': {
      id: 'avance-bar', title: 'Avance Físico vs Financiero', icon: <BarChart3 className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 lg:col-span-7', height: 'min-h-[180px]',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={avanceProyectos} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <XAxis dataKey="name" tick={{ fontSize: 9 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
            <Tooltip contentStyle={{ fontSize: 10, backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))' }} />
            <Legend wrapperStyle={{ fontSize: 9 }} />
            <Bar dataKey="fisico" fill="#1E3A8A" name="Físico %" radius={[2, 2, 0, 0]} />
            <Bar dataKey="financiero" fill="#10B981" name="Financiero %" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    'fase-donut': {
      id: 'fase-donut', title: 'Distribución por Fase', icon: <PieChartIcon className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 sm:col-span-6 lg:col-span-5', height: 'min-h-[180px]',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={faseDistribucion} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
              {faseDistribucion.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      ),
    },
    'presup-vs-real': {
      id: 'presup-vs-real', title: 'Presupuesto vs Real', icon: <Target className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 sm:col-span-6 lg:col-span-4', height: 'min-h-[160px]',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={presupuestoVsReal} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 8 }} />
            <YAxis tick={{ fontSize: 8 }} />
            <Tooltip formatter={(v: number) => fmtQ(v)} />
            <Legend wrapperStyle={{ fontSize: 8 }} />
            <Bar dataKey="presupuesto" fill="#3B82F6" name="Presup." radius={[2, 2, 0, 0]} />
            <Bar dataKey="real" fill="#F59E0B" name="Real" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    'evo-avance': {
      id: 'evo-avance', title: 'Evolución del Avance', icon: <LineChartIcon className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 sm:col-span-6 lg:col-span-4', height: 'min-h-[160px]',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={avanceSemanal} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="name" tick={{ fontSize: 8 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 8 }} />
            <Line type="monotone" dataKey="avance" stroke="#10B981" strokeWidth={2} name="Real" dot={false} />
            <Line type="monotone" dataKey="plan" stroke="#3B82F6" strokeWidth={2} name="Plan" strokeDasharray="4 4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ),
    },
    'costos-acum': {
      id: 'costos-acum', title: 'Costos Acumulados', icon: <Activity className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 sm:col-span-6 lg:col-span-4', height: 'min-h-[160px]',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={costosAcumulados} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="mes" tick={{ fontSize: 8 }} />
            <YAxis tick={{ fontSize: 8 }} />
            <Area type="monotone" dataKey="ingresoAcum" stroke="#10B981" fill="#10B981" fillOpacity={0.2} name="Ingresos Acum." />
            <Area type="monotone" dataKey="gastoAcum" stroke="#EF4444" fill="#EF4444" fillOpacity={0.2} name="Gastos Acum." />
          </AreaChart>
        </ResponsiveContainer>
      ),
    },
    'flujo-caja': {
      id: 'flujo-caja', title: 'Flujo de Caja Mensual', icon: <TrendingUp className="w-3.5 h-3.5 text-blue-700" />,
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
            <Pie data={gastosPorCategoria} cx="50%" cy="50%" innerRadius={40} outerRadius={75} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
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
    'margen-mensual': {
      id: 'margen-mensual', title: 'Margen Neto Mensual', icon: <Percent className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 sm:col-span-6 lg:col-span-4', height: 'min-h-[140px]',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={margenMensual} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="mes" tick={{ fontSize: 8 }} />
            <YAxis domain={[-100, 100]} tick={{ fontSize: 8 }} />
            <Line type="monotone" dataKey="margen" stroke="#8B5CF6" strokeWidth={2} name="Margen %" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ),
    },
    'gantt': {
      id: 'gantt', title: 'Gantt del Proyecto', icon: <Calendar className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 lg:col-span-7', height: 'min-h-[200px]',
      render: () => (
        <div className="h-full overflow-hidden">
          {selectedProyecto ? (
            <GanttView proyectoId={selectedProyecto} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-xs">Seleccione un proyecto arriba</div>
          )}
        </div>
      ),
    },
    'ruta-critica': {
      id: 'ruta-critica', title: 'Ruta Crítica', icon: <Clock className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 sm:col-span-6 lg:col-span-5', height: 'min-h-[200px]',
      render: () => (
        <div className="overflow-y-auto h-full p-2 space-y-1.5">
          {rutaCritica.length > 0 ? (
            rutaCritica.filter(r => r.esRutaCritica).map((r: RenglonCPM) => (
              <div key={r.id} className="flex justify-between p-2 border-b dark:border-border text-[11px]">
                <span className="font-medium text-red-700 dark:text-red-400 truncate">{r.descripcion}</span>
                <span className="text-red-600 dark:text-red-400 font-bold shrink-0 ml-2">{r.duracionDias}d</span>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground text-xs">Seleccione un proyecto para ver su ruta crítica</div>
          )}
        </div>
      ),
    },
    'planilla': {
      id: 'planilla', title: 'Control de Planilla', icon: <Users className="w-3.5 h-3.5 text-emerald-600" />,
      span: 'col-span-12 sm:col-span-6 lg:col-span-4', height: 'min-h-[240px]',
      render: () => (
        <div className="p-2 space-y-2 overflow-y-auto h-full">
          {selectedProyecto ? (
            <>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex-1 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-center">
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-semibold">Total Invertido</div>
                  <div className="text-xl font-bold text-blue-900 dark:text-blue-100">{fmtQ(gastosPersonal)}</div>
                </div>
                <button 
                  onClick={() => setShowPagoForm(true)}
                  className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors flex flex-col items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-[9px] font-bold uppercase">Pago</span>
                </button>
              </div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Últimos Pagos</div>
              {transacciones.filter(t => t.proyectoId === selectedProyecto && t.categoria === 'mano-obra').slice(0, 4).map(t => (
                <div key={t.id} className="flex justify-between items-center py-1.5 border-b dark:border-border text-[11px]">
                  <div><div className="text-card-foreground">{t.descripcion || 'Pago'}</div><div className="text-muted-foreground">{t.fecha}</div></div>
                  <div className="font-semibold text-emerald-700 dark:text-emerald-400">{fmtQ(t.costoTotal)}</div>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-xs">Seleccione un proyecto arriba</div>
          )}
        </div>
      ),
    },
    'bitacora': {
      id: 'bitacora', title: 'Bitácora de Avance', icon: <Activity className="w-3.5 h-3.5 text-emerald-600" />,
      span: 'col-span-12 sm:col-span-6 lg:col-span-4', height: 'min-h-[240px]',
      render: () => (
        <div className="h-full overflow-hidden">
          {selectedProyecto ? (
            <BitacoraAvancePanel 
              presupuestoId={selectedProyecto} 
              onAvanceChange={async (af) => { await updatePresupuesto(selectedProyecto, { avanceFisico: af }); }} 
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-xs">Seleccione un proyecto arriba</div>
          )}
        </div>
      ),
    },
    'presup-vs-planilla': {
      id: 'presup-vs-planilla', title: 'Planilla vs Presupuesto', icon: <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 sm:col-span-6 lg:col-span-4', height: 'min-h-[160px]',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={[{ name: selectedProyecto ? presupuestos.find(p => p.id === selectedProyecto)?.proyecto.slice(0, 12) || 'Proyecto' : 'N/A', presupuesto: presupuestoSeleccionado, planilla: gastosPersonal }]} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} />
            <Tooltip formatter={(v: number) => fmtQ(v)} />
            <Legend wrapperStyle={{ fontSize: 9 }} />
            <Bar dataKey="presupuesto" fill="#3B82F6" name="Presupuesto" radius={[2, 2, 0, 0]} />
            <Bar dataKey="planilla" fill="#10B981" name="Planilla" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    'avance-semanal': {
      id: 'avance-semanal', title: 'Avance Semanal Estimado', icon: <Activity className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 sm:col-span-6 lg:col-span-4', height: 'min-h-[160px]',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={avanceSemanal} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="name" tick={{ fontSize: 8 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 8 }} />
            <Area type="monotone" dataKey="avance" stroke="#10B981" fill="#10B981" fillOpacity={0.3} name="Real" />
            <Area type="monotone" dataKey="plan" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} name="Plan" />
          </AreaChart>
        </ResponsiveContainer>
      ),
    },
  }), [avanceProyectos, faseDistribucion, presupuestoVsReal, avanceSemanal, costosAcumulados, flujoMensual, gastosPorCategoria, ingresosPorProyecto, margenMensual, rutaCritica, gastosPersonal, presupuestoSeleccionado, stats, selectedProyecto, presupuestos, transacciones]);

  return (
    <PageShell showHome={false} title="Seguimiento de Proyectos">
      <div className="h-dvh flex flex-col p-0.5 sm:p-2 md:p-3 overflow-hidden">
        {/* Navbar */}
        <div className="flex items-center justify-between mb-1 shrink-0 flex-wrap gap-1">
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
            <select
              onChange={e => setSelectedProyecto(e.target.value || null)}
              className="text-[10px] px-2 py-1 border rounded bg-card dark:bg-card select-standard"
              value={selectedProyecto || ''}
            >
              <option value="">Seleccione un proyecto...</option>
              {presupuestos.map(p => <option key={p.id} value={p.id}>{p.proyecto}</option>)}
            </select>
          </div>
        </div>

        {/* Charts grid */}
        <div className="flex-1 grid grid-cols-12 gap-2 overflow-hidden">
          {visibleCharts.length > 0 ? (
            visibleCharts.map((chartId, idx) => {
              const def = chartDefinitions[chartId];
              if (!def) return null;
              return (
                <ChartCard key={chartId} id={chartId} title={def.title} icon={def.icon} span={def.span} height={def.height} onDrop={handleDrop} onRemove={handleRemove} delay={idx * 50}>
                  {def.render()}
                </ChartCard>
              );
            })
          ) : (
            <div className="col-span-12 flex items-center justify-center text-muted-foreground text-xs">
              Todas las gráficas ocultas. <button onClick={() => setHiddenCharts(new Set())} className="underline ml-1 text-primary">Restaurar todas</button>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Registrar Pago de Planilla */}
      {showPagoForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-card dark:bg-card rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                Registrar Pago Planilla
              </h2>
              <button onClick={() => setShowPagoForm(false)} className="p-1 text-muted-foreground hover:bg-accent rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Colaborador</label>
                <select 
                  value={pagoForm.empleadoId} 
                  onChange={e => {
                    const emp = empleados.find(emp => emp.id === e.target.value);
                    setPagoForm({
                      ...pagoForm, 
                      empleadoId: e.target.value,
                      monto: emp?.salario_diario || 0,
                      descripcion: emp ? `Pago a ${emp.nombre} - ${emp.puesto}` : ''
                    });
                  }}
                  className="select-standard w-full"
                >
                  <option value="">Seleccionar empleado...</option>
                  {empleados.filter(e => e.activo).map(e => (
                    <option key={e.id} value={e.id}>{e.nombre} ({e.puesto})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Monto (Q)</label>
                  <input 
                    type="number" 
                    value={pagoForm.monto || ''} 
                    onChange={e => setPagoForm({...pagoForm, monto: parseFloat(e.target.value) || 0})}
                    className="input-standard w-full text-right"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Fecha</label>
                  <input 
                    type="date" 
                    value={pagoForm.fecha} 
                    onChange={e => setPagoForm({...pagoForm, fecha: e.target.value})}
                    className="input-standard w-full"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Descripción / Concepto</label>
                <input 
                  type="text" 
                  value={pagoForm.descripcion} 
                  onChange={e => setPagoForm({...pagoForm, descripcion: e.target.value})}
                  className="input-standard w-full"
                  placeholder="Ej: Pago quincena 1 de Mayo"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-border bg-muted/30">
              <button onClick={() => setShowPagoForm(false)} className="btn-secondary text-sm">Cancelar</button>
              <button 
                onClick={handleRegistrarPago} 
                disabled={pagoLoading || !pagoForm.empleadoId} 
                className="btn-primary text-sm px-6"
              >
                {pagoLoading ? 'Procesando...' : <><Save className="w-4 h-4 mr-2" /> Confirmar Pago</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default React.memo(SeguimientoScreen);