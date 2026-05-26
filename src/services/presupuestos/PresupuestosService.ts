import { supabase } from '@/lib/supabase';
import { Presupuesto } from '@/types/supabase';
import { toast } from 'sonner';

/**
 * Servicio para lógica de presupuestos y sus renglones.
 * Separa los cálculos de negocio de la vista de React.
 */
export const PresupuestosService = {
  /**
   * Calcula el avance ponderado de los renglones
   */
  calcularAvancePonderado(lineas: any[], renglonAvances: Record<string, number>): number {
    const calcularSubtotal = (r: any) => r.cantidad * (r.costoMaterial + r.costoManoObra + r.costoHerramienta);
    
    const total = lineas.reduce((s, r) => s + calcularSubtotal(r), 0);
    if (total === 0) return 0;
    
    const ponderado = lineas.reduce((s, r) => {
        const avance = renglonAvances[r.id] ?? r.avance ?? 0;
        return s + (Number(avance) * calcularSubtotal(r));
    }, 0) / total;
    
    return Math.round(ponderado);
  },

  /**
   * Actualiza el estado financiero y avance de un presupuesto
   */
  async updateAvance(presupuestoId: string, payload: Partial<Presupuesto>) {
    try {
      const { data, error } = await supabase
        .from('presupuestos')
        .update(payload)
        .eq('id', presupuestoId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en PresupuestosService.updateAvance:', error);
      throw error;
    }
  }
};
