import { supabase } from '@/lib/supabase';
import { Presupuesto, validatePresupuesto } from '@/types/supabase';
import { toast } from 'sonner';

/**
 * Servicio para lógica de presupuestos y sus renglones.
 * Separa los cálculos de negocio de la vista de React.
 */
export const PresupuestosService = {
  async listar(): Promise<Presupuesto[]> {
    const { data, error } = await supabase
      .from('presupuestos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('row-level security')) {
        throw new Error('No tienes permisos suficientes para ver estos datos.');
      }
      throw error;
    }
    return (data || []).map((item: unknown) => validatePresupuesto(item) as unknown as Presupuesto);
  },

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
    // After creating presupuesto, optionally synchronize JSON lineas into normalized tables
    try {
      const pres = data as any;
      if (pres && pres.lineas) {
        // call sync (best-effort, do not block creation)
         
        this.syncPresupuestoToTables(pres.id, pres.lineas).catch((e) => console.warn('syncPresupuestoToTables failed', e));
      }
    } catch (e) {
      console.warn('post-create sync failed', e);
    }

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
    // After update, synchronize JSON lineas to normalized tables if present
    try {
      const pres = data as any;
      if (pres && pres.lineas) {
         
        this.syncPresupuestoToTables(pres.id, pres.lineas).catch((e) => console.warn('syncPresupuestoToTables failed', e));
      }
    } catch (e) {
      console.warn('post-update sync failed', e);
    }

    return data;
  },

  /**
   * Sincroniza `presupuestos.lineas` JSON con tablas normalizadas: subrenglones y sus detalles.
   * Este método realiza borrado previo de subrenglones asociados y re-inserta los nuevos.
   */
  async syncPresupuestoToTables(presupuestoId: string, lineas: any[]): Promise<boolean> {
    try {
      // 1) Delete existing subrenglones and their child rows (ON DELETE CASCADE exists)
      const { error: delError } = await supabase.from('subrenglones').delete().eq('presupuesto_id', presupuestoId);
      if (delError) {
        console.warn('Error deleting old subrenglones', delError);
        // continue to attempt insertions
      }

      // 2) Insert new subrenglones and details
      for (const linea of lineas) {
        const subrPayload: any = {
          presupuesto_id: presupuestoId,
          renglon_id: linea.renglonId || null,
          codigo: linea.codigo || linea.codigoRenglon || null,
          descripcion: linea.descripcion || '',
          unidad: linea.unidad || 'pza',
          cantidad: linea.cantidad != null ? linea.cantidad : 1,
          rendimiento: linea.rendimiento != null ? linea.rendimiento : null,
        };

        const { data: subData, error: subErr } = await supabase.from('subrenglones').insert(subrPayload).select().single();
        if (subErr || !subData) {
          console.warn('Failed to insert subrenglon', subErr, subrPayload);
          continue;
        }

        const subrId = (subData as any).id;

        // Insert materials
        if (Array.isArray(linea.subrenglones?.materiales)) {
          for (const mat of linea.subrenglones.materiales) {
            try {
              const matPayload = {
                subrenglon_id: subrId,
                nombre: mat.nombre || mat.nombreMaterial || '',
                unidad: mat.unidad || 'unidad',
                cantidad: mat.cantidad != null ? mat.cantidad : 0,
                costo_unitario: mat.costoUnitario != null ? mat.costoUnitario : (mat.costo_unitario != null ? mat.costo_unitario : 0),
                created_at: new Date().toISOString(),
              };
               
              await supabase.from('subrenglon_materiales').insert(matPayload);
            } catch (e) {
              console.warn('insert material failed', e);
            }
          }
        }

        // Insert mano de obra
        if (Array.isArray(linea.subrenglones?.manoObra)) {
          for (const mo of linea.subrenglones.manoObra) {
            try {
              const moPayload = {
                subrenglon_id: subrId,
                descripcion: mo.descripcion || mo.descripcionMO || '',
                cantidad_personas: mo.cantidadPersonas != null ? mo.cantidadPersonas : (mo.cantidad != null ? mo.cantidad : 1),
                jornal: mo.jornal != null ? mo.jornal : 0,
                rendimiento_especifico: mo.rendimientoEspecifico != null ? mo.rendimientoEspecifico : null,
                costo_unidad: 0,
                created_at: new Date().toISOString(),
              };
               
              await supabase.from('subrenglon_mano_obra').insert(moPayload);
            } catch (e) {
              console.warn('insert manoobra failed', e);
            }
          }
        }

        // Insert equipos
        if (Array.isArray(linea.subrenglones?.equipos)) {
          for (const eq of linea.subrenglones.equipos) {
            try {
              const eqPayload = {
                subrenglon_id: subrId,
                descripcion: eq.descripcion || '',
                cantidad: eq.cantidad != null ? eq.cantidad : 0,
                costo_hora: eq.costoHora != null ? eq.costoHora : (eq.costo_hora != null ? eq.costo_hora : 0),
                horas_uso: eq.horasUso != null ? eq.horasUso : (eq.horas_uso != null ? eq.horas_uso : 0),
                subtotal: (eq.cantidad || 0) * (eq.costoHora || eq.costo_hora || 0) * (eq.horasUso || eq.horas_uso || 1),
                created_at: new Date().toISOString(),
              };
               
              await supabase.from('subrenglon_equipos').insert(eqPayload);
            } catch (e) {
              console.warn('insert equipo failed', e);
            }
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error syncing presupuesto to tables:', error);
      return false;
    }
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
      // Transform camelCase app fields to snake_case DB columns
      const dbPayload: Record<string, unknown> = {};
      if (payload.avanceFisico !== undefined) dbPayload.avance_fisico = payload.avanceFisico;
      if (payload.avanceFinanciero !== undefined) dbPayload.avance_financiero = payload.avanceFinanciero;
      if (payload.ingresos !== undefined) dbPayload.ingresos = payload.ingresos;
      if (payload.gastos !== undefined) dbPayload.gastos = payload.gastos;
      if (payload.pendienteAportar !== undefined) dbPayload.pendiente_aportar = payload.pendienteAportar;
      if (payload.total !== undefined) dbPayload.total = payload.total;
      if (payload.factor_indirectos !== undefined) dbPayload.factor_indirectos = payload.factor_indirectos;
      if (payload.factor_administrativos !== undefined) dbPayload.factor_administrativos = payload.factor_administrativos;
      if (payload.factor_imprevistos !== undefined) dbPayload.factor_imprevistos = payload.factor_imprevistos;
      if (payload.factor_utilidad !== undefined) dbPayload.factor_utilidad = payload.factor_utilidad;
      if (payload.lineas !== undefined) dbPayload.lineas = payload.lineas;
      if (payload.fase !== undefined) dbPayload.fase = payload.fase;

      const { data, error } = await supabase
        .from('presupuestos')
        .update(dbPayload)
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
