/**
 * TrazabilidadMaterialesPanel - Seguimiento de materiales
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTrazabilidadMateriales } from '@/hooks/useTrazabilidadMateriales';
import type { Presupuesto } from '@/types/supabase';
import { AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface TrazabilidadMaterialesPanelProps {
  presupuesto: Presupuesto;
}

export const TrazabilidadMaterialesPanel: React.FC<TrazabilidadMaterialesPanelProps> = ({ presupuesto }) => {
  const { materiales, registrarCompraItem, registrarConsumoItem, resumen, loading, recargar } = useTrazabilidadMateriales(presupuesto.id);

  const datosComposicion = [
    { name: 'Presupuestado', value: resumen.total_presupuestado },
    { name: 'Comprado', value: resumen.total_comprado },
    { name: 'Consumido', value: resumen.total_consumido },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Trazabilidad de Materiales</CardTitle>
          <CardDescription>Seguimiento desde presupuesto hasta consumo en obra</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Métricas principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 font-medium">Presupuestado</p>
              <p className="text-2xl font-bold">Q{resumen.total_presupuestado.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-green-600 font-medium">Comprado</p>
              <p className="text-2xl font-bold">Q{resumen.total_comprado.toLocaleString()}</p>
              <p className={`text-xs mt-1 ${resumen.porcentaje_variacion_costo > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {resumen.porcentaje_variacion_costo > 0 ? '+' : ''}{resumen.porcentaje_variacion_costo.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <p className="text-xs text-orange-600 font-medium">Consumido</p>
              <p className="text-2xl font-bold">Q{resumen.total_consumido.toLocaleString()}</p>
            </div>
            <div className={`p-3 rounded-lg ${resumen.porcentaje_desperdicio > 10 ? 'bg-red-50' : 'bg-green-50'}`}>
              <p className={`text-xs font-medium ${resumen.porcentaje_desperdicio > 10 ? 'text-red-600' : 'text-green-600'}`}>
                Desperdicio
              </p>
              <p className={`text-2xl font-bold ${resumen.porcentaje_desperdicio > 10 ? 'text-red-600' : 'text-green-600'}`}>
                {resumen.porcentaje_desperdicio.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Gráfico de composición */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-4">Evolución de Costos</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={datosComposicion}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `Q${(value as number).toLocaleString()}`} />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Distribución</h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={datosComposicion} cx="50%" cy="50%" labelLine={false} label dataKey="value">
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `Q${(value as number).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alertas */}
          {resumen.alertas.length > 0 && (
            <Alert className={`border-2 ${resumen.porcentaje_desperdicio > 10 ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
              <AlertTriangle className={`h-4 w-4 ${resumen.porcentaje_desperdicio > 10 ? 'text-red-600' : 'text-yellow-600'}`} />
              <AlertDescription className={resumen.porcentaje_desperdicio > 10 ? 'text-red-800' : 'text-yellow-800'}>
                <strong>Alertas de Materiales ({resumen.alertas.length})</strong>
                <ul className="mt-2 space-y-1">
                  {resumen.alertas.slice(0, 3).map((alerta, i) => (
                    <li key={i} className="text-sm">• {alerta}</li>
                  ))}
                  {resumen.alertas.length > 3 && <li className="text-sm italic">+ {resumen.alertas.length - 3} más</li>}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Detalle de materiales */}
          <div className="space-y-3">
            <h4 className="font-semibold">Detalle por Renglón</h4>
            {materiales.length === 0 ? (
              <p className="text-muted-foreground text-sm">Sin materiales registrados</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {materiales.map((material) => (
                  <div
                    key={material.id}
                    className="p-3 border rounded-lg hover:bg-accent transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-sm">{material.renglon_codigo}</p>
                        <p className="text-xs text-muted-foreground">{material.unidad}</p>
                      </div>
                      <Badge
                        variant={
                          material.estado === 'completo'
                            ? 'default'
                            : material.estado === 'en_obra'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {material.estado}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Presupuestado</p>
                        <p className="font-semibold">{material.cantidad_presupuestada}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Comprado</p>
                        <p className="font-semibold">{material.cantidad_comprada}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Consumido</p>
                        <p className="font-semibold">{material.cantidad_consumida}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Desperdicio</p>
                        <p className={`font-semibold ${material.desperdicio_porcentaje > 10 ? 'text-red-600' : 'text-green-600'}`}>
                          {material.desperdicio_porcentaje.toFixed(0)}%
                        </p>
                      </div>
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
