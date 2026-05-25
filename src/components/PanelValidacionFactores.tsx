/**
 * M7: PANEL DE VALIDACIÓN DE FACTORES FINANCIEROS
 */

import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { detectarAnomalias } from '@/utils/validacionPresupuesto';
import type { Presupuesto } from '@/types/supabase';

interface PanelValidacionFactoresProps {
  presupuesto: Presupuesto;
}

export const PanelValidacionFactores: React.FC<PanelValidacionFactoresProps> = ({ presupuesto }) => {
  // Analizar anomalías detectadas
  const anomalias = detectarAnomalias(
    presupuesto.costo_directo || 0,
    presupuesto.costo_material || 0,
    presupuesto.costo_mano_obra || 0,
    presupuesto.costo_herramienta || 0
  );

  // Calcular puntuación simplificada
  const margenGanancia = presupuesto.total ? ((presupuesto.total - (presupuesto.costo_directo || 0)) / presupuesto.total) * 100 : 0;
  const puntuacion = Math.max(0, Math.min(100, 50 + (margenGanancia || 0)));

  return (
    <div className={`border rounded-lg p-4 ${puntuacion >= 80 ? 'bg-green-50 border-green-200' : puntuacion >= 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          {puntuacion >= 80 ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : puntuacion >= 60 ? (
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          Validación de Factores Financieros
        </h3>
        <span className={`text-sm font-bold px-3 py-1 rounded-full ${
          puntuacion >= 80 ? 'bg-green-200 text-green-800' :
          puntuacion >= 60 ? 'bg-yellow-200 text-yellow-800' :
          'bg-red-200 text-red-800'
        }`}>
          {Math.round(puntuacion)}/100
        </span>
      </div>

      {/* Margen de ganancia */}
      <div className="space-y-2 mb-4">
        <p className="text-sm text-gray-700">
          <strong>Margen de Ganancia:</strong> {margenGanancia.toFixed(1)}%
        </p>
      </div>

      {/* Anomalías */}
      {anomalias.length > 0 && (
        <div className="bg-red-100 border border-red-300 rounded p-3 mb-4">
          <p className="font-semibold text-sm text-red-800 mb-2">Anomalías Detectadas:</p>
          <ul className="space-y-1">
            {anomalias.map((anom: string, i: number) => (
              <li key={i} className="text-sm text-red-700">• {anom}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
