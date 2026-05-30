import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import type { PostgrestQueryBuilder } from '@supabase/supabase-js';

export type TableName = keyof Database;

export interface MutationParams<T extends TableName = TableName> {
  table: T;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  data?: Partial<Database[T]>;
  filters?: Partial<Database[T]>;
}

export type QueryResultMap = Partial<Record<TableName, Database[TableName][]>>;

function applyFilters<T extends TableName>(
  query: PostgrestQueryBuilder<Database[T], Database[T], Database[T]>,
  filters?: Partial<Database[T]>
) {
  if (!filters) return query;

  let filteredQuery = query;
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    filteredQuery = filteredQuery.eq(key, value as string | number | boolean | null);
  }
  return filteredQuery;
}

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

  async executeMutation<T extends TableName>(params: MutationParams<T>): Promise<{ success: true } | { success: false; error: unknown }> {
    const { table, action, data, filters } = params;
    const queryBase = supabase.from<T>(table);

    try {
      if (action === 'INSERT') {
        if (!data) throw new Error('INSERT requires data');
        const { error } = await queryBase.insert(data).select().single();
        if (error) throw error;
      } else if (action === 'UPDATE') {
        if (!filters) throw new Error('UPDATE requires filters');
        if (!data) throw new Error('UPDATE requires data');
        const updateQuery = applyFilters(queryBase.update(data), filters);
        const { error } = await updateQuery.select().single();
        if (error) throw error;
      } else if (action === 'DELETE') {
        const deleteQuery = applyFilters(queryBase, filters);
        const { error } = await deleteQuery.delete();
        if (error) throw error;
      } else {
        throw new Error(`Unsupported action ${action}`);
      }
      return { success: true };
    } catch (e) {
      console.error(`Error executing ${action} on ${table}:`, e);
      return { success: false, error: e };
    }
  }
};

export default AppDataService;
