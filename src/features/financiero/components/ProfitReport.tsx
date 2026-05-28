import React, { useMemo } from 'react';
import type { Transaccion, Presupuesto } from '@/types/supabase';
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, Building2, Users, AlertCircle, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, Legend } from 'recharts';
import { fmtQ } from '@/lib/exporters';
import { CoreEngineService } from '@/services/CoreEngineService';

const COLORS = {
  ingreso: '#10B981',
  gastoOp: '#1E3A8A',
  gastoAdm: '#F59E0B',
  gastoPers: '#EF4444',
  margen: '#8B5CF6',
};

const CAT_OPERATIVO = ['materiales', 'mano-obra', 'herramienta', 'sub-contrato', 'transporte'] as const;
const CAT_ADMIN = ['administrativo', 'fijos'] as const;
const CAT_PERSONAL = ['personal', 'hogar'] as const;

interface ProjectProfit {
  id: string;
  nombre: string;
  presupuesto: number;
  ingresos: number;
  gastosOperativos: number;
  gastosAdmin: number;
  margen: number;
  rentabilidad: number;
}

const ProfitReport: React.FC<{
  transacciones: Transaccion[];
  presupuestos: Presupuesto[];
}> = ({ transacciones, presupuestos }) => {
  const totals = useMemo(() => {
    const ingresos = transacciones.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.costoTotal, 0);
    const gastoOperativo = transacciones.filter(t => t.tipo === 'gasto' && CAT_OPERATIVO.includes(t.categoria as any)).reduce((s, t) => s + t.costoTotal, 0);
    const gastoAdmin = transacciones.filter(t => t.tipo === 'gasto' && CAT_ADMIN.includes(t.categoria as any)).reduce((s, t) => s + t.costoTotal, 0);
    const gastoPersonal = transacciones.filter(t => t.tipo === 'gasto' && CAT_PERSONAL.includes(t.categoria as any)).reduce((s, t) => s + t.costoTotal, 0);
    const gastoTotal = gastoOperativo + gastoAdmin + gastoPersonal;
    return { ingresos, gastoOperativo, gastoAdmin, gastoPersonal, gastoTotal, neto: ingresos - gastoTotal };
  }, [transacciones]);

  const proyectos = useMemo(() => {
    const activos = presupuestos.filter(p => p.fase === 'ejecución' || p.fase === 'finalizado');
    return activos.map<ProjectProfit>(p => {
      const txns = transacciones.filter(t => t.proyectoId === p.id);
      const ingresos = txns.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.costoTotal, 0);
      const gastosOperativos = txns.filter(t => t.tipo === 'gasto' && CAT_OPERATIVO.includes(t.categoria as any)).reduce((s, t) => s + t.costoTotal, 0);
      const gastosAdmin = txns.filter(t => t.tipo === 'gasto' && CAT_ADMIN.includes(t.categoria as any)).reduce((s, t) => s + t.costoTotal, 0);
      const margen = ingresos - gastosOperativos - gastosAdmin;
      const rentabilidad = p.total > 0 ? (margen / p.total) * 100 : 0;
      return { id: p.id, nombre: p.proyecto || '—', presupuesto: p.total, ingresos, gastosOperativos, gastosAdmin, margen, rentabilidad };
    }).sort((a, b) => b.margen - a.margen);
  }, [presupuestos, transacciones]);

  const chartData = useMemo(() => proyectos.map(p => ({
    name: p.nombre.length > 12 ? p.nombre.slice(0, 12) + '…' : p.nombre,
    Ingresos: p.ingresos,
    GastosOp: p.gastosOperativos,
    Margen: p.margen,
  })), [proyectos]);

  const salud = useMemo(() => CoreEngineService.analizarSaludFinanciera(transacciones), [transacciones]);

  return (
    <div className="space-y-5">
      {/* Alertas Proactivas de Control de Gastos Personales */}
      {salud.estado === 'critica' && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-xl flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-600 animate-bounce" />
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-red-900">🚨 Límite de Gasto Personal Excedido (Crítico)</h4>
            <p className="text-[11px] mt-1 text-red-700 leading-relaxed">
              Sus gastos personales acumulados (<strong>{fmtQ(salud.gastoPersonal)}</strong>) representan el <strong>{salud.ratioGastoPersonal.toFixed(1)}%</strong> de la utilidad bruta real de sus obras (<strong>{fmtQ(salud.utilidadBruta)}</strong>). 
              {salud.alertas[0]} Se recomienda encarecidamente suspender los retiros personales para proteger el capital de trabajo de los proyectos activos.
            </p>
          </div>
        </div>
      )}

      {salud.estado === 'advertencia' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-xl flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-yellow-600" />
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-yellow-900">⚠️ Advertencia de Gasto Personal Alto</h4>
            <p className="text-[11px] mt-1 text-yellow-700 leading-relaxed">
              Sus retiros personales representan el <strong>{salud.ratioGastoPersonal.toFixed(1)}%</strong> de la utilidad real de sus proyectos. 
              {salud.alertas[0]} Se encuentra en zona de advertencia (superior al 50%), aproximándose al límite de riesgo del 80%. Controle el flujo personal.
            </p>
          </div>
        </div>
      )}

      {/* KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-gradient-to-br from-emerald-500/90 to-emerald-600/90 text-white rounded-xl p-3 shadow-md">
          <TrendingUp className="w-4 h-4 mb-1 opacity-80" />
          <div className="text-[10px] uppercase tracking-wider opacity-80">Ingresos</div>
          <div className="text-sm sm:text-base font-bold">{fmtQ(totals.ingresos)}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-600/90 to-blue-700/90 text-white rounded-xl p-3 shadow-md">
          <Building2 className="w-4 h-4 mb-1 opacity-80" />
          <div className="text-[10px] uppercase tracking-wider opacity-80">Gastos Op.</div>
          <div className="text-sm sm:text-base font-bold">{fmtQ(totals.gastoOperativo)}</div>
        </div>
        <div className="bg-gradient-to-br from-amber-500/90 to-amber-600/90 text-white rounded-xl p-3 shadow-md">
          <DollarSign className="w-4 h-4 mb-1 opacity-80" />
          <div className="text-[10px] uppercase tracking-wider opacity-80">Gastos Admin.</div>
          <div className="text-sm sm:text-base font-bold">{fmtQ(totals.gastoAdmin)}</div>
        </div>
        <div className="bg-gradient-to-br from-red-500/90 to-red-600/90 text-white rounded-xl p-3 shadow-md">
          <Users className="w-4 h-4 mb-1 opacity-80" />
          <div className="text-[10px] uppercase tracking-wider opacity-80">Gastos Pers.</div>
          <div className="text-sm sm:text-base font-bold">{fmtQ(totals.gastoPersonal)}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-600/90 to-purple-700/90 text-white rounded-xl p-3 shadow-md">
          <PiggyBank className="w-4 h-4 mb-1 opacity-80" />
          <div className="text-[10px] uppercase tracking-wider opacity-80">Margen Bruto</div>
          <div className="text-sm sm:text-base font-bold">{fmtQ(salud.utilidadBruta)}</div>
        </div>
        <div className={`bg-gradient-to-br ${totals.neto >= 0 ? 'from-emerald-600/90 to-emerald-700/90' : 'from-red-600/90 to-red-700/90'} text-white rounded-xl p-3 shadow-md`}>
          <TrendingDown className="w-4 h-4 mb-1 opacity-80" />
          <div className="text-[10px] uppercase tracking-wider opacity-80">Neto Real</div>
          <div className={`text-sm sm:text-base font-bold ${totals.neto < 0 ? 'text-red-200' : ''}`}>
            {fmtQ(totals.neto)}
          </div>
        </div>
      </div>

      {/* Per-Project Profit Chart */}
      {chartData.length > 0 && (
        <div className="card-standard">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">Rentabilidad por Proyecto</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ background: '#1F2937', border: 'none', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#F3F4F6' }}
                  formatter={(v: number) => `$${v.toLocaleString()}`}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Ingresos" fill={COLORS.ingreso} radius={[4, 4, 0, 0]} />
                <Bar dataKey="GastosOp" fill={COLORS.gastoOp} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Margen" fill={COLORS.margen} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Per-Project Table */}
      <div className="card-standard !p-0 overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-card-foreground">Detalle por Proyecto</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted text-muted-foreground">
                <th className="text-left p-3 font-medium">Proyecto</th>
                <th className="text-right p-3 font-medium">Presupuesto</th>
                <th className="text-right p-3 font-medium">Ingresos</th>
                <th className="text-right p-3 font-medium">Gastos Op.</th>
                <th className="text-right p-3 font-medium">Gastos Adm.</th>
                <th className="text-right p-3 font-medium">Margen</th>
                <th className="text-right p-3 font-medium">Rentab.</th>
              </tr>
            </thead>
            <tbody>
              {proyectos.map(p => (
                <tr key={p.id} className="border-t border-border/50 hover:bg-accent">
                  <td className="p-3 font-medium text-card-foreground">{p.nombre}</td>
                  <td className="p-3 text-right text-muted-foreground">${p.presupuesto.toLocaleString()}</td>
                  <td className="p-3 text-right text-emerald-600 dark:text-emerald-400">${p.ingresos.toLocaleString()}</td>
                  <td className="p-3 text-right text-blue-600 dark:text-blue-400">${p.gastosOperativos.toLocaleString()}</td>
                  <td className="p-3 text-right text-amber-600 dark:text-amber-400">${p.gastosAdmin.toLocaleString()}</td>
                  <td className={`p-3 text-right font-semibold ${p.margen >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    ${p.margen.toLocaleString()}
                  </td>
                  <td className={`p-3 text-right font-semibold ${p.rentabilidad >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {p.rentabilidad.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumen */}
      <div className="card-standard">
        <h3 className="text-sm font-semibold text-card-foreground mb-3">Resumen de Rentabilidad</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="card-section">
            <div className="text-muted-foreground mb-1">Ingresos Totales</div>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{fmtQ(totals.ingresos)}</div>
          </div>
          <div className="card-section">
            <div className="text-muted-foreground mb-1">Gastos Operativos</div>
            <div className="text-sm font-bold text-blue-600 dark:text-blue-400">{fmtQ(totals.gastoOperativo)}</div>
          </div>
          <div className="card-section">
            <div className="text-muted-foreground mb-1">Gastos Administrativos</div>
            <div className="text-sm font-bold text-amber-600 dark:text-amber-400">{fmtQ(totals.gastoAdmin)}</div>
          </div>
          <div className="card-section">
            <div className="text-muted-foreground mb-1">Gastos Personales</div>
            <div className="text-sm font-bold text-red-600 dark:text-red-400">{fmtQ(totals.gastoPersonal)}</div>
          </div>
          <div className="card-section col-span-2">
            <div className="text-muted-foreground mb-1">Margen Bruto (Ingresos - Gastos Op. - Gastos Adm.)</div>
            <div className="text-sm font-bold text-purple-600 dark:text-purple-400">
              {fmtQ(salud.utilidadBruta)}
            </div>
          </div>
          <div className={`p-3 rounded-lg col-span-2 ${totals.neto >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
            <div className={`mb-1 ${totals.neto >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              Ganancia / Pérdida Real (Ingresos - Todos los Gastos)
            </div>
            <div className={`text-base font-bold ${totals.neto >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
              {fmtQ(totals.neto)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitReport;
