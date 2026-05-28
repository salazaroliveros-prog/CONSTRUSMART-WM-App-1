// Sync wrapper para operaciones offline-first
import { supabase } from '@/lib/supabase';
import { addPendingMutation, getPendingCount } from '@/services/offline';

type MutationHandler = (userId: string, data: Record<string, unknown>, filters?: Record<string, unknown>) => Promise<void>;

function createSyncWrapper(
  table: string,
  insertFn: MutationHandler,
  updateFn: MutationHandler,
  deleteFn: MutationHandler
) {
  return {
    async insert(data: Record<string, unknown>, userId: string) {
      if (!navigator.onLine) {
        addPendingMutation({ table, action: 'INSERT', data, userId });
        return;
      }
      await insertFn(userId, data);
    },
    async update(id: string, data: Record<string, unknown>, userId: string, filters?: Record<string, unknown>) {
      if (!navigator.onLine) {
        addPendingMutation({ table, action: 'UPDATE', data, filters: { id, ...filters }, userId });
        return;
      }
      await updateFn(userId, data, { id, ...filters });
    },
    async delete(id: string, userId: string, filters?: Record<string, unknown>) {
      if (!navigator.onLine) {
        addPendingMutation({ table, action: 'DELETE', filters: { id, ...filters }, userId });
        return;
      }
      await deleteFn(userId, { id, ...filters });
    },
  };
}

// Real-time sync wrapper
export async function realtimeSync<T>(table: string, userId: string): Promise<T[]> {
  if (!navigator.onLine) {
    const cached = localStorage.getItem(`offline_${table}_${userId}`);
    return cached ? JSON.parse(cached) : [];
  }
  const { data, error } = await supabase.from(table).select('*').eq('user_id', userId);
  if (error) throw error;
  localStorage.setItem(`offline_${table}_${userId}`, JSON.stringify(data));
  return data;
}