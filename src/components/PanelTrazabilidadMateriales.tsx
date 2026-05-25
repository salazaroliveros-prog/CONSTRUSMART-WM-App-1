/**
 * M9: PANEL DE TRAZABILIDAD DE MATERIALES
 */

import React from 'react';
import { Package, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ConsumoMaterial {
  id: string;
  renglon_codigo: string;
  descripcion_material: string;
  unidad: string;
  cantidad_presupuestada: number;
  cantidad_comprada: number;
  cantidad_consumida: number;
  costo_unitario_presupuestado: number;
  costo_total_presupuestado: number;
  costo_total_comprado: number;
  desperdicio_porcentaje: number;
  desperdicio_alerta: boolean;
  proveedor?: string;
  fecha_compra?: Date;
}

interface PanelTrazabilidadProps {
  consumos: ConsumoMaterial[];
}

export const PanelTrazabilidadMateriales: React.FC<PanelTrazabilidadProps> = ({ consumos }) => {
  const consumoTotal = consumos.reduce((sum, c) => sum + c.cantidad_consumida, 0);
  const compraTotal = consumos.reduce((sum, c) => sum + c.cantidad_comprada, 0);
  const presupuestoTotal = consumos.reduce((sum, c) => sum + c.cantidad_presupuestada, 0);
  const desperdicioPorcentajePromedio =
    consumos.length > 0 ? consumos.reduce((sum, c) => sum + c.desperdicio_porcentaje, 0) / consumos.length : 0;
  const materialesAlerta = consumos.filter((c) => c.desperdicio_alerta).length;

  const avanceConsumo = presupuestoTotal > 0 ? (consumoTotal / presupuestoTotal) * 100 : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Trazabilidad de Materiales
          {materialesAlerta > 0 && (
            <span className="ml-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
              {materialesAlerta} con alerta
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Resumen General */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">Presupuestado</p>
            <p className="font-bold text-blue-700">{presupuestoTotal.toFixed(2)} {consumos[0]?.unidad}</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">Comprado</p>
            <p className="font-bold text-purple-700">{compraTotal.toFixed(2)} {consumos[0]?.unidad}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">Consumido</p>
            <p className="font-bold text-green-700">{consumoTotal.toFixed(2)} {consumos[0]?.unidad}</p>
          </div>
          <div className={`p-3 rounded-lg ${
            desperdicioPorcentajePromedio > 10 ? 'bg-red-50' : 'bg-orange-50'
          }`}>
            <p className="text-xs text-gray-600">Desperdicio Prom.</p>
            <p className={`font-bold ${
              desperdicioPorcentajePromedio > 10 ? 'text-red-700' : 'text-orange-700'
            }`}>
              {desperdicioPorcentajePromedio.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Barra de avance */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold">Avance de Consumo</p>
            <span className="text-sm text-gray-600">{avanceConsumo.toFixed(1)}%</span>
          </div>
          <Progress value={Math.min(100, avanceConsumo)} className="h-2" />
        </div>

        {/* Tabla de materiales */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-gray-600">Renglón</th>
                <th className="text-left py-2 text-gray-600">Presupuestado</th>
                <th className="text-left py-2 text-gray-600">Comprado</th>
                <th className="text-left py-2 text-gray-600">Consumido</th>
                <th className="text-left py-2 text-gray-600">Desperdicio</th>
                <th className="text-left py-2 text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody>
              {consumos.map((consumo) => (
                <tr key={consumo.id} className="border-b hover:bg-gray-50">
                  <td className="py-2">
                    <div>
                      <p className="font-semibold text-gray-800">{consumo.renglon_codigo}</p>
                      <p className="text-xs text-gray-600">{consumo.descripcion_material}</p>
                    </div>
                  </td>
                  <td className="py-2 text-gray-700">
                    {consumo.cantidad_presupuestada.toFixed(2)} {consumo.unidad}
                    <p className="text-xs text-gray-600">Q {consumo.costo_total_presupuestado?.toLocaleString()}</p>
                  </td>
                  <td className="py-2 text-gray-700">
                    {consumo.cantidad_comprada.toFixed(2)} {consumo.unidad}
                    <p className="text-xs text-gray-600">Q {consumo.costo_total_comprado?.toLocaleString()}</p>
                  </td>
                  <td className="py-2 text-gray-700">
                    {consumo.cantidad_consumida.toFixed(2)} {consumo.unidad}
                  </td>
                  <td className="py-2">
                    <span className={`font-semibold ${
                      consumo.desperdicio_alerta ? 'text-red-700' : 'text-orange-700'
                    }`}>
                      {consumo.desperdicio_porcentaje.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2">
                    {consumo.desperdicio_alerta ? (
                      <div className="flex items-center gap-1 text-red-700">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs">Alerta</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-green-700">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs">OK</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {materialesAlerta > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-semibold text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {materialesAlerta} material(es) con desperdicio &gt; 10%
            </p>
            <ul className="mt-2 space-y-1">
              {consumos
                .filter((c) => c.desperdicio_alerta)
                .map((c) => (
                  <li key={c.id} className="text-xs text-red-700">
                    • {c.renglon_codigo}: {c.desperdicio_porcentaje.toFixed(1)}% de desperdicio
                  </li>
                ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
