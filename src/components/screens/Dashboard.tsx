import React, { useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { ViewType } from '@/types/supabase';
import Header from '@/components/shared/Header';
import Calendar from '@/components/shared/Calendar';
import TransactionForm from '@/components/shared/TransactionForm';
import { Users, FolderKanban, Calculator, LineChart, Wallet, TrendingUp, TrendingDown, DollarSign, Folder, Percent, Shield } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

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
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <Header showHome={false} title="Tablero Ejecutivo" />

      <div className="flex-1 p-2 grid grid-cols-12 gap-2 max-w-[1600px] mx-auto w-full overflow-hidden">
        {/* Fila 1: KPIs compactos */}
        <div className="col-span-12 grid grid-cols-8 gap-1 h-16">
          {[
            { icon: TrendingUp, label: 'Ingresos', value: `Q${(stats.ingresos / 1000).toFixed(1)}K`, color: 'emerald' },
            { icon: TrendingDown, label: 'Gastos', value: `Q${(stats.gastos / 1000).toFixed(1)}K`, color: 'red' },
            { icon: DollarSign, label: 'Margen', value: `Q${(stats.margen / 1000).toFixed(1)}K`, color: stats.margen >= 0 ? 'blue' : 'red' },
            { icon: Percent, label: 'Rentabilidad', value: `${stats.rentabilidadGeneral.toFixed(1)}%`, color: stats.rentabilidadGeneral >= 10 ? 'emerald' : 'amber' },
            { icon: FolderKanban, label: 'Activos', value: String(stats.activos), color: 'indigo' },
            { icon: FolderKanban, label: 'Planeación', value: String(stats.planeacion), color: 'purple' },
            { icon: FolderKanban, label: 'Finalizados', value: String(stats.finalizados), color: 'teal' },
            { icon: DollarSign, label: 'Pendiente', value: `Q${(stats.pendiente / 1000).toFixed(0)}K`, color: 'amber' },
          ].map((k, i) => (
            <div key={i} className="col-span-1">
              <CompactKPI icon={k.icon} label={k.label} value={k.value} color={k.color as any} />
            </div>
          ))}
        </div>

        {/* Fila 2: Área Principal de Gráficas e Interacción (sin scroll) */}
        <div className="col-span-12 grid grid-cols-3 gap-2 flex-1 min-h-0">
          <div className="col-span-2 grid grid-cols-2 gap-2">
            <div className="bg-white rounded-lg shadow-sm p-2 flex flex-col min-h-0">
              <h3 className="text-[10px] font-bold text-slate-600 uppercase">Distribución</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={40} innerRadius={20} paddingAngle={2}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `Q ${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-2 flex flex-col min-h-0">
              <h3 className="text-[10px] font-bold text-slate-600 uppercase">Avance vs Financiero</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 8 }} />
                  <Tooltip />
                  <Bar dataKey="Avance" fill="#1E3A8A" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Financiero" fill="#10B981" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="col-span-2 bg-white rounded-lg shadow-sm p-2 flex flex-col min-h-0">
                <TransactionForm compact />
            </div>
          </div>
          
          <div className="col-span-1 bg-white rounded-lg shadow-sm p-2 flex flex-col min-h-0">
            <h3 className="text-[10px] font-bold text-slate-600 uppercase">Calendario</h3>
            <div className="flex-1 overflow-hidden">
                <Calendar />
            </div>
          </div>
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
