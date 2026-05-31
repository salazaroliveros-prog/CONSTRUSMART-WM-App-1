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
    const tablesWithUserId: TableName[] = [
      'clientes', 'proyectos', 'presupuestos', 'transacciones',
      'actividades', 'equipos', 'equipo_miembros', 'proveedores',
      'ordenes_compra', 'notificaciones', 'empleados', 'conciliaciones',
      'bitacora_avance', 'recepcion_oc', 'caja_proyecto', 
      'movimientos_caja', 'transacciones_recurrentes'
    ];

    const result: QueryResultMap = {};

    // 1. Cargar tablas con user_id
    for (const tableName of tablesWithUserId) {
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

    // 2. Cargar tablas dependientes (sin user_id directo)
    // Cargar items de OC si hay OCs
    const ocIds = result['ordenes_compra']?.map(oc => oc.id) || [];
    if (ocIds.length > 0) {
      try {
        const { data, error } = await supabase
          .from('orden_compra_items')
          .select('*')
          .in('orden_compra_id', ocIds);
        if (!error) result['orden_compra_items'] = data as any[];
      } catch (e) { console.warn('Error loading OC items:', e); }
    }

    // Cargar materiales de proyectos/presupuestos
    const presuIds = result['presupuestos']?.map(p => p.id) || [];
    if (presuIds.length > 0) {
      try {
        const { data, error } = await supabase
          .from('materiales_proyecto')
          .select('*')
          .in('presupuesto_id', presuIds);
        if (!error) {
          result['materiales_proyecto'] = data as any[];
          // Cargar movimientos de materiales
          const matIds = data.map(m => m.id);
          if (matIds.length > 0) {
            const { data: movs, error: movErr } = await supabase
              .from('movimientos_materiales')
              .select('*')
              .in('material_id', matIds);
            if (!movErr) result['movimientos_materiales'] = movs as any[];
          }
        }
      } catch (e) { console.warn('Error loading materiales:', e); }

      // Checklist items
      try {
        const { data, error } = await supabase
          .from('checklist_items')
          .select('*')
          .in('presupuesto_id', presuIds);
        if (!error) result['checklist_items'] = data as any[];
      } catch (e) { console.warn('Error loading checklist items:', e); }
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
