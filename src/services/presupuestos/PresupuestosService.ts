import { supabase } from '@/lib/supabase';
import { Presupuesto } from '@/types/supabase';
import { toast } from 'sonner';

/**
 * Servicio para lógica de presupuestos y sus renglones.
 * Separa los cálculos de negocio de la vista de React.
 */
export const PresupuestosService = {
  /**
   * Recalcula el presupuesto completo basado en sus renglones y sub-renglones.
   * Motor paramétrico: Recalcula costos unitarios, materiales y mano de obra.
   */
  recalcularPresupuesto(presupuesto: any) {
    const renglones = presupuesto.lineas || [];
    let costoTotalDirecto = 0;
    
    const renglonesActualizados = renglones.map((r: any) => {
      // Cálculo de sub-renglones
      const costoMaterial = r.materiales.reduce((s: number, m: any) => s + (m.cantidad * m.costoUnitario), 0);
      const costoMO = r.cantidad_mo * r.jornal;
      const costoEquipo = r.cantidad_eq * r.costo_hora;
      
      const subtotal = costoMaterial + costoMO + costoEquipo;
      costoTotalDirecto += subtotal;
      
      return { ...r, costoMaterial, costoMO, costoEquipo, subtotal };
    });

    const costoIndirectos = (costoTotalDirecto * (presupuesto.factor_indirectos || 0)) / 100;
    const costoAdmin = (costoTotalDirecto * (presupuesto.factor_administrativos || 0)) / 100;
    const imprevistos = (costoTotalDirecto * (presupuesto.factor_imprevistos || 0)) / 100;
    const utilidad = ((costoTotalDirecto + costoIndirectos + costoAdmin + imprevistos) * (presupuesto.factor_utilidad || 0)) / 100;
    
    const total = costoTotalDirecto + costoIndirectos + costoAdmin + imprevistos + utilidad;

    return {
      lineas: renglonesActualizados,
      costo_directo: costoTotalDirecto,
      total: Math.round(total),
      desglose: { costoIndirectos, costoAdmin, imprevistos, utilidad }
    };
  },
  /**
   * Analiza si un proyecto está excediendo su presupuesto basado en gastos reales.
   */
  analizarDesviacion(presupuesto: any, gastosActuales: number) {
    const total = presupuesto.total || 0;
    const porcentajeGastado = total > 0 ? (gastosActuales / total) * 100 : 0;
    
    let nivelAlerta: 'normal' | 'advertencia' | 'critico' = 'normal';
    if (porcentajeGastado >= 90) nivelAlerta = 'critico';
    else if (porcentajeGastado >= 75) nivelAlerta = 'advertencia';
    
    return {
      porcentajeGastado,
      nivelAlerta,
      exceso: gastosActuales > total ? gastosActuales - total : 0
    };
  },

  async addPresupuesto(payload: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('presupuestos')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updatePresupuesto(id: string, userId: string, payload: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('presupuestos')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deletePresupuesto(id: string, userId?: string) {
    let query = supabase.from('presupuestos').delete().eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { error } = await query;
    if (error) throw error;
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
