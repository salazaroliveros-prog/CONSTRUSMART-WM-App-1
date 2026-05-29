import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { fmtQ } from '@/lib/exporters';

interface CurvaSChartProps {
  data: { proyecto: string; pv: number; ev: number; ac: number }[];
}

/**
 * CurvaSChart con animación de carga progresiva.
 * Las áreas se pintan con un fade-in + scale suave para simular
 * "crecimiento" de la información en el gráfico.
 */
export const CurvaSChart: React.FC<CurvaSChartProps> = ({ data }) => {
  return (
    <div className="h-64 w-full bg-card dark:bg-card p-4 rounded-xl border border-border animate-stagger-fade stagger-8">
      <h3 className="text-xs font-bold text-card-foreground mb-3 uppercase tracking-wider">Curva S (EVM) - Valor Ganado vs Costo Real</h3>
      <div className="w-full h-[calc(100%-2rem)] animate-fill-bar" style={{ '--fill-target': '100%' } as React.CSSProperties}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="proyecto" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} />
            <Tooltip formatter={(v: number) => fmtQ(v)} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Area type="monotone" dataKey="pv" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} name="Presupuestado (PV)" animationBegin={200} animationDuration={800} />
            <Area type="monotone" dataKey="ev" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.5} name="Valor Ganado (EV)" animationBegin={400} animationDuration={800} />
            <Area type="monotone" dataKey="ac" stackId="3" stroke="#EF4444" fill="#EF4444" fillOpacity={0.5} name="Costo Real (AC)" animationBegin={600} animationDuration={800} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CurvaSChart;