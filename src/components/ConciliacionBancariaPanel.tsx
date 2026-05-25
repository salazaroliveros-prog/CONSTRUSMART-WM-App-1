/**
 * ConciliacionBancariaPanel - Gestión de caja y conciliación
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useConciliacionBancaria } from '@/hooks/useConciliacionBancaria';
import type { Presupuesto } from '@/types/supabase';
import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ConciliacionBancariaProps {
  presupuesto: Presupuesto;
}

export const ConciliacionBancariaPanel: React.FC<ConciliacionBancariaProps> = ({ presupuesto }) => {
  const { caja, registrar, conciliar, resumen } = useConciliacionBancaria(
    presupuesto.id,
    presupuesto.ingresos || 0
  );
  const [mostrarForm, setMostrarForm] = useState(false);

  // Preparar datos para gráfico
  const datosGrafico = caja.movimientos.slice(-10).map((m, i) => ({
    fecha: m.fecha.toLocaleDateString('es-GT'),
    saldo: m.saldo_sistema,
    diferencia: m.diferencia || 0,
  }));

  const statusDiferencia =
    resumen.diferencia === 0
      ? 'reconciliado'
      : Math.abs(resumen.diferencia) > resumen.saldo_sistema * 0.05
      ? 'critico'
      : 'atencion';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Conciliación Bancaria / Caja</CardTitle>
          <CardDescription>Seguimiento de efectivo disponible vs registrado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Métricas principales */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Saldo Sistema</p>
              <p className="text-3xl font-bold">Q{resumen.saldo_sistema.toLocaleString()}</p>
              <p className="text-xs text-blue-500 mt-1">Lo que registra el sistema</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Saldo Real</p>
              <p className="text-3xl font-bold">Q{resumen.saldo_real.toLocaleString()}</p>
              <p className="text-xs text-green-500 mt-1">Lo que hay físicamente</p>
            </div>

            <div
              className={`p-4 rounded-lg ${
                resumen.diferencia === 0
                  ? 'bg-green-50'
                  : Math.abs(resumen.diferencia) > resumen.saldo_sistema * 0.05
                  ? 'bg-red-50'
                  : 'bg-yellow-50'
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  resumen.diferencia === 0
                    ? 'text-green-600'
                    : Math.abs(resumen.diferencia) > resumen.saldo_sistema * 0.05
                    ? 'text-red-600'
                    : 'text-yellow-600'
                }`}
              >
                Diferencia
              </p>
              <p
                className={`text-3xl font-bold ${
                  resumen.diferencia === 0
                    ? 'text-green-600'
                    : resumen.diferencia > 0
                    ? 'text-red-600'
                    : 'text-green-600'
                }`}
              >
                Q{Math.abs(resumen.diferencia).toLocaleString()}
              </p>
              <p className="text-xs mt-1">
                {resumen.diferencia > 0
                  ? 'Faltante'
                  : resumen.diferencia < 0
                  ? 'Sobrante'
                  : 'Reconciliado'}
              </p>
            </div>
          </div>

          {/* Gráfico de evolución */}
          {datosGrafico.length > 0 && (
            <div>
              <h4 className="font-semibold mb-4">Evolución del Saldo</h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={datosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip formatter={(value) => `Q${(value as number).toLocaleString()}`} />
                  <Line type="monotone" dataKey="saldo" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Alertas */}
          {resumen.alertas_diferencia.length > 0 && (
            <Alert
              className={`border-2 ${
                statusDiferencia === 'critico'
                  ? 'border-red-200 bg-red-50'
                  : 'border-yellow-200 bg-yellow-50'
              }`}
            >
              <AlertTriangle
                className={`h-4 w-4 ${
                  statusDiferencia === 'critico' ? 'text-red-600' : 'text-yellow-600'
                }`}
              />
              <AlertDescription
                className={statusDiferencia === 'critico' ? 'text-red-800' : 'text-yellow-800'}
              >
                <strong>Alertas de Conciliación</strong>
                <ul className="mt-2 space-y-1">
                  {resumen.alertas_diferencia.map((alerta, i) => (
                    <li key={i} className="text-sm">
                      • {alerta}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {resumen.alertas_diferencia.length === 0 && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ✅ Caja reconciliada correctamente. No hay diferencias.
              </AlertDescription>
            </Alert>
          )}

          {/* Movimientos sin conciliar */}
          {resumen.movimientos_sin_conciliar > 0 && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800">
                ℹ️ Hay {resumen.movimientos_sin_conciliar} movimiento(s) sin conciliar
              </AlertDescription>
            </Alert>
          )}

          {/* Botón para registrar movimiento */}
          {!mostrarForm && (
            <Button onClick={() => setMostrarForm(true)} className="w-full">
              + Registrar Movimiento
            </Button>
          )}

          {mostrarForm && (
            <div className="p-4 border rounded-lg bg-slate-50 space-y-3">
              <p className="font-medium">Nuevo Movimiento</p>
              <div className="text-xs text-slate-600">
                (Implementar formulario completo en componente separado)
              </div>
              <Button size="sm" variant="outline" onClick={() => setMostrarForm(false)}>
                Cerrar
              </Button>
            </div>
          )}

          {/* Historial de movimientos */}
          <div className="space-y-2">
            <h4 className="font-semibold">Últimos Movimientos</h4>
            {caja.movimientos.length === 0 ? (
              <p className="text-slate-500 text-sm">Sin movimientos registrados</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {caja.movimientos
                  .slice()
                  .reverse()
                  .slice(0, 5)
                  .map((mov) => (
                    <div key={mov.id} className="p-3 border rounded-lg text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{mov.descripcion}</p>
                          <p className="text-xs text-slate-600">
                            {mov.fecha.toLocaleDateString('es-GT')}
                          </p>
                        </div>
                        <Badge
                          variant={mov.estado === 'conciliado' ? 'default' : 'secondary'}
                        >
                          {mov.estado}
                        </Badge>
                      </div>
                      <div className="flex justify-between mt-2 text-xs">
                        <p>
                          Monto:{' '}
                          <span className="font-semibold">Q{mov.monto.toLocaleString()}</span>
                        </p>
                        <p>
                          Saldo:{' '}
                          <span className="font-semibold">Q{mov.saldo_sistema.toLocaleString()}</span>
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
