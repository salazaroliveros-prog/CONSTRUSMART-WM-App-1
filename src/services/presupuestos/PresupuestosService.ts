import { supabase } from '@/lib/supabase';
import type { DBPresupuesto, DBSubrenglon, DBSubrenglonMaterial, DBSubrenglonManoObra, DBSubrenglonEquipo } from '@/types/supabase';
import type { Presupuesto } from '@/types/supabase';

const TABLE_PRESUPUESTOS = 'presupuestos' as const;
const TABLE_SUBRENGLONES = 'subrenglones' as const;
const TABLE_SUBRENGLON_MAT = 'subrenglon_materiales' as const;
const TABLE_SUBRENGLON_MO = 'subrenglon_mano_obra' as const;
const TABLE_SUBRENGLON_EQ = 'subrenglon_equipos' as const;

/**
 * Servicio para lógica de presupuestos y sus renglones.
 * Separa los cálculos de negocio de la vista de React.
 */
export const PresupuestosService = {
  async listar(): Promise<Presupuesto[]> {
    const { data, error } = await supabase
      .from(TABLE_PRESUPUESTOS)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('row-level security')) {
        throw new Error('No tienes permisos suficientes para ver estos datos.');
      }
      throw error;
    }
    return (data ?? []) as unknown as Presupuesto[];
  },

  /**
   * Recalcula el presupuesto completo basado en sus renglones y sub-renglones.
   * Motor paramétrico: Recalcula costos unitarios, materiales y mano de obra.
   */
  recalcularPresupuesto(presupuesto: { lineas?: Record<string, unknown>[]; factor_indirectos?: number; factor_administrativos?: number; factor_imprevistos?: number; factor_utilidad?: number }) {
    const renglones = presupuesto.lineas ?? [];
    let costoTotalDirecto = 0;

    const renglonesActualizados = renglones.map((r: Record<string, unknown>) => {
      const materiales = (r.materiales as Record<string, unknown>[] | undefined) ?? [];
      const costoMaterial = materiales.reduce((s: number, m: Record<string, unknown>) => s + (Number(m.cantidad) * Number(m.costoUnitario)), 0);
      const costoMO = Number(r.cantidad_mo) * Number(r.jornal);
      const costoEquipo = Number(r.cantidad_eq) * Number(r.costo_hora);

      const subtotal = costoMaterial + costoMO + costoEquipo;
      costoTotalDirecto += subtotal;

      return { ...r, costoMaterial, costoMO, costoEquipo, subtotal };
    });

    const costoIndirectos = (costoTotalDirecto * (presupuesto.factor_indirectos ?? 0)) / 100;
    const costoAdmin = (costoTotalDirecto * (presupuesto.factor_administrativos ?? 0)) / 100;
    const imprevistos = (costoTotalDirecto * (presupuesto.factor_imprevistos ?? 0)) / 100;
    const utilidad = ((costoTotalDirecto + costoIndirectos + costoAdmin + imprevistos) * (presupuesto.factor_utilidad ?? 0)) / 100;

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
  analizarDesviacion(presupuesto: { total?: number }, gastosActuales: number) {
    const total = presupuesto.total ?? 0;
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

  async addPresupuesto(payload: Partial<DBPresupuesto>) {
    const { data, error } = await supabase
      .from(TABLE_PRESUPUESTOS)
      .insert(payload)
      .select()
      .single<DBPresupuesto>();

    if (error) throw error;
    if (!data) throw new Error('No se pudo crear el presupuesto');

    if (data && (payload as Record<string, unknown>).lineas) {
      this.syncPresupuestoToTables(data.id, (payload as Record<string, unknown>).lineas as Record<string, unknown>[]).catch((e) => console.warn('syncPresupuestoToTables failed', e));
    }

    return data;
  },

  async updatePresupuesto(id: string, userId: string, payload: Partial<DBPresupuesto>) {
    const { data, error } = await supabase
      .from(TABLE_PRESUPUESTOS)
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single<DBPresupuesto>();

    if (error) throw error;
    if (!data) throw new Error('No se pudo actualizar el presupuesto');

    if ((payload as Record<string, unknown>).lineas) {
      this.syncPresupuestoToTables(data.id, (payload as Record<string, unknown>).lineas as Record<string, unknown>[]).catch((e) => console.warn('syncPresupuestoToTables failed', e));
    }

    return data;
  },

  /**
   * Sincroniza `presupuestos.lineas` JSON con tablas normalizadas.
   */
  async syncPresupuestoToTables(presupuestoId: string, lineas: Record<string, unknown>[]): Promise<boolean> {
    try {
      const { error: delError } = await supabase
        .from(TABLE_SUBRENGLONES)
        .delete()
        .eq('presupuesto_id', presupuestoId);
      if (delError) console.warn('Error deleting old subrenglones', delError);

      for (const linea of lineas) {
        const subrPayload: Partial<DBSubrenglon> = {
          presupuesto_id: presupuestoId,
          descripcion: (linea.descripcion as string) ?? '',
          renglon_codigo: (linea.codigo ?? linea.codigoRenglon ?? null) as string | undefined,
        };

        const subrInsert = await supabase
          .from(TABLE_SUBRENGLONES)
          .insert(subrPayload)
          .select('id')
          .single<{ id: string }>();

        if (subrInsert.error || !subrInsert.data) {
          console.warn('Failed to insert subrenglon', subrInsert.error);
          continue;
        }

        const subrId = subrInsert.data.id;
        let childFailed = false;

        try {
          const subrenglones = (linea as Record<string, unknown>).subrenglones as Record<string, unknown> | undefined;

          // Materiales
          const materiales = (subrenglones?.materiales as Record<string, unknown>[] | undefined) ?? [];
          if (materiales.length > 0) {
            const mats = materiales.map((mat) => ({
              subrenglon_id: subrId,
              nombre: (mat.nombre ?? mat.nombreMaterial ?? '') as string,
              unidad: (mat.unidad ?? 'unidad') as string,
              cantidad: Number(mat.cantidad ?? 0),
              costo_unitario: Number(mat.costoUnitario ?? mat.costo_unitario ?? 0),
            } satisfies Partial<DBSubrenglonMaterial>));
            const { error: matErr } = await supabase.from(TABLE_SUBRENGLON_MAT).insert(mats);
            if (matErr) throw matErr;
          }

          // Mano de obra
          const manoObra = (subrenglones?.manoObra as Record<string, unknown>[] | undefined) ?? [];
          if (manoObra.length > 0) {
            const mos = manoObra.map((mo) => ({
              subrenglon_id: subrId,
              descripcion: (mo.descripcion ?? mo.descripcionMO ?? '') as string,
              cantidad_personas: Number(mo.cantidadPersonas ?? mo.cantidad ?? 1),
              jornal: Number(mo.jornal ?? 0),
            } satisfies Partial<DBSubrenglonManoObra>));
            const { error: moErr } = await supabase.from(TABLE_SUBRENGLON_MO).insert(mos);
            if (moErr) throw moErr;
          }

          // Equipos
          const equipos = (subrenglones?.equipos as Record<string, unknown>[] | undefined) ?? [];
          if (equipos.length > 0) {
            const eqs = equipos.map((eq) => ({
              subrenglon_id: subrId,
              descripcion: (eq.descripcion ?? '') as string,
              cantidad: Number(eq.cantidad ?? 0),
              costo_hora: Number(eq.costoHora ?? eq.costo_hora ?? 0),
            } satisfies Partial<DBSubrenglonEquipo>));
            const { error: eqErr } = await supabase.from(TABLE_SUBRENGLON_EQ).insert(eqs);
            if (eqErr) throw eqErr;
          }
        } catch (childErr) {
          childFailed = true;
          console.warn('Failed inserting child rows for subrenglon', subrId, childErr);
        }

        if (childFailed) {
          await supabase.from(TABLE_SUBRENGLONES).delete().eq('id', subrId);
        }
      }

      return true;
    } catch (error) {
      console.error('Error syncing presupuesto to tables:', error);
      return false;
    }
  },

  async deletePresupuesto(id: string, userId?: string) {
    let query = supabase.from(TABLE_PRESUPUESTOS).delete().eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { error } = await query;
    if (error) throw error;
  },

  /**
   * Actualiza el estado financiero y avance de un presupuesto
   */
  async updateAvance(presupuestoId: string, payload: Partial<Presupuesto>) {
    try {
      const dbPayload: Partial<DBPresupuesto> = {};
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
      if (payload.lineas !== undefined) dbPayload.lineas = payload.lineas as unknown as DBPresupuesto['lineas'];
      if (payload.fase !== undefined) dbPayload.fase = payload.fase as DBPresupuesto['fase'];

      const { data, error } = await supabase
        .from(TABLE_PRESUPUESTOS)
        .update(dbPayload)
        .eq('id', presupuestoId)
        .select()
        .single<DBPresupuesto>();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en PresupuestosService.updateAvance:', error);
      throw error;
    }
  }
};