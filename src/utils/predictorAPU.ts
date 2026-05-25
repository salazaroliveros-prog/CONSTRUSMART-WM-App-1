import React from 'react';
import type { Presupuesto } from '@/types/supabase';

export interface Suggestion {
  tipo: 'factor' | 'renglon' | 'cliente';
  mensaje: string;
  valor?: unknown;
}

export function sugerirAPU(presupuestosAnteriores: Presupuesto[], tipologia: string): Suggestion[] {
  const relacionados = presupuestosAnteriores.filter(p => p.tipologia === tipologia && p.total > 0);
  if (relacionados.length === 0) return [];

  const avgIndirectos = relacionados.reduce((s, p) => s + p.factor_indirectos, 0) / relacionados.length;
  const avgAdmin = relacionados.reduce((s, p) => s + p.factor_administrativos, 0) / relacionados.length;
  const avgImprev = relacionados.reduce((s, p) => s + p.factor_imprevistos, 0) / relacionados.length;
  const avgUtilidad = relacionados.reduce((s, p) => s + p.factor_utilidad, 0) / relacionados.length;
  const avgTotal = relacionados.reduce((s, p) => s + p.total, 0) / relacionados.length;

  const sugerencias: Suggestion[] = [];

  if (relacionados.length >= 2) {
    sugerencias.push({
      tipo: 'factor',
      mensaje: `Basado en ${relacionados.length} proyectos similares (${tipologia}): Indirectos ${avgIndirectos.toFixed(0)}%, Admin ${avgAdmin.toFixed(0)}%, Imprevistos ${avgImprev.toFixed(0)}%, Utilidad ${avgUtilidad.toFixed(0)}%`,
      valor: { factor_indirectos: Math.round(avgIndirectos), factor_administrativos: Math.round(avgAdmin), factor_imprevistos: Math.round(avgImprev), factor_utilidad: Math.round(avgUtilidad) },
    });
    sugerencias.push({
      tipo: 'factor',
      mensaje: `Presupuesto promedio para ${tipologia}: Q${avgTotal.toLocaleString()}`,
    });
  }

  return sugerencias;
}
