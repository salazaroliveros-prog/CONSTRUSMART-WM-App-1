/**
 * DashboardFinanciero - Panel consolidado de todas las métricas financieras avanzadas
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { validarFactores, sugerirFactores, detectarAnomalias } from '@/utils/validacionPresupuesto';
import type { Presupuesto } from '@/types/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface DashboardFinancieroProps {
  presupuesto: Presupuesto;
}

export const DashboardFinanciero: React.FC<DashboardFinancieroProps> = ({
  presupuesto,
}) => {
  // Validación de factores
  const validacion = validarFactores(presupuesto);
  const sugeridos = sugerirFactores(presupuesto.tipologia || 'general');

  import { CoreEngineService } from '@/services/CoreEngineService';
import { useQuery } from '@tanstack/react-query';
import { useAppContext } from '@/contexts/AppContext';

// Dentro del componente
const { user } = useAppContext();

// Uso de CoreEngineService (temporalmente con mocks para no romper UI mientras unificamos)
const { data: cashflow } = useQuery({
  queryKey: ['cashflow', user?.id],
  queryFn: () => CoreEngineService.proyectarCashflow([], 0, 30) // placeholder
});

  // Analizar anomalías
   
  const costoDirecto = (presupuesto.lineas as any[] || []).reduce(
     
    (sum: number, l: any) => sum + ((l.costoMaterial || 0) + (l.costoManoObra || 0) + (l.costoHerramienta || 0)) * l.cantidad,
    0
  );

   
  const totalMaterial = (presupuesto.lineas as any[] || []).reduce(
     
    (sum: number, l: any) => sum + (l.costoMaterial || 0) * l.cantidad,
    0
  );

   
  const totalManoObra = (presupuesto.lineas as any[] || []).reduce(
     
    (sum: number, l: any) => sum + (l.costoManoObra || 0) * l.cantidad,
    0
  );

   
  const totalHerramienta = (presupuesto.lineas as any[] || []).reduce(
     
    (sum: number, l: any) => sum + (l.costoHerramienta || 0) * l.cantidad,
    0
  );

  const anomalias = detectarAnomalias(costoDirecto, totalMaterial, totalManoObra, totalHerramienta);

  // Datos para gráfico
  const datosCostos = [
    { nombre: 'Material', valor: totalMaterial, fill: '#3b82f6' },
    { nombre: 'Mano de Obra', valor: totalManoObra, fill: '#10b981' },
    { nombre: 'Herramienta', valor: totalHerramienta, fill: '#f59e0b' },
  ];

  const saludColor = {
    buena: 'bg-green-50 border-green-200',
    riesgo: 'bg-yellow-50 border-yellow-200',
    critica: 'bg-red-50 border-red-200',
  };

  const saludBadge = {
    buena: <Badge className="bg-green-100 text-green-800">✅ Buena</Badge>,
    riesgo: <Badge className="bg-yellow-100 text-yellow-800">⚠️ Riesgo</Badge>,
    critica: <Badge className="bg-red-100 text-red-800">🚨 Crítica</Badge>,
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="validacion" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="validacion">Validación</TabsTrigger>
          <TabsTrigger value="composicion">Composición</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
        </TabsList>

        {/* Tab: Validación de Factores */}
        <TabsContent value="validacion" className="space-y-4">
          <Card className={`border-2 ${saludColor[validacion.salud]}`}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Salud del Presupuesto</CardTitle>
                  <CardDescription>Evaluación de factores financieros</CardDescription>
                </div>
                {saludBadge[validacion.salud]}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Factores actuales vs sugeridos */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Indirectos', actual: presupuesto.factor_indirectos, sugerido: sugeridos.factor_indirectos },
                  { label: 'Admin', actual: presupuesto.factor_administrativos, sugerido: sugeridos.factor_administrativos },
                  { label: 'Imprevistos', actual: presupuesto.factor_imprevistos, sugerido: sugeridos.factor_imprevistos },
                  { label: 'Utilidad', actual: presupuesto.factor_utilidad, sugerido: sugeridos.factor_utilidad },
                ].map(factor => (
                  <div key={factor.label} className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium text-slate-600">{factor.label}</p>
                    <p className="text-2xl font-bold">{factor.actual}%</p>
                    <p className="text-xs text-slate-500">
                      Sugerido: {factor.sugerido}%
                      {Math.abs(factor.actual - factor.sugerido) > 2 && (
                        <span className="ml-1">
                          {factor.actual > factor.sugerido ? '📈' : '📉'}
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>

              {/* Advertencias y sugerencias */}
              {validacion.advertencias.length > 0 && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Advertencias ({validacion.advertencias.length})</strong>
                    <ul className="mt-2 space-y-1">
                      {validacion.advertencias.map((adv, i) => (
                        <li key={i} className="text-sm">• {adv}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {validacion.sugerencias.length > 0 && (
                <Alert className="border-blue-200 bg-blue-50">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Sugerencias</strong>
                    <ul className="mt-2 space-y-1">
                      {validacion.sugerencias.map((sug, i) => (
                        <li key={i} className="text-sm">• {sug}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Composición de Costos */}
        <TabsContent value="composicion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Composición de Costos</CardTitle>
              <CardDescription>Desglose por categoría de gasto</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={datosCostos}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nombre" />
                  <YAxis />
                  <Tooltip formatter={(value) => `Q${(value as number).toFixed(2)}`} />
                  <Bar dataKey="valor" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Material</p>
                  <p className="text-2xl font-bold">Q{totalMaterial.toLocaleString()}</p>
                  <p className="text-xs text-blue-500">{((totalMaterial / costoDirecto) * 100).toFixed(1)}% del total</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Mano de Obra</p>
                  <p className="text-2xl font-bold">Q{totalManoObra.toLocaleString()}</p>
                  <p className="text-xs text-green-500">{((totalManoObra / costoDirecto) * 100).toFixed(1)}% del total</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-600 font-medium">Herramienta</p>
                  <p className="text-2xl font-bold">Q{totalHerramienta.toLocaleString()}</p>
                  <p className="text-xs text-orange-500">{((totalHerramienta / costoDirecto) * 100).toFixed(1)}% del total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Cash Flow Proyectado - Por implementar */}
        <TabsContent value="cashflow" className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Módulo de Cash Flow próximamente disponible
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Tab: Alertas General */}
        <TabsContent value="alertas" className="space-y-4">
          {anomalias.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Anomalías Detectadas ({anomalias.length})</strong>
                <ul className="mt-2 space-y-1">
                  {anomalias.map((anom, i) => (
                    <li key={i} className="text-sm">• {anom}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {anomalias.length === 0 && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ✅ No se detectaron anomalías. Los costos están dentro de rangos normales.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
