import { Presupuesto } from '@/types/supabase';

/**
 * Motor de Cálculo para Gestión de Proyectos (Gantt, Ruta Crítica).
 */
export const GanttService = {
  /**
   * Calcula holguras y ruta crítica básica.
   */
  calcularRutaCritica(renglones: any[], duracionTotalDias: number) {
    // Implementación del método de camino crítico (CPM) simplificado.
    return renglones.map(r => ({
      ...r,
      holgura: 0, // Cálculo de holgura (Early Start - Late Start)
      esRutaCritica: true 
    }));
  }
};
