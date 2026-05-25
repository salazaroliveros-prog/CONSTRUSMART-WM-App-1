/**
 * M7: PANEL DE VALIDACIÓN DE FACTORES FINANCIEROS
 */

import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { validarMargenes, detectarAnomalias, calcularPuntuacionSalud } from '@/utils/validacionPresupuesto';
import type { Presupuesto } from '@/types/supabase';

interface PanelValidacionFactoresProps {
  presupuesto: Presupuesto;
}

export const PanelValidacionFactores: React.FC<PanelValidacionFactoresProps> = ({ presupuesto }) => {
  const validacion = validarMargenes(
    presupuesto.costo_directo || 0,
    (presupuesto.costo_directo || 0) * ((presupuesto.factor_indirectos || 10) / 100),
    (presupuesto.costo_directo || 0) * ((presupuesto.factor_administrativos || 8) / 100),
    (presupuesto.costo_directo || 0) * ((presupuesto.factor_imprevistos || 5) / 100),
    presupuesto.total - presupuesto.costo_directo || 0,
    presupuesto.total || 0
  );

  const anomalias = detectarAnomalias(
    presupuesto.costo_directo || 0,
    presupuesto.costo_material || 0,
    presupuesto.costo_mano_obra || 0,
    presupuesto.costo_herramienta || 0
  );

  const puntuacion = calcularPuntuacionSalud(validacion);

  const getColorSalud = () => {
    if (puntuacion >= 80) return 'bg-green-50 border-green-200';
    if (puntuacion >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className={`border rounded-lg p-4 ${getColorSalud()}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          {validacion.salud === 'bueno' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : validacion.salud === 'riesgo' ? (
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
          {puntuacion}/100
        </span>
      </div>

      {/* Mensajes */}
      <div className="space-y-2 mb-4">
        {validacion.mensajes.map((msg, i) => (
          <p key={i} className="text-sm text-gray-700">
            {msg}
          </p>
        ))}
      </div>

      {/* Anomalías */}
      {anomalias.length > 0 && (
        <div className="bg-red-100 border border-red-300 rounded p-3 mb-4">
          <p className="font-semibold text-sm text-red-800 mb-2">Anomalías Detectadas:</p>
          <ul className="space-y-1">
            {anomalias.map((anom, i) => (
              <li key={i} className="text-sm text-red-700">• {anom}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recomendaciones */}
      {validacion.recomendaciones.length > 0 && (
        <div className="bg-blue-100 border border-blue-300 rounded p-3">
          <p className="font-semibold text-sm text-blue-800 mb-2">Recomendaciones:</p>
          <ul className="space-y-1">
            {validacion.recomendaciones.map((rec, i) => (
              <li key={i} className="text-sm text-blue-700">• {rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
