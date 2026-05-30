import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

export type TableName = keyof Database;

export interface MutationParams<T extends TableName = TableName> {
  table: T;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  data?: Partial<Database[T]>;
  filters?: Partial<Database[T]>;
}

export type QueryResultMap = Partial<Record<TableName, Database[TableName][]>>;

// Centraliza las consultas que antes vivían en AppContext.
export const AppDataService = {
  // Carga múltiples tablas para el usuario y devuelve un mapa de resultados
  async loadAll(userId: string, pageSize = 200): Promise<QueryResultMap> {
    const tables: TableName[] = [
      'clientes', 'proyectos', 'presupuestos', 'transacciones',
      'actividades', 'equipos', 'equipo_miembros', 'proveedores',
      'ordenes_compra', 'notificaciones'
    ];

    const result: QueryResultMap = {};

    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(pageSize);

        if (error) throw error;
        result[tableName] = (data || []) as Database[typeof tableName][];
      } catch (e) {
        console.warn(`Error loading table ${tableName}:`, e);
        result[tableName] = [];
      }
    }

    return result;
  },

  // Trae una tabla arbitraria filtrada por user_id
  async getTableByUser<T extends TableName>(table: T, userId: string, opts?: { limit?: number }) {
    const limit = opts?.limit ?? 200;
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as Database[T][];
  },

  async executeMutation<T extends TableName>(params: MutationParams<T>) {
    const { table, action, data, filters } = params;
    let queryBase = supabase.from(table);

    try {
      if (action === 'INSERT') {
        const { error } = await queryBase.insert(data).select().single();
        if (error) throw error;
      } else if (action === 'UPDATE') {
        if (!filters) throw new Error('UPDATE requires filters');
        let updateQuery = queryBase.update(data);
        Object.entries(filters).forEach(([key, value]) => {
          updateQuery = updateQuery.eq(key, value as any);
        });
        const { error } = await updateQuery.select().single();
        if (error) throw error;
      } else if (action === 'DELETE') {
        let deleteQuery = queryBase;
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            deleteQuery = deleteQuery.eq(key, value as any);
          });
        }
        const { error } = await deleteQuery.delete();
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
