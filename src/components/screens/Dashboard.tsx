import React, { useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import Header from '@/components/shared/Header';
import Calendar from '@/components/shared/Calendar';
import TransactionForm from '@/components/shared/TransactionForm';
import { Users, FolderKanban, Calculator, LineChart, Wallet, TrendingUp, TrendingDown, AlertCircle, Briefcase, DollarSign } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';


const Dashboard: React.FC = () => {
  const { setView, proyectos, transacciones, clientes } = useAppContext();

  const stats = useMemo(() => {
    const ingresos = transacciones.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.costoTotal, 0);
    const gastos = transacciones.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.costoTotal, 0);
    const activos = proyectos.filter(p => p.estado === 'Ejecución').length;
    const planeacion = proyectos.filter(p => p.estado === 'Planeación').length;
    const avancePromedio = proyectos.filter(p => p.estado === 'Ejecución').reduce((s, p) => s + p.avanceFisico, 0) / (activos || 1);
    const pendiente = proyectos.reduce((s, p) => s + p.pendienteAportar, 0);
    return { ingresos, gastos, activos, planeacion, avancePromedio, pendiente, margen: ingresos - gastos };
  }, [transacciones, proyectos]);

  const pieData = proyectos.filter(p => p.estado === 'Ejecución').map(p => ({ name: p.nombre.slice(0, 18), value: p.presupuestoTotal }));
  const COLORS = ['#1E3A8A', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const barData = proyectos.map(p => ({
    name: p.nombre.split(' ').slice(0, 2).join(' '),
    Avance: p.avanceFisico,
    Financiero: p.avanceFinanciero,
  }));

  const radialData = [
    { name: 'Avance', value: Math.round(stats.avancePromedio), fill: '#10B981' },
  ];

  const modules: { id: string; label: string; icon: React.ComponentType<{ className?: string }>; color: string; desc: string }[] = [
    { id: 'clientes', label: 'Clientes', icon: Users, color: 'from-purple-600 to-purple-800', desc: `${clientes.length} registrados` },
    { id: 'presupuesto', label: 'Presupuestos', icon: Calculator, color: 'from-blue-600 to-blue-800', desc: 'Motor APU' },
    { id: 'seguimiento', label: 'Seguimiento', icon: LineChart, color: 'from-emerald-600 to-emerald-800', desc: `${stats.activos} en ejecución` },
    { id: 'financiero', label: 'Control Financiero', icon: Wallet, color: 'from-amber-600 to-amber-800', desc: 'Planilla y gastos' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-fadeIn">
      <Header showHome={false} title="Tablero Principal" />

      <div className="flex-1 p-3 sm:p-4 grid grid-cols-12 gap-3 max-w-[1600px] mx-auto w-full">
        {/* KPIs */}
        <div className="col-span-12 grid grid-cols-2 lg:grid-cols-6 gap-3">
          <KPI icon={TrendingUp} label="Ingresos" value={`Q ${(stats.ingresos / 1000).toFixed(1)}K`} color="emerald" />
          <KPI icon={TrendingDown} label="Gastos" value={`Q ${(stats.gastos / 1000).toFixed(1)}K`} color="red" />
          <KPI icon={DollarSign} label="Margen" value={`Q ${(stats.margen / 1000).toFixed(1)}K`} color="blue" />
          <KPI icon={Briefcase} label="Activos" value={String(stats.activos)} color="indigo" />
          <KPI icon={FolderKanban} label="Planeación" value={String(stats.planeacion)} color="purple" />
          <KPI icon={AlertCircle} label="Pendiente" value={`Q ${(stats.pendiente / 1000).toFixed(0)}K`} color="amber" />
        </div>

        {/* Module buttons */}
        <div className="col-span-12 lg:col-span-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {modules.map(m => (
            <button
              key={m.id}
              onClick={() => setView(m.id)}
              className={`bg-gradient-to-br ${m.color} text-white p-4 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left group`}
            >
              <m.icon className="w-7 h-7 mb-2 opacity-90 group-hover:scale-110 transition" />
              <div className="font-bold text-sm">{m.label}</div>
              <div className="text-[10px] opacity-80 mt-0.5">{m.desc}</div>
            </button>
          ))}
        </div>

        {/* Calendar */}
        <div className="col-span-12 lg:col-span-4 lg:row-span-3">
          <Calendar />
        </div>

        {/* Charts row */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl shadow-md border border-slate-200 p-3">
          <h3 className="text-xs font-bold text-slate-700 mb-1">Distribución de Presupuestos</h3>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={55} innerRadius={30} paddingAngle={2}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `Q ${v.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl shadow-md border border-slate-200 p-3">
          <h3 className="text-xs font-bold text-slate-700 mb-1">Avance por Proyecto (%)</h3>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={barData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="Avance" fill="#1E3A8A" />
              <Bar dataKey="Financiero" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Transaction form */}
        <div className="col-span-12 lg:col-span-8">
          <TransactionForm />
        </div>
      </div>
    </div>
  );
};

const KPI: React.FC<{ icon: React.ComponentType<{ className?: string }>; label: string; value: string; color: string }> = ({ icon: Icon, label, value, color }) => {
  const colors: Record<string, string> = {
    emerald: 'from-emerald-500 to-emerald-600 text-emerald-50',
    red: 'from-red-500 to-red-600 text-red-50',
    blue: 'from-blue-600 to-blue-700 text-blue-50',
    indigo: 'from-indigo-500 to-indigo-600 text-indigo-50',
    purple: 'from-purple-500 to-purple-600 text-purple-50',
    amber: 'from-amber-500 to-amber-600 text-amber-50',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-3 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5`}>
      <div className="flex items-center justify-between mb-1">
        <Icon className="w-4 h-4 opacity-80" />
        <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse"></div>
      </div>
      <div className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">{label}</div>
      <div className="text-lg font-bold leading-tight mt-0.5">{value}</div>
    </div>
  );
};

export default Dashboard;
