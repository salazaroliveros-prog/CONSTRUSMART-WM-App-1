import type { Presupuesto } from '@/types/supabase';

export type SaludPresupuesto = 'buena' | 'riesgo' | 'critica';
export interface ValidacionPresupuesto {
  salud: SaludPresupuesto;
  advertencias: string[];
  sugerencias: string[];
}

export function validarFactores(p: Partial<Presupuesto>): ValidacionPresupuesto {
  const advertencias: string[] = [];
  const sugerencias: string[] = [];
  const { factor_indirectos = 0, factor_administrativos = 0, factor_imprevistos = 0, factor_utilidad = 0, total = 0, ingresos = 0, gastos = 0 } = p;

  const sumaFactores = factor_indirectos + factor_administrativos + factor_imprevistos;
  if (sumaFactores > 40) advertencias.push(`Costos indirectos totales (${sumaFactores}%) exceden el 40% recomendado`);
  if (factor_indirectos > 20) advertencias.push(`Indirectos (${factor_indirectos}%) > 20% — revisar estructura`);
  if (factor_administrativos > 15) advertencias.push(`Administrativos (${factor_administrativos}%) > 15%`);
  if (factor_imprevistos > 10) advertencias.push(`Imprevistos (${factor_imprevistos}%) > 10%`);
  if (factor_utilidad < 8) { advertencias.push(`Utilidad (${factor_utilidad}%) < 8% — margen muy bajo`); }
  if (factor_utilidad < 5) advertencias.push('Utilidad crítica — riesgo de pérdida');
  if (factor_utilidad === 0) sugerencias.push('Considera agregar un % de utilidad');
  if (factor_indirectos === 0) sugerencias.push('Considera agregar costos indirectos (estimado: 12%)');
  if (factor_imprevistos === 0) sugerencias.push('Se recomienda mínimo 5% de imprevistos');

  const margen = ingresos - gastos;
  if (total > 0 && margen < 0) advertencias.push('Margen negativo — pérdida proyectada');
  if (total > 0 && ingresos > 0 && (margen / total) * 100 < 5) advertencias.push('Margen < 5% — riesgo alto');

  let salud: SaludPresupuesto = 'buena';
  if (advertencias.length >= 3 || factor_utilidad < 5) salud = 'critica';
  else if (advertencias.length > 0) salud = 'riesgo';

  if (salud === 'buena' && advertencias.length === 0) {
    sugerencias.push('✅ Factores dentro de rangos saludables');
  }

  return { salud, advertencias, sugerencias };
}

export function sugerirFactores(tipologia: string): { factor_indirectos: number; factor_administrativos: number; factor_imprevistos: number; factor_utilidad: number } {
  const defaults: Record<string, { factor_indirectos: number; factor_administrativos: number; factor_imprevistos: number; factor_utilidad: number }> = {
    'residencial': { factor_indirectos: 12, factor_administrativos: 8, factor_imprevistos: 5, factor_utilidad: 15 },
    'comercial': { factor_indirectos: 15, factor_administrativos: 10, factor_imprevistos: 5, factor_utilidad: 18 },
    'industrial': { factor_indirectos: 18, factor_administrativos: 8, factor_imprevistos: 7, factor_utilidad: 20 },
    'remodelacion': { factor_indirectos: 15, factor_administrativos: 10, factor_imprevistos: 8, factor_utilidad: 15 },
    'obra-civil': { factor_indirectos: 20, factor_administrativos: 8, factor_imprevistos: 5, factor_utilidad: 12 },
    'general': { factor_indirectos: 12, factor_administrativos: 8, factor_imprevistos: 5, factor_utilidad: 15 },
  };
  return defaults[tipologia] || defaults.general;
}
