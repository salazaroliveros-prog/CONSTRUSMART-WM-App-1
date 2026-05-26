import React, { useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import PageShell from '@/components/shared/PageShell';
import Calendar from '@/components/shared/Calendar';
import TransactionForm from '@/components/shared/TransactionForm';
import { Users, FolderKanban, Calculator, Wallet, TrendingUp, TrendingDown, DollarSign, Percent, Shield } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

type KPIColor = 'emerald' | 'red' | 'blue' | 'indigo' | 'purple' | 'amber' | 'teal';

const KPI: React.FC<{ icon: React.ComponentType<{ className?: string }>; label: string; value: string; color: KPIColor; index: number }> = ({ icon: Icon, label, value, color, index }) => {
  const colors: Record<string, string> = {
    emerald: 'from-emerald-500/90 to-emerald-600/90 text-emerald-50',
    red: 'from-red-500/90 to-red-600/90 text-red-50',
    blue: 'from-blue-600/90 to-blue-700/90 text-blue-50',
    indigo: 'from-indigo-500/90 to-indigo-600/90 text-indigo-50',
    purple: 'from-purple-500/90 to-purple-600/90 text-purple-50',
    amber: 'from-amber-500/90 to-amber-600/90 text-amber-50',
    teal: 'from-teal-500/90 to-teal-600/90 text-teal-50',
  };
  return (
    <div
      className={`bg-gradient-to-br ${colors[color]} rounded-xl p-3 shadow-md shadow-${color}-500/10 card-hover`}
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="p-1.5 rounded-lg bg-white/20">
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">{label}</div>
      <div className="text-sm sm:text-base font-bold leading-tight mt-0.5">{value}</div>
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
    const ingresosPorProyecto: Record<string, number> = {};
    transacciones.filter(t => t.tipo === 'ingreso').forEach(t => {
      ingresosPorProyecto[t.proyectoId] = (ingresosPorProyecto[t.proyectoId] || 0) + t.costoTotal;
    });
    const pendiente = presupuestos.reduce((s, p) => {
      const recibido = ingresosPorProyecto[p.id] || 0;
      return s + Math.max(0, (p.total || 0) - recibido);
    }, 0);
    const rentabilidadGeneral = ingresos > 0 ? ((ingresos - gastos) / ingresos * 100) : 0;
    return { ingresos, gastos, activos, planeacion, finalizados, pendiente, margen: ingresos - gastos, rentabilidadGeneral };
  }, [transacciones, presupuestos]);

  const pieData = useMemo(() =>
    presupuestos.filter(p => p.fase === 'ejecución').map(p => ({ name: p.proyecto.slice(0, 16), value: p.total })),
    [presupuestos]
  );
  const COLORS = ['#1E3A8A', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const barData = useMemo(() =>
    presupuestos.filter(p => p.fase === 'ejecución').map(p => ({
      name: p.proyecto.split(' ').slice(0, 2).join(' '),
      Avance: p.avanceFisico,
      Financiero: p.avanceFinanciero,
    })),
    [presupuestos]
  );

  const kpiData = useMemo(() => [
    { icon: TrendingUp, label: 'Ingresos', value: `Q${(stats.ingresos / 1000).toFixed(1)}K`, color: 'emerald' as KPIColor },
    { icon: TrendingDown, label: 'Gastos', value: `Q${(stats.gastos / 1000).toFixed(1)}K`, color: 'red' as KPIColor },
    { icon: DollarSign, label: 'Margen', value: `Q${(stats.margen / 1000).toFixed(1)}K`, color: stats.margen >= 0 ? 'blue' as KPIColor : 'red' as KPIColor },
    { icon: Percent, label: 'Rentabilidad', value: `${stats.rentabilidadGeneral.toFixed(1)}%`, color: stats.rentabilidadGeneral >= 10 ? 'emerald' as KPIColor : 'amber' as KPIColor },
    { icon: FolderKanban, label: 'Activos', value: String(stats.activos), color: 'indigo' as KPIColor },
    { icon: FolderKanban, label: 'Planeación', value: String(stats.planeacion), color: 'purple' as KPIColor },
    { icon: FolderKanban, label: 'Finalizados', value: String(stats.finalizados), color: 'teal' as KPIColor },
    { icon: DollarSign, label: 'Pendiente', value: `Q${(stats.pendiente / 1000).toFixed(0)}K`, color: 'amber' as KPIColor },
  ], [stats]);

  return (
    <PageShell showHome={false} title="Tablero Ejecutivo">
      <div className="p-3 sm:p-4 md:p-5 max-w-[1600px] mx-auto space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3 stagger-children">
          {kpiData.map((k, i) => (
            <KPI key={i} icon={k.icon} label={k.label} value={k.value} color={k.color} index={i} />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card rounded-xl p-4 flex flex-col h-72 sm:h-80 card-hover">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Distribución</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} innerRadius={25} paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `Q ${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card rounded-xl p-4 flex flex-col h-72 sm:h-80 card-hover">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Avance vs Financiero</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="Avance" fill="#1E3A8A" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Financiero" fill="#10B981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="sm:col-span-2 glass-card rounded-xl p-4 card-hover">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Registro Rápido</h3>
              <TransactionForm compact />
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 card-hover">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Calendario</h3>
            <Calendar />
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default Dashboard;
