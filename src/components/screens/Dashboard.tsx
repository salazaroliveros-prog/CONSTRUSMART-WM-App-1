import React, { useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { ViewType } from '@/types/supabase';
import Header from '@/components/shared/Header';
import Calendar from '@/components/shared/Calendar';
import TransactionForm from '@/components/shared/TransactionForm';
import HealthIndicator from '@/components/shared/HealthIndicator';
import ProjectHeatMap from '@/components/shared/ProjectHeatMap';
import ProjectTimeline from '@/components/shared/ProjectTimeline';
import RealtimeFeed from '@/components/shared/RealtimeFeed';
import GanttView from '@/components/shared/GanttView';
import CashFlowProjection from '@/components/shared/CashFlowProjection';
import { Users, FolderKanban, Calculator, LineChart, Wallet, TrendingUp, TrendingDown, DollarSign, Folder, Percent, FileDown, Shield } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, AreaChart, Area } from 'recharts';
import { exportCompleto } from '@/utils/exportExcel';

const Dashboard: React.FC = () => {
  const { setView, presupuestos, transacciones, clientes } = useAppContext();

  const stats = useMemo(() => {
    const ingresos = transacciones.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.costoTotal, 0);
    const gastos = transacciones.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.costoTotal, 0);
    const activos = presupuestos.filter(p => p.fase === 'ejecución').length;
    const planeacion = presupuestos.filter(p => p.fase === 'planeación').length;
    const finalizados = presupuestos.filter(p => p.fase === 'finalizado').length;
    const avancePromedio = presupuestos.filter(p => p.fase === 'ejecución').reduce((s, p) => s + p.avanceFisico, 0) / (activos || 1);
    const pendiente = presupuestos.reduce((s, p) => s + p.pendienteAportar, 0);
    const totalPresupuestos = presupuestos.reduce((s, p) => s + p.total, 0);
    const totalIngresosProyectos = presupuestos.reduce((s, p) => s + p.ingresos, 0);
    const totalGastosProyectos = presupuestos.reduce((s, p) => s + p.gastos, 0);
    const rentabilidadGeneral = totalIngresosProyectos > 0 ? ((totalIngresosProyectos - totalGastosProyectos) / totalIngresosProyectos * 100) : 0;
    return { ingresos, gastos, activos, planeacion, finalizados, avancePromedio, pendiente, margen: ingresos - gastos, totalPresupuestos, rentabilidadGeneral };
  }, [transacciones, presupuestos]);

  const pieData = presupuestos.filter(p => p.fase === 'ejecución').map(p => ({ name: p.proyecto.slice(0, 16), value: p.total }));
  const COLORS = ['#1E3A8A', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const barData = presupuestos.filter(p => p.fase === 'ejecución').map(p => ({
    name: p.proyecto.split(' ').slice(0, 2).join(' '),
    Avance: p.avanceFisico,
    Financiero: p.avanceFinanciero,
  }));

  const rentabilidadData = presupuestos.filter(p => p.fase === 'ejecución' || p.fase === 'finalizado').map(p => ({
    name: p.proyecto.split(' ').slice(0, 2).join(' '),
    Rentabilidad: p.total > 0 ? ((p.ingresos - p.gastos) / p.total * 100) : 0,
  }));

  const modules = [
    { id: 'clientes', label: 'Clientes', icon: Users, color: 'from-purple-600 to-purple-800', desc: `${clientes.length} registrados` },
    { id: 'presupuesto', label: 'Presupuestos', icon: Calculator, color: 'from-blue-600 to-blue-800', desc: 'Motor APU' },
    { id: 'proyectos', label: 'Proyectos', icon: Folder, color: 'from-cyan-600 to-cyan-800', desc: `${stats.activos} activos` },
    { id: 'seguimiento', label: 'Seguimiento', icon: LineChart, color: 'from-emerald-600 to-emerald-800', desc: 'Cashflow' },
    { id: 'financiero', label: 'Control Financiero', icon: Wallet, color: 'from-amber-600 to-amber-800', desc: 'Planilla' },
    { id: 'equipos', label: 'Equipos', icon: Shield, color: 'from-rose-600 to-rose-800', desc: 'Colaboración' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header showHome={false} title="Tablero Ejecutivo" />

      <div className="flex-1 p-2 sm:p-3 grid grid-cols-12 gap-2 max-w-[1600px] mx-auto w-full">
        {/* Fila 1: Salud + KPIs compactos */}
        <div className="col-span-12 grid grid-cols-12 gap-2">
          <div className="col-span-12 sm:col-span-3">
            <HealthIndicator rentabilidad={stats.rentabilidadGeneral} proyectosActivos={stats.activos} deuda={stats.gastos - stats.ingresos} />
          </div>
          {[
            { icon: TrendingUp, label: 'Ingresos', value: `Q${(stats.ingresos / 1000).toFixed(1)}K`, color: 'emerald' },
            { icon: TrendingDown, label: 'Gastos', value: `Q${(stats.gastos / 1000).toFixed(1)}K`, color: 'red' },
            { icon: DollarSign, label: 'Margen', value: `Q${(stats.margen / 1000).toFixed(1)}K`, color: stats.margen >= 0 ? 'blue' : 'red' },
            { icon: Percent, label: 'Rentabilidad', value: `${stats.rentabilidadGeneral.toFixed(1)}%`, color: stats.rentabilidadGeneral >= 10 ? 'emerald' : stats.rentabilidadGeneral >= 0 ? 'amber' : 'red' },
            { icon: FolderKanban, label: 'Activos', value: String(stats.activos), color: 'indigo' },
            { icon: FolderKanban, label: 'Planeación', value: String(stats.planeacion), color: 'purple' },
            { icon: FolderKanban, label: 'Finalizados', value: String(stats.finalizados), color: 'teal' },
            { icon: DollarSign, label: 'Pendiente', value: `Q${(stats.pendiente / 1000).toFixed(0)}K`, color: 'amber' },
          ].map((k, i) => (
            <div key={i} className="col-span-3 sm:col-span-1">
              <CompactKPI icon={k.icon} label={k.label} value={k.value} color={k.color as 'emerald' | 'red' | 'blue' | 'indigo' | 'purple' | 'amber' | 'teal'} />
            </div>
          ))}
        </div>

        {/* Fila 2: Módulos + Calendario */}
        <div className="col-span-12 lg:col-span-8 grid grid-cols-3 sm:grid-cols-6 gap-2">
          {modules.map(m => (
            <button key={m.id} onClick={() => setView(m.id as ViewType)}
              className={`bg-gradient-to-br ${m.color} text-white p-3 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left group btn-press`}>
              <m.icon className="w-5 h-5 mb-1 opacity-90 group-hover:scale-110 transition" />
              <div className="font-bold text-[11px] leading-tight">{m.label}</div>
              <div className="text-[9px] opacity-70 mt-0.5">{m.desc}</div>
            </button>
          ))}
          <button onClick={() => exportCompleto(presupuestos, transacciones, clientes)}
            className="flex flex-col items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 p-3 rounded-xl shadow-sm btn-press transition">
            <FileDown className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-semibold">Exportar</span>
          </button>
        </div>

        <div className="col-span-12 lg:col-span-4 lg:row-span-4 space-y-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2">
            <Calendar />
          </div>
          <GanttView />
        </div>

        {/* Fila 3: Charts */}
        <div className="col-span-12 lg:col-span-4">
          <CashFlowProjection />
        </div>

        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl shadow-sm border border-slate-200 p-2 card-hover">
          <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Distribución</h3>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={45} innerRadius={25} paddingAngle={2}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `Q ${v.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl shadow-sm border border-slate-200 p-2 card-hover">
          <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Rentabilidad x Proyecto</h3>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={rentabilidadData} margin={{ top: 2, right: 2, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 8 }} />
              <YAxis tick={{ fontSize: 8 }} domain={[-100, 100]} />
              <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
              <Bar dataKey="Rentabilidad" fill="#8B5CF6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fila 4: Heat Map + Timeline + Avance */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-xl shadow-sm border border-slate-200 p-2 card-hover">
          <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Rentabilidad por Proyecto</h3>
          <ProjectHeatMap />
        </div>

        <div className="col-span-12 lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 p-2 card-hover">
          <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Timeline</h3>
          <ProjectTimeline />
        </div>

        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl shadow-sm border border-slate-200 p-2 card-hover">
          <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Avance vs Financiero</h3>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={barData} margin={{ top: 2, right: 2, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 8 }} />
              <YAxis tick={{ fontSize: 8 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 9 }} />
              <Bar dataKey="Avance" fill="#1E3A8A" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Financiero" fill="#10B981" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fila 5: Actividad + Transaction form */}
        <div className="col-span-12 lg:col-span-4">
          <RealtimeFeed />
        </div>
        <div className="col-span-12 lg:col-span-8">
          <TransactionForm />
        </div>
      </div>
    </div>
  );
};

const CompactKPI: React.FC<{ icon: React.ComponentType<{ className?: string }>; label: string; value: string; color: 'emerald' | 'red' | 'blue' | 'indigo' | 'purple' | 'amber' | 'teal' }> = ({ icon: Icon, label, value, color }) => {
  const colors: Record<string, string> = {
    emerald: 'from-emerald-500 to-emerald-600 text-emerald-50',
    red: 'from-red-500 to-red-600 text-red-50',
    blue: 'from-blue-600 to-blue-700 text-blue-50',
    indigo: 'from-indigo-500 to-indigo-600 text-indigo-50',
    purple: 'from-purple-500 to-purple-600 text-purple-50',
    amber: 'from-amber-500 to-amber-600 text-amber-50',
    teal: 'from-teal-500 to-teal-600 text-teal-50',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-lg p-2 shadow-sm`}>
      <div className="flex items-center justify-between">
        <Icon className="w-3 h-3 opacity-80" />
      </div>
      <div className="text-[9px] uppercase tracking-wider opacity-80 font-semibold leading-tight mt-0.5">{label}</div>
      <div className="text-xs font-bold leading-tight">{value}</div>
    </div>
  );
};

export default Dashboard;
