import React, { useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import Header from '@/components/shared/Header';
import Calendar from '@/components/shared/Calendar';
import TransactionForm from '@/components/shared/TransactionForm';
import { Users, FolderKanban, Calculator, Wallet, TrendingUp, TrendingDown, DollarSign, Folder, Percent, Shield } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

type KPIColor = 'emerald' | 'red' | 'blue' | 'indigo' | 'purple' | 'amber' | 'teal';

const CompactKPI: React.FC<{ icon: React.ComponentType<{ className?: string }>; label: string; value: string; color: KPIColor }> = ({ icon: Icon, label, value, color }) => {
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

const Dashboard: React.FC = () => {
  const { presupuestos, transacciones } = useAppContext();

  const stats = useMemo(() => {
    const ingresos = transacciones.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.costoTotal, 0);
    const gastos = transacciones.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.costoTotal, 0);
    const activos = presupuestos.filter(p => p.fase === 'ejecución').length;
    const planeacion = presupuestos.filter(p => p.fase === 'planeación').length;
    const finalizados = presupuestos.filter(p => p.fase === 'finalizado').length;
    const pendiente = presupuestos.reduce((s, p) => s + p.pendienteAportar, 0);
    const totalIngresosProyectos = presupuestos.reduce((s, p) => s + p.ingresos, 0);
    const totalGastosProyectos = presupuestos.reduce((s, p) => s + p.gastos, 0);
    const rentabilidadGeneral = totalIngresosProyectos > 0 ? ((totalIngresosProyectos - totalGastosProyectos) / totalIngresosProyectos * 100) : 0;
    return { ingresos, gastos, activos, planeacion, finalizados, pendiente, margen: ingresos - gastos, rentabilidadGeneral };
  }, [transacciones, presupuestos]);

  const pieData = presupuestos.filter(p => p.fase === 'ejecución').map(p => ({ name: p.proyecto.slice(0, 16), value: p.total }));
  const COLORS = ['#1E3A8A', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const barData = presupuestos.filter(p => p.fase === 'ejecución').map(p => ({
    name: p.proyecto.split(' ').slice(0, 2).join(' '),
    Avance: p.avanceFisico,
    Financiero: p.avanceFinanciero,
  }));

  const kpiData: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; color: KPIColor }[] = [
    { icon: TrendingUp, label: 'Ingresos', value: `Q${(stats.ingresos / 1000).toFixed(1)}K`, color: 'emerald' },
    { icon: TrendingDown, label: 'Gastos', value: `Q${(stats.gastos / 1000).toFixed(1)}K`, color: 'red' },
    { icon: DollarSign, label: 'Margen', value: `Q${(stats.margen / 1000).toFixed(1)}K`, color: stats.margen >= 0 ? 'blue' : 'red' },
    { icon: Percent, label: 'Rentabilidad', value: `${stats.rentabilidadGeneral.toFixed(1)}%`, color: stats.rentabilidadGeneral >= 10 ? 'emerald' : 'amber' },
    { icon: FolderKanban, label: 'Activos', value: String(stats.activos), color: 'indigo' },
    { icon: FolderKanban, label: 'Planeación', value: String(stats.planeacion), color: 'purple' },
    { icon: FolderKanban, label: 'Finalizados', value: String(stats.finalizados), color: 'teal' },
    { icon: DollarSign, label: 'Pendiente', value: `Q${(stats.pendiente / 1000).toFixed(0)}K`, color: 'amber' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 overflow-hidden">
      <Header showHome={false} title="Tablero Ejecutivo" />
      <div className="flex-1 overflow-y-auto w-full">
        <div className="w-full mx-auto">
          {/* KPI Grid - Responsive */}
          <div className="p-2 sm:p-3 md:p-4">
            <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1 sm:gap-2">
              {kpiData.map((k, i) => (
                <div key={i}>
                  <CompactKPI icon={k.icon} label={k.label} value={k.value} color={k.color} />
                </div>
              ))}
            </div>
          </div>

          {/* Main Content - Responsive Layout */}
          <div className="p-2 sm:p-3 md:p-4 space-y-3 md:space-y-4">
            {/* Mobile/Tablet Stack - Desktop Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {/* Charts Section - spans 2 cols on desktop */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {/* Pie Chart */}
                <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 flex flex-col h-64 sm:h-72 md:h-80">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-600 uppercase mb-2">Distribución</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={Math.min(40, 60)} innerRadius={Math.min(20, 30)} paddingAngle={2}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => `Q ${v.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Bar Chart */}
                <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 flex flex-col h-64 sm:h-72 md:h-80">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-600 uppercase mb-2">Avance vs Financiero</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="Avance" fill="#1E3A8A" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="Financiero" fill="#10B981" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Transaction Form - Full width on mobile */}
                <div className="sm:col-span-2 bg-white rounded-lg shadow-sm p-3 sm:p-4">
                  <TransactionForm compact />
                </div>
              </div>

              {/* Sidebar - Stacks on mobile */}
              <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 h-auto md:h-auto">
                <h3 className="text-xs sm:text-sm font-bold text-slate-600 uppercase mb-3">Calendario</h3>
                <div className="w-full">
                  <Calendar />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
