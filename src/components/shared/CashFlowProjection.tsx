import React, { useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';

const CashFlowProjection: React.FC = () => {
  const { transacciones, presupuestos } = useAppContext();

  const projection = useMemo(() => {
    const now = new Date();
    const hoy = now.toISOString().slice(0, 10);

    const ingresos = transacciones.filter(t => t.tipo === 'ingreso' && t.fecha <= hoy)
      .reduce((s, t) => s + t.costoTotal, 0);
    const egresos = transacciones.filter(t => t.tipo === 'gasto' && t.fecha <= hoy)
      .reduce((s, t) => s + t.costoTotal, 0);
    const saldoActual = ingresos - egresos;

    const en30 = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10);
    const en60 = new Date(now.getTime() + 60 * 86400000).toISOString().slice(0, 10);
    const en90 = new Date(now.getTime() + 90 * 86400000).toISOString().slice(0, 10);

    const izq = transacciones.filter(t => t.fecha > hoy && t.fecha <= en30);
    const izqIngreso = izq.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.costoTotal, 0);
    const izqEgreso = izq.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.costoTotal, 0);
    const proy30 = saldoActual + izqIngreso - izqEgreso;

    const izq60 = transacciones.filter(t => t.fecha > en30 && t.fecha <= en60);
    const proy60 = proy30 + izq60.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.costoTotal, 0)
      - izq60.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.costoTotal, 0);

    const izq90 = transacciones.filter(t => t.fecha > en60 && t.fecha <= en90);
    const proy90 = proy60 + izq90.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.costoTotal, 0)
      - izq90.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.costoTotal, 0);

    return { saldoActual, proy30, proy60, proy90, izqIngreso, izqEgreso };
  }, [transacciones]);

  const periods = [
    { label: 'Hoy', value: projection.saldoActual, color: 'bg-blue-500' },
    { label: '30 días', value: projection.proy30, color: projection.proy30 >= 0 ? 'bg-emerald-500' : 'bg-red-500' },
    { label: '60 días', value: projection.proy60, color: projection.proy60 >= 0 ? 'bg-emerald-500' : 'bg-red-500' },
    { label: '90 días', value: projection.proy90, color: projection.proy90 >= 0 ? 'bg-emerald-500' : 'bg-red-500' },
  ];

  const maxVal = Math.max(...periods.map(p => Math.abs(p.value)), 1);

  return (
    <div className="bg-card dark:bg-card rounded-xl shadow-sm border border-border p-2.5 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-card-foreground">Proyección Flujo de Caja</h3>
        </div>
        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {periods.map(p => (
          <div key={p.label} className="text-center">
            <p className="text-[9px] text-muted-foreground font-semibold">{p.label}</p>
            <p className={`text-[11px] font-mono font-bold ${p.value >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              Q{p.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-end gap-1 h-12">
        {periods.map(p => {
          const h = Math.max((Math.abs(p.value) / maxVal) * 48, 4);
          return (
            <div key={p.label} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-full rounded-t ${p.color} transition-all duration-500`}
                style={{ height: `${h}px`, opacity: p.value >= 0 ? 0.8 : 0.5 }} />
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-500" /> Q{projection.izqIngreso.toLocaleString()} ingresos</span>
        <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3 text-red-500" /> Q{projection.izqEgreso.toLocaleString()} egresos</span>
      </div>
    </div>
  );
};

export default CashFlowProjection;
