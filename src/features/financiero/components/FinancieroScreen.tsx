import { CoreEngineService } from '@/services/CoreEngineService';
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import PageShell from '@/components/shared/PageShell';
import ChartCard from '@/components/shared/ChartCard';
import { fmtQ } from '@/lib/exporters';
import { TrendingUp, TrendingDown, Wallet, PieChartIcon, ArrowLeft, ArrowRight, LineChartIcon, DollarSign, Percent, Target, Activity, CreditCard, BarChart3 } from 'lucide-react';
import ProfitReport from './ProfitReport';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LineChart, Line, AreaChart, Area, RadialBarChart, RadialBar } from 'recharts';

const categoriaLabels: Record<string, string> = {
  'materiales': 'Materiales', 'mano-obra': 'Mano de Obra', 'herramienta': 'Herramienta', 'sub-contrato': 'Sub-Contrato',
  'administrativo': 'Administrativo', 'personal': 'Personal', 'transporte': 'Transporte', 'fijos': 'Gastos Fijos',
  'hogar': 'Hogar', 'aporte': 'Aporte', 'trabajos-extra': 'Trabajos Extra',
};

const PIE_COLORS = ['#1E3A8A', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#6366F1', '#14B8A6'];
const KPIColorMap: Record<string, string> = {
  emerald: 'from-emerald-500/90 to-emerald-600/90', blue: 'from-blue-600/90 to-blue-700/90',
  red: 'from-red-500/90 to-red-600/90', purple: 'from-purple-600/90 to-purple-700/90',
  pink: 'from-pink-600/90 to-pink-700/90', teal: 'from-teal-500/90 to-teal-600/90',
};

interface ChartDef {
  id: string; title: string; icon: React.ReactNode;
  span: string; height: string; render: () => React.ReactNode;
}

const FinancieroScreen: React.FC = () => {
  const { transacciones, presupuestos, proyectos, deleteTransaccion } = useAppContext();
  const proyeccion = useMemo(() => CoreEngineService.proyectarTendencia(transacciones), [transacciones]);
  const [filterTipo, setFilterTipo] = useState<'todos' | 'ingreso' | 'gasto'>('todos');
  const [filterCat, setFilterCat] = useState<string>('todos');
  const [filterProy, setFilterProy] = useState<string>('todos');
  const [pagina, setPagina] = useState(0);
  const [hiddenCharts, setHiddenCharts] = useState<Set<string>>(new Set());
  const [chartOrder, setChartOrder] = useState<string[][]>(() => {
    try {
      const saved = localStorage.getItem('fin_charts');
      return saved ? JSON.parse(saved) : [
        ['kpi', 'gastos-pie', 'comp-cat', 'operativos-admin', 'tendencia-gastos', 'acumulado-ing-gastos'],
        ['flujo-caja', 'proyecciones', 'proy-vs-real', 'ingresos-origen', 'distrib-operativos'],
        ['profit-report', 'margen-proy', 'evo-balance', 'radar-salud', 'gauge-eficiencia'],
      ];
    } catch { return [
      ['kpi', 'gastos-pie', 'comp-cat', 'operativos-admin', 'tendencia-gastos', 'acumulado-ing-gastos'],
      ['flujo-caja', 'proyecciones', 'proy-vs-real', 'ingresos-origen', 'distrib-operativos'],
      ['profit-report', 'margen-proy', 'evo-balance', 'radar-salud', 'gauge-eficiencia'],
    ]; }
  });

  useEffect(() => { localStorage.setItem('fin_charts', JSON.stringify(chartOrder)); }, [chartOrder]);

  const filtered = transacciones.filter(t => {
    if (filterTipo !== 'todos' && t.tipo !== filterTipo) return false;
    if (filterCat !== 'todos' && t.categoria !== filterCat) return false;
    if (filterProy !== 'todos' && t.proyectoId !== filterProy) return false;
    return true;
  });

  const stats = useMemo(() => {
    const ingresos = transacciones.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.costoTotal, 0);
    const gastos = transacciones.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.costoTotal, 0);
    const operativos = transacciones.filter(t => t.tipo === 'gasto' && ['materiales', 'mano-obra', 'herramienta', 'sub-contrato', 'transporte'].includes(t.categoria)).reduce((s, t) => s + t.costoTotal, 0);
    const administrativos = transacciones.filter(t => t.tipo === 'gasto' && ['administrativo', 'fijos'].includes(t.categoria)).reduce((s, t) => s + t.costoTotal, 0);
    const personales = transacciones.filter(t => t.tipo === 'gasto' && ['personal', 'hogar'].includes(t.categoria)).reduce((s, t) => s + t.costoTotal, 0);
    return { ingresos, gastos, operativos, administrativos, personales, balance: ingresos - gastos };
  }, [transacciones]);

  const porCategoria = useMemo(() => {
    const data: Record<string, number> = {};
    transacciones.filter(t => t.tipo === 'gasto').forEach(t => { data[t.categoria] = (data[t.categoria] || 0) + t.costoTotal; });
    return Object.entries(data).map(([k, v]) => ({ name: categoriaLabels[k] || k, value: v }));
  }, [transacciones]);

  const operativosAdmin = useMemo(() => {
    return [
      { name: 'Operativos', value: stats.operativos },
      { name: 'Administrativos', value: stats.administrativos },
      { name: 'Personales', value: stats.personales },
    ];
  }, [stats]);

  const tendenciaGastos = useMemo(() => {
    const map: Record<string, number> = {};
    transacciones.filter(t => t.tipo === 'gasto').forEach(t => {
      const mes = t.fecha?.slice(0, 7);
      if (mes) map[mes] = (map[mes] || 0) + t.costoTotal;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([mes, total]) => ({ mes, total }));
  }, [transacciones]);

  const flujoMensual = useMemo(() => {
    const map: Record<string, { ingresos: number; gastos: number }> = {};
    transacciones.forEach(t => {
      const mes = t.fecha?.slice(0, 7);
      if (!mes) return;
      if (!map[mes]) map[mes] = { ingresos: 0, gastos: 0 };
      if (t.tipo === 'ingreso') map[mes].ingresos += t.costoTotal;
      else map[mes].gastos += t.costoTotal;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([mes, v]) => ({ mes, ...v }));
  }, [transacciones]);

  const acumulado = useMemo(() => {
    let acumi = 0; let acumg = 0;
    return flujoMensual.map(d => { acumi += d.ingresos; acumg += d.gastos; return { ...d, acumi, acumg }; });
  }, [flujoMensual]);

  const ingresosPorOrigen = useMemo(() => {
    const map: Record<string, number> = {};
    transacciones.filter(t => t.tipo === 'ingreso').forEach(t => {
      const key = presupuestos.find(p => p.id === t.proyectoId)?.proyecto || 'Admin';
      map[key] = (map[key] || 0) + t.costoTotal;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [presupuestos, transacciones]);

  const distribOperativos = useMemo(() => {
    const cats = ['materiales', 'mano-obra', 'herramienta', 'sub-contrato', 'transporte'];
    const data = cats.map(c => ({ name: categoriaLabels[c], value: transacciones.filter(t => t.tipo === 'gasto' && t.categoria === c).reduce((s, t) => s + t.costoTotal, 0) }));
    return data.filter(d => d.value > 0);
  }, [transacciones]);

  const margenPorProyecto = useMemo(() => {
    return presupuestos.map(p => {
      const ing = transacciones.filter(t => t.proyectoId === p.id && t.tipo === 'ingreso').reduce((s, t) => s + t.costoTotal, 0);
      const gas = transacciones.filter(t => t.proyectoId === p.id && t.tipo === 'gasto').reduce((s, t) => s + t.costoTotal, 0);
      return { name: p.proyecto.slice(0, 14), margen: ing === 0 ? 0 : ((ing - gas) / ing) * 100, ingreso: ing, gasto: gas };
    });
  }, [presupuestos, transacciones]);

  const evoBalance = useMemo(() => {
    let bal = 0;
    return flujoMensual.map(d => { bal += d.ingresos - d.gastos; return { ...d, balance: bal }; });
  }, [flujoMensual]);

  const currentPageCharts = useMemo(() => chartOrder[pagina] || [], [chartOrder, pagina]);
  const totalPaginas = chartOrder.length;
  const visibleCharts = useMemo(() => currentPageCharts.filter(id => !hiddenCharts.has(id)), [currentPageCharts, hiddenCharts]);

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

  const saludFinanciera = useMemo(() => CoreEngineService.analizarSaludFinanciera(transacciones), [transacciones]);

  const chartDefinitions = useMemo((): Record<string, ChartDef> => ({
    'kpi': {
      id: 'kpi', title: 'KPIs', icon: <TrendingUp className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12', height: 'min-h-[90px]',
      render: () => (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-2">
          {[
            { icon: TrendingUp, label: 'Ingresos', value: fmtQ(stats.ingresos), color: 'emerald' },
            { icon: TrendingDown, label: 'Operativos', value: fmtQ(stats.operativos), color: 'blue' },
            { icon: Wallet, label: 'Admins.', value: fmtQ(stats.administrativos), color: 'purple' },
            { icon: Wallet, label: 'Personales', value: fmtQ(stats.personales), color: 'pink' },
            { icon: TrendingUp, label: 'Balance', value: fmtQ(stats.balance), color: stats.balance >= 0 ? 'teal' : 'red' },
          ].map((k, i) => (
            <div key={i} className={`bg-gradient-to-br ${KPIColorMap[k.color]} text-white rounded-xl p-3 shadow-md flex flex-col justify-center`}>
              <div className="flex items-center justify-between mb-1"><div className="p-1.5 rounded-lg bg-white/20"><k.icon className="w-3.5 h-3.5" /></div></div>
              <div className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">{k.label}</div>
              <div className="text-sm sm:text-base font-bold leading-tight mt-0.5">{k.value}</div>
            </div>
          ))}
        </div>
      ),
    },
    'gastos-pie': {
      id: 'gastos-pie', title: 'Gastos por Categoría', icon: <PieChartIcon className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 lg:col-span-5', height: 'min-h-[200px]',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={porCategoria} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} label={({ value }) => `${((value / stats.gastos) * 100).toFixed(0)}%`} labelLine={false}>
              {porCategoria.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v: number) => fmtQ(v)} />
            <Legend wrapperStyle={{ fontSize: 9 }} />
          </PieChart>
        </ResponsiveContainer>
      ),
    },
    'comp-cat': {
      id: 'comp-cat', title: 'Comparativa por Categoría', icon: <BarChart3 className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 lg:col-span-7', height: 'min-h-[200px]',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={porCategoria} margin={{ bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={80} />
            <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `Q${(v/1000).toFixed(0)}K`} />
            <Tooltip formatter={(v: number) => fmtQ(v)} />
            <Bar dataKey="value" fill="#1E3A8A" name="Total" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    'operativos-admin': {
      id: 'operativos-admin', title: 'Tipo de Gastos', icon: <Activity className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 sm:col-span-6 lg:col-span-4', height: 'min-h-[150px]',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={operativosAdmin} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 8 }} />
            <YAxis tick={{ fontSize: 8 }} />
            <Tooltip formatter={(v: number) => fmtQ(v)} />
            <Bar dataKey="value" radius={[2, 2, 0, 0]}>
              {operativosAdmin.map((_, i) => <Cell key={i} fill={[PIE_COLORS[0], PIE_COLORS[2], PIE_COLORS[6]][i]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    'tendencia-gastos': {
      id: 'tendencia-gastos', title: 'Tendencia Gastos Mensuales', icon: <LineChartIcon className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 sm:col-span-6 lg:col-span-4', height: 'min-h-[150px]',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={tendenciaGastos} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="mes" tick={{ fontSize: 8 }} />
            <YAxis tick={{ fontSize: 8 }} />
            <Line type="monotone" dataKey="total" stroke="#EF4444" strokeWidth={2} name="Gastos" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ),
    },
    'acumulado-ing-gastos': {
      id: 'acumulado-ing-gastos', title: 'Acumulado Ingresos vs Gastos', icon: <Target className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 sm:col-span-6 lg:col-span-4', height: 'min-h-[150px]',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={acumulado} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="mes" tick={{ fontSize: 8 }} />
            <YAxis tick={{ fontSize: 8 }} />
            <Area type="monotone" dataKey="acumi" stroke="#10B981" fill="#10B981" fillOpacity={0.2} name="Ingresos Acum." />
            <Area type="monotone" dataKey="acumg" stroke="#EF4444" fill="#EF4444" fillOpacity={0.2} name="Gastos Acum." />
          </AreaChart>
        </ResponsiveContainer>
      ),
    },
    'flujo-caja': {
      id: 'flujo-caja', title: 'Flujo de Caja Mensual', icon: <LineChartIcon className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 lg:col-span-7', height: 'min-h-[200px]',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={flujoMensual} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="mes" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `Q${(v/1000).toFixed(0)}K`} />
            <Tooltip formatter={(v: number) => fmtQ(v)} />
            <Legend wrapperStyle={{ fontSize: 9 }} />
            <Line type="monotone" dataKey="ingresos" stroke="#10B981" strokeWidth={2} name="Ingresos" />
            <Line type="monotone" dataKey="gastos" stroke="#EF4444" strokeWidth={2} name="Gastos" />
          </LineChart>
        </ResponsiveContainer>
      ),
    },
    'proyecciones': {
      id: 'proyecciones', title: 'Proyecciones', icon: <DollarSign className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 sm:col-span-6 lg:col-span-5', height: 'min-h-[200px]',
      render: () => (
        <div className="flex flex-col gap-2 p-3 h-full justify-center">
          {[
            { label: 'Proyección 30 Días', value: proyeccion.dias30, color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
            { label: 'Proyección 60 Días', value: proyeccion.dias60, color: 'bg-gradient-to-r from-indigo-500 to-indigo-600' },
            { label: 'Proyección 90 Días', value: proyeccion.dias90, color: 'bg-gradient-to-r from-purple-500 to-purple-600' },
          ].map((p, i) => (
            <div key={i} className={`${p.color} text-white rounded-xl p-3 shadow-md flex items-center justify-between`}>
              <span className="text-[10px] font-semibold uppercase opacity-90">{p.label}</span>
              <span className="text-lg font-bold">{fmtQ(p.value)}</span>
            </div>
          ))}
        </div>
      ),
    },
    'proy-vs-real': {
      id: 'proy-vs-real', title: 'Real vs Proyección', icon: <Activity className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 sm:col-span-6 lg:col-span-5', height: 'min-h-[150px]',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={[
            { name: '30d', real: flujoMensual.slice(-3).reduce((s, d) => s + d.ingresos, 0), proy: proyeccion.dias30 },
            { name: '60d', real: flujoMensual.slice(-6).reduce((s, d) => s + d.ingresos, 0), proy: proyeccion.dias60 },
            { name: '90d', real: flujoMensual.slice(-9).reduce((s, d) => s + d.ingresos, 0), proy: proyeccion.dias90 },
          ]} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} />
            <Tooltip formatter={(v: number) => fmtQ(v)} />
            <Legend wrapperStyle={{ fontSize: 9 }} />
            <Bar dataKey="real" fill="#10B981" name="Real" radius={[2, 2, 0, 0]} />
            <Bar dataKey="proy" fill="#3B82F6" name="Proyección" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    'ingresos-origen': {
      id: 'ingresos-origen', title: 'Ingresos por Origen', icon: <CreditCard className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 sm:col-span-6 lg:col-span-4', height: 'min-h-[150px]',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ingresosPorOrigen} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 8 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 8 }} width={70} />
            <Tooltip formatter={(v: number) => fmtQ(v)} />
            <Bar dataKey="value" fill="#10B981" radius={[0, 3, 3, 0]} name="Ingresos" />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    'distrib-operativos': {
      id: 'distrib-operativos', title: 'Distribución Operativos', icon: <PieChartIcon className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 sm:col-span-6 lg:col-span-4', height: 'min-h-[150px]',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={distribOperativos} cx="50%" cy="50%" innerRadius={25} outerRadius={55} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
              {distribOperativos.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v: number) => fmtQ(v)} />
          </PieChart>
        </ResponsiveContainer>
      ),
    },
    'profit-report': {
      id: 'profit-report', title: 'Profit Report', icon: <Target className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 lg:col-span-7', height: 'min-h-[220px]',
      render: () => <ProfitReport transacciones={transacciones} presupuestos={presupuestos} />,
    },
    'margen-proy': {
      id: 'margen-proy', title: 'Margen por Proyecto', icon: <Percent className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 sm:col-span-6 lg:col-span-5', height: 'min-h-[200px]',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={margenPorProyecto} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <XAxis type="number" domain={[-100, 100]} tick={{ fontSize: 8 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 8 }} width={70} />
            <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
            <Bar dataKey="margen" radius={[0, 3, 3, 0]} name="Margen %">
              {margenPorProyecto.map((_, i) => <Cell key={i} fill={margenPorProyecto[i].margen >= 0 ? '#10B981' : '#EF4444'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    'evo-balance': {
      id: 'evo-balance', title: 'Evolución del Balance', icon: <LineChartIcon className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 sm:col-span-6 lg:col-span-5', height: 'min-h-[160px]',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={evoBalance} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="mes" tick={{ fontSize: 8 }} />
            <YAxis tick={{ fontSize: 8 }} />
            <Line type="monotone" dataKey="balance" stroke="#8B5CF6" strokeWidth={2} name="Balance" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ),
    },
    'radar-salud': {
      id: 'radar-salud', title: 'Salud Financiera', icon: <Activity className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 sm:col-span-6 lg:col-span-4', height: 'min-h-[160px]',
      render: () => {
        const saludData = [
          { name: 'Ingresos', value: Math.max(0, Math.min(100, (stats.ingresos / (stats.gastos || 1)) * 50)), fill: '#10B981' },
          { name: 'Liquidez', value: Math.max(0, Math.min(100, (stats.balance / (stats.ingresos || 1)) * 50 + 50)), fill: '#3B82F6' },
          { name: 'Eficiencia', value: stats.gastos === 0 ? 100 : Math.max(0, Math.min(100, ((stats.ingresos - stats.operativos) / stats.ingresos) * 100)), fill: '#F59E0B' },
          { name: 'Cobertura', value: Math.max(0, Math.min(100, (stats.ingresos / (stats.personales + stats.administrativos || 1)) * 30)), fill: '#8B5CF6' },
        ];
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart cx="50%" cy="50%" innerRadius="15%" outerRadius="80%" barSize={14} data={saludData}>
              <RadialBar min={10} background dataKey="value" label={{ fontSize: 8, position: 'insideStart' }} />
            </RadialBarChart>
          </ResponsiveContainer>
        );
      },
    },
    'gauge-eficiencia': {
      id: 'gauge-eficiencia', title: 'Eficiencia de Gasto', icon: <Percent className="w-3.5 h-3.5 text-blue-700" />,
      span: 'col-span-12 sm:col-span-6 lg:col-span-4', height: 'min-h-[160px]',
      render: () => {
        const eficiencia = stats.gastos === 0 ? 100 : Math.max(0, Math.min(100, ((stats.ingresos - stats.gastos) / stats.ingresos) * 100 + 50));
        const color = eficiencia >= 50 ? '#10B981' : eficiencia >= 25 ? '#F59E0B' : '#EF4444';
        return (
          <div className="flex flex-col items-center justify-center h-full gap-1 p-2">
            <div className="relative w-24 h-24">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <circle cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="8" strokeDasharray={`${eficiencia * 3.39292} 339.292`} strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold" style={{ color }}>{eficiencia.toFixed(0)}%</span>
              </div>
            </div>
            <span className="text-[9px] text-muted-foreground text-center">{saludFinanciera.estado}</span>
            {saludFinanciera.alertas.slice(0, 1).map((a, i) => (
              <span key={i} className="text-[8px] text-muted-foreground text-center max-w-[140px] truncate">{a}</span>
            ))}
          </div>
        );
      },
    },
  }), [porCategoria, stats, operativosAdmin, tendenciaGastos, acumulado, flujoMensual, proyeccion, ingresosPorOrigen, distribOperativos, margenPorProyecto, evoBalance, saludFinanciera, presupuestos, transacciones]);

  return (
    <PageShell showHome={false} title="Control Financiero">
      <div className="h-dvh flex flex-col p-0.5 sm:p-2 md:p-3 overflow-hidden">
        {/* Navbar + Alertas */}
        <div className="shrink-0">
          {saludFinanciera.alertas.length > 0 && (
            <div className="space-y-0.5 mb-1">
              {saludFinanciera.alertas.slice(0, 2).map((a, i) => (
                <div key={i} className={`flex items-start gap-1.5 text-[10px] p-1.5 rounded ${
                  saludFinanciera.estado === 'critica' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  <span>{a}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
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
    </PageShell>
  );
};

export default FinancieroScreen;