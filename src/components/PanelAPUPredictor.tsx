/**
 * M3: PANEL DE SUGERENCIAS APU PREDICTIVO
 */

import React from 'react';
import { Lightbulb, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generarSugerenciasCompletas, type Suggestion } from '@/utils/predictorAPU';
import type { Presupuesto } from '@/types/supabase';

interface PanelAPUPredictorProps {
  presupuestosHistorico: Presupuesto[];
  tipologia: string;
  montoBase: number;
  cantidadRenglones: number;
  cantidadTotal: number;
  onAceptarSugerencia?: (sugerencia: Suggestion) => void;
}

export const PanelAPUPredictor: React.FC<PanelAPUPredictorProps> = ({
  presupuestosHistorico,
  tipologia,
  montoBase,
  cantidadRenglones,
  cantidadTotal,
  onAceptarSugerencia,
}) => {
  const sugerencias = generarSugerenciasCompletas(
    presupuestosHistorico,
    tipologia,
    montoBase,
    cantidadRenglones,
    cantidadTotal
  );

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'factor':
        return <Lightbulb className="w-4 h-4 text-blue-600" />;
      case 'duracion':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'rentabilidad':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getColorConfianza = (confianza: number) => {
    if (confianza >= 80) return 'bg-green-100 border-green-300';
    if (confianza >= 50) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          Asistente Inteligente de Presupuestos (APU Predictivo)
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            Basado en {presupuestosHistorico.length} proyectos históricos
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {sugerencias.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Sin sugerencias - Completa el presupuesto para obtener recomendaciones</p>
            </div>
          ) : (
            sugerencias.map((sugerencia, i) => (
              <div
                key={i}
                className={`border rounded-lg p-3 flex items-start justify-between ${getColorConfianza(
                  sugerencia.confianza || 0
                )}`}
              >
                <div className="flex items-start gap-3 flex-1">
                  {getIconoTipo(sugerencia.tipo)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-card-foreground">{sugerencia.mensaje}</p>
                    {sugerencia.confianza && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              sugerencia.confianza >= 80
                                ? 'bg-green-600'
                                : sugerencia.confianza >= 50
                                  ? 'bg-yellow-600'
                                  : 'bg-red-600'
                            }`}
                            style={{ width: `${sugerencia.confianza}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{sugerencia.confianza}%</span>
                      </div>
                    )}
                  </div>
                </div>
                {sugerencia.valor && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onAceptarSugerencia?.(sugerencia)}
                    className="ml-2 flex-shrink-0"
                  >
                    Aplicar
                  </Button>
                )}
              </div>
            ))
          )}
        </div>

        {presupuestosHistorico.length < 5 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <p className="font-semibold">💡 Consejo:</p>
            <p>Completa más presupuestos para mejorar la precisión de las sugerencias (actualmente: {presupuestosHistorico.length}/5 mínimo)</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
