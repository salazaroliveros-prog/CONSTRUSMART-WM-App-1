/**
 * M4: PANEL DE CASH FLOW PROYECTADO
 */

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCashflowProyectado } from '@/hooks/useCashflowProyectado';
import type { Transaccion } from '@/types/supabase';

interface PanelCashFlowProps {
  transacciones: Transaccion[];
  saldoInicial: number;
  dias?: number;
}

export const PanelCashFlow: React.FC<PanelCashFlowProps> = ({ transacciones, saldoInicial, dias = 90 }) => {
  const { proyecciones, alertas, saldoFinal, peorSaldo, cargando } = useCashflowProyectado(
    transacciones,
    saldoInicial,
    dias
  );

  const datosGrafico = useMemo(
    () =>
      proyecciones.map((p, i) => ({
        nombre: `Día ${i}`,
        saldo: Math.round(p.saldoAcumulado),
        ingresos: Math.round(p.ingresos),
        egresos: Math.round(p.egresos),
      })),
    [proyecciones]
  );

  if (cargando) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-gray-500">Calculando proyección...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Proyección de Cash Flow (${dias} días)
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Alertas */}
        {alertas.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            {alertas.map((alerta, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-red-700 mb-1">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>{alerta}</p>
              </div>
            ))}
          </div>
        )}

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">Saldo Inicial</p>
            <p className="font-bold text-lg text-blue-700">Q {saldoInicial.toLocaleString()}</p>
          </div>
          <div className={`p-3 rounded-lg ${saldoFinal >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className="text-xs text-gray-600">Saldo Proyectado</p>
            <p className={`font-bold text-lg ${saldoFinal >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              Q {saldoFinal.toLocaleString()}
            </p>
          </div>
          <div className={`p-3 rounded-lg ${peorSaldo >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className="text-xs text-gray-600">Peor Saldo</p>
            <p className={`font-bold text-lg ${peorSaldo >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              Q {peorSaldo.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Gráfico */}
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={datosGrafico}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
              formatter={(value: number) => `Q ${value.toLocaleString()}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="saldo"
              stroke="#3b82f6"
              dot={false}
              strokeWidth={2}
              name="Saldo Acumulado"
            />
            <Line
              type="monotone"
              dataKey="ingresos"
              stroke="#10b981"
              dot={false}
              strokeWidth={1}
              name="Ingresos"
              opacity={0.6}
            />
            <Line
              type="monotone"
              dataKey="egresos"
              stroke="#ef4444"
              dot={false}
              strokeWidth={1}
              name="Egresos"
              opacity={0.6}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
