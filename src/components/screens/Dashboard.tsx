import { PresupuestosService } from '@/services/presupuestos/PresupuestosService';
import { Skeleton } from '@/components/ui/skeleton/Skeleton';
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
  const { presupuestos, transacciones, loading } = useAppContext();
  const [pagina, setPagina] = useState(0);

  const stats = useMemo(() => {
    // ... (stats logic remains the same)
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

  const pieData = useMemo(() =>
    presupuestos.filter(p => p.fase === 'ejecución').map(p => ({ name: p.proyecto.slice(0, 16), value: p.total })),
    [presupuestos]
  );
  const COLORS = ['#1E3A8A', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const barData = useMemo(() =>
    presupuestos.filter(p => p.fase === 'ejecución').map(p => {
      const gastosReal = transacciones.filter(t => t.proyectoId === p.id && t.tipo === 'gasto').reduce((s, t) => s + t.costoTotal, 0);
      const desviacion = PresupuestosService.analizarDesviacion(p, gastosReal);
      return {
        name: p.proyecto.split(' ').slice(0, 2).join(' '),
        Avance: p.avanceFisico,
        Financiero: p.avanceFinanciero,
        desviacion: desviacion.nivelAlerta
      };
    }),
    [presupuestos, transacciones]
  );

  return (
    <PageShell showHome={false} title="Tablero Ejecutivo">
      <div className="p-3 sm:p-5 max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <button onClick={() => setPagina(0)} className={`p-2 rounded-lg ${pagina === 0 ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}><LayoutDashboard className="w-5 h-5"/></button>
            <button onClick={() => setPagina(1)} className={`p-2 rounded-lg ${pagina === 1 ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}><BarChart3 className="w-5 h-5"/></button>
          </div>
        </div>

        {loading ? <Skeleton className="h-[400px] w-full" /> : (
          pagina === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
              {kpiData.map((k, i) => (
                <KPI key={i} icon={k.icon} label={k.label} value={k.value} color={k.color} index={i} />
              ))}
            </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card rounded-xl p-4 h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="Financiero">
                          {barData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.desviacion === 'critico' ? '#EF4444' : entry.desviacion === 'advertencia' ? '#F59E0B' : '#10B981'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                </div>
             </div>
          )
        )}
      </div>
    </PageShell>
  );
};

export default Dashboard;
