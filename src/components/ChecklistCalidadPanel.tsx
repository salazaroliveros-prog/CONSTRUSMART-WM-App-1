/**
 * ChecklistCalidadPanel - Gestión de checklists por fase
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useChecklistCalidad } from '@/hooks/useChecklistCalidad';

import type { Presupuesto } from '@/types/supabase';
import { AlertTriangle, CheckCircle, Lock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ChecklistCalidadPanelProps {
  presupuesto: Presupuesto;
}

export const ChecklistCalidadPanel: React.FC<ChecklistCalidadPanelProps> = ({
  presupuesto,
}) => {
  const { checklists, crearParaFase, completar, descompletar, verificarAvance, generarResumenChecklist } =
    useChecklistCalidad(presupuesto.id, presupuesto.tipologia || 'general');
  const [checklistActivo, setChecklistActivo] = useState<string | null>(null);

  const handleCrearChecklist = (fase: 'planeación' | 'ejecución' | 'finalizado') => {
    crearParaFase(fase);
  };

  const checklistActual = checklistActivo ? checklists.find(c => c.id === checklistActivo) : null;
  const resumenActual = checklistActual ? generarResumenChecklist(checklistActual) : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Checklist de Calidad por Fase</CardTitle>
          <CardDescription>
            Validaciones obligatorias para avanzar entre fases de proyecto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Crear checklists para fases no iniciadas */}
          {checklists.length < 3 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-3">Crear checklist para fase:</p>
              <div className="flex gap-2 flex-wrap">
                {(['planeación', 'ejecución', 'finalizado'] as const).map((fase) => {
                  const existe = checklists.some(c => c.fase === fase);
                  return (
                    !existe && (
                      <Button
                        key={fase}
                        size="sm"
                        variant="outline"
                        onClick={() => handleCrearChecklist(fase)}
                        className="text-blue-700 border-blue-300 hover:bg-blue-100"
                      >
                        + {fase.charAt(0).toUpperCase() + fase.slice(1)}
                      </Button>
                    )
                  );
                })}
              </div>
            </div>
          )}

          {/* Listado de checklists */}
          {checklists.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">No hay checklists creados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {checklists.map((checklist) => {
                const resumen = generarResumenChecklist(checklist);
                const result = verificarAvance(checklist.id);
                const { autorizado } = result;
                const razonesBloqueo = 'razones_bloqueo' in result ? result.razones_bloqueo : [];

                return (
                  <div
                    key={checklist.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                      checklistActivo === checklist.id
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setChecklistActivo(checklist.id)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold capitalize">{checklist.fase}</p>
                        <p className="text-xs text-slate-600">
                          Tipología: {checklist.tipologia}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {autorizado && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Listo para avanzar
                          </Badge>
                        )}
                        {!autorizado && razonesBloqueo.length > 0 && (
                          <Badge className="bg-red-100 text-red-800">
                            <Lock className="w-3 h-3 mr-1" />
                            Bloqueado
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs font-medium">
                          Completación: {resumen.items_completados}/{resumen.total_items}
                        </p>
                        <span className="text-xs font-bold">
                          {resumen.porcentaje_completacion.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={resumen.porcentaje_completacion} className="h-2" />
                    </div>

                    {/* Items faltantes */}
                    {resumen.items_faltantes.length > 0 && (
                      <div className="text-xs text-red-600">
                        ⚠️ {resumen.items_faltantes.length} item(s) faltante(s):{' '}
                        {resumen.items_faltantes.slice(0, 2).join(', ')}
                        {resumen.items_faltantes.length > 2 && ` +${resumen.items_faltantes.length - 2} más`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Detalle del checklist activo */}
          {checklistActual && resumenActual && (
            <div className="border-t pt-6 space-y-4">
              <h4 className="font-semibold">Detalles - {checklistActual.fase}</h4>

              {/* Alertas de bloqueo */}
              {(() => {
                const res = verificarAvance(checklistActual.id);
                const bloqueRazones = 'razones_bloqueo' in res ? res.razones_bloqueo : [];
                return !res.autorizado && bloqueRazones.length > 0 ? (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>No puede avanzar:</strong>
                      <ul className="mt-2 space-y-1">
                        {bloqueRazones.map((r: string, i: number) => (
                          <li key={i} className="text-sm">
                            • {r}
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                ) : null;
              })()}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {checklistActual.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 border rounded-lg hover:bg-slate-50 transition"
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={item.completado}
                        onCheckedChange={() => {
                          if (item.completado) {
                            descompletar(checklistActual.id, item.id);
                          } else {
                            completar(
                              checklistActual.id,
                              item.id,
                              'usuario_actual'
                            );
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${item.completado ? 'line-through text-slate-500' : ''}`}>
                            {item.titulo}
                          </p>
                          {item.requerido && (
                            <Badge variant="outline" className="text-xs">
                              Requerido
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{item.descripcion}</p>
                        {item.completado && item.fecha_completado && (
                          <p className="text-xs text-green-600 mt-2">
                            ✅ Completado {item.fecha_completado.toLocaleDateString('es-GT')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Botón de avance */}
              {verificarAvance(checklistActual.id).autorizado && (
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Avanzar a Siguiente Fase
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
