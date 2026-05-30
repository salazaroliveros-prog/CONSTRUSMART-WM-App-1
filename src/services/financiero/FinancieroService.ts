import { supabase } from '@/lib/supabase';
import type { DBTransaccion } from '@/types/supabase';
import type { Transaccion, CreateTransaccion, UpdateTransaccion } from '@/types/supabase';
import { toast } from 'sonner';

const TABLE = 'transacciones' as const;

/**
 * Servicio centralizado para operaciones financieras.
 * Encapsula la lógica de cálculo y acceso a datos de transacciones.
 */
export const FinancieroService = {
  /**
   * Calcula el balance incluyendo la nómina real (mano-obra)
   */
  async getResumenFinancieroDetallado(userId: string): Promise<{
    ingresos: number;
    gastosGenerales: number;
    gastosPersonal: number;
    rentabilidadNeta: number;
  }> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    const transacciones = (data ?? []) as unknown as Transaccion[];
    const ingresos = transacciones.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.costoTotal, 0);
    const gastosGenerales = transacciones.filter(t => t.tipo === 'gasto' && t.categoria !== 'mano-obra').reduce((s, t) => s + t.costoTotal, 0);
    const gastosPersonal = transacciones.filter(t => t.tipo === 'gasto' && t.categoria === 'mano-obra').reduce((s, t) => s + t.costoTotal, 0);

    return {
      ingresos,
      gastosGenerales,
      gastosPersonal,
      rentabilidadNeta: ingresos - gastosGenerales - gastosPersonal,
    };
  },

  /**
   * Obtiene transacciones, opcionalmente filtradas por proyecto
   */
  async getTransacciones(userId?: string, proyectoId?: string): Promise<Transaccion[]> {
    let query = supabase.from(TABLE).select('*');
    if (userId) query = query.eq('user_id', userId);
    if (proyectoId) query = query.eq('proyecto_id', proyectoId);
    query = query.order('fecha', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as Transaccion[];
  },

  async deleteTransaccion(id: string, userId?: string): Promise<void> {
    let query = supabase.from(TABLE).delete().eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { error } = await query;
    if (error) throw error;
  },

  async updateTransaccion(id: string, payload: UpdateTransaccion, userId?: string): Promise<Transaccion> {
    const dbRecord: Partial<DBTransaccion> = {};
    if (payload.tipo !== undefined) dbRecord.tipo = payload.tipo;
    if (payload.descripcion !== undefined) dbRecord.descripcion = payload.descripcion;
    if (payload.cantidad !== undefined) dbRecord.cantidad = payload.cantidad;
    if (payload.unidad !== undefined) dbRecord.unidad = payload.unidad;
    if (payload.categoria !== undefined) dbRecord.categoria = payload.categoria;
    if (payload.costoUnitario !== undefined) dbRecord.costo_unitario = payload.costoUnitario;
    if (payload.costoTotal !== undefined) dbRecord.costo_total = payload.costoTotal;
    if (payload.fecha !== undefined) dbRecord.fecha = payload.fecha;
    if (payload.proyectoId !== undefined) dbRecord.proyecto_id = payload.proyectoId;

    let query = supabase.from(TABLE).update(dbRecord).eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query.select().single<DBTransaccion>();
    if (error) throw error;
    if (!data) throw new Error('No se pudo actualizar la transacción');
    return data as unknown as Transaccion;
  },

  /**
   * Registra una nueva transacción con validación empresarial
   */
  async registrarTransaccion(transaccion: CreateTransaccion, userId: string): Promise<Transaccion> {
    try {
      const dbRecord: Partial<DBTransaccion> = {
        user_id: userId,
        tipo: transaccion.tipo,
        descripcion: transaccion.descripcion ?? null,
        cantidad: transaccion.cantidad ?? 1,
        unidad: transaccion.unidad ?? null,
        categoria: transaccion.categoria,
        costo_unitario: transaccion.costoUnitario ?? 0,
        costo_total: transaccion.costoTotal ?? 0,
        fecha: transaccion.fecha,
        proyecto_id: transaccion.proyectoId ?? 'admin',
      };

      const { data, error } = await supabase
        .from(TABLE)
        .insert(dbRecord)
        .select()
        .single<DBTransaccion>();

      if (error) throw error;
      if (!data) throw new Error('No se pudo registrar la transacción');
      return data as unknown as Transaccion;
    } catch (error) {
      console.error('Error en FinancieroService.registrarTransaccion:', error);
      toast.error('Error al registrar transacción');
      throw error;
    }
  },
};