import { supabase } from '@/lib/supabase';
import { 
  dbToCliente, dbToProyecto, dbToPresupuesto, dbToTransaccion, 
  dbToActividad, dbToEquipo, dbToEquipoMiembro, dbToProveedor, dbToOrdenCompra 
} from '@/types/supabase';

export interface MutationParams {
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  data?: Record<string, unknown>;
  filters?: Record<string, unknown>;
}

// Centraliza las consultas que antes vivían en AppContext.
export const AppDataService = {
  // Carga múltiples tablas para el usuario y devuelve un mapa de resultados
  async loadAll(userId: string, pageSize = 200) {
    const tables = [
      'clientes', 'proyectos', 'presupuestos', 'transacciones', 
      'actividades', 'equipos', 'equipo_miembros', 'proveedores', 
      'ordenes_compra', 'notificaciones'
    ];

    const result: Record<string, any[]> = {};

    for (const tableName of tables) {
      try {
        const { data, error } = await supabase.from(tableName)
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(pageSize);
        if (error) throw error;
        result[tableName] = data || [];
      } catch (e) {
        console.warn(`Error loading table ${tableName}:`, e);
        result[tableName] = [];
      }
    }

    return result;
  },

  // Trae una tabla arbitraria filtrada por user_id
  async getTableByUser(table: string, userId: string, opts?: { limit?: number }) {
    const limit = opts?.limit ?? 200;
    const { data, error } = await supabase.from(table)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  async executeMutation(params: MutationParams) {
    const { table, action, data, filters } = params;
    let query: any = supabase.from(table);
    try {
      if (action === 'INSERT') {
        const { error } = await query.insert(data).select().single();
        if (error) throw error;
      } else if (action === 'UPDATE') {
        query = query.update(data);
        if (filters) {
          Object.entries(filters).forEach(([k, v]) => { query = query.eq(k, v); });
        }
        const { error } = await query.select?.() || await query;
        if (error) throw error;
      } else if (action === 'DELETE') {
        if (filters) {
          Object.entries(filters).forEach(([k, v]) => { query = query.eq(k, v); });
        }
        const { error } = await query.delete();
        if (error) throw error;
      }
      return { success: true };
    } catch (e) {
      console.error(`Error executing ${action} on ${table}:`, e);
      return { success: false, error: e };
    }
  }
};

export default AppDataService;
