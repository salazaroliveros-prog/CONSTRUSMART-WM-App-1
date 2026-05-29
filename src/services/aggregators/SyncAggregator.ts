// src/services/aggregators/SyncAggregator.ts
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type PendingMutation = {
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  data: Record<string, unknown>;
  userId: string;
  timestamp: number;
};

const PENDING_MUTATIONS_STORAGE_KEY = 'pendingMutations';

export const SyncAggregator = {
  async getPendingMutations(): Promise<PendingMutation[]> {
    const storedMutations = localStorage.getItem(PENDING_MUTATIONS_STORAGE_KEY);
    if (storedMutations) {
      try {
        const parsed: PendingMutation[] = JSON.parse(storedMutations);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          return parsed.filter(m => m.userId === user.id);
        }
        return [];
      } catch (e) {
        console.error("Error parsing pending mutations from local storage:", e);
        return [];
      }
    }
    return [];
  },

  async savePendingMutation(mutation: PendingMutation) {
     const existing = await this.getPendingMutations();
     existing.push(mutation);
     localStorage.setItem(PENDING_MUTATIONS_STORAGE_KEY, JSON.stringify(existing));
  },

  async clearPendingMutation(mutation: PendingMutation) {
     const existing = await this.getPendingMutations();
     const updated = existing.filter(m => m.timestamp !== mutation.timestamp);
     localStorage.setItem(PENDING_MUTATIONS_STORAGE_KEY, JSON.stringify(updated));
  },

  async syncPendingMutations() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast('Por favor, inicia sesión para sincronizar datos.');
      return;
    }

    const pendingMutations = await this.getPendingMutations();

    if (pendingMutations.length === 0) {
      toast('No hay mutaciones pendientes para sincronizar.');
      return;
    }

    toast(`Sincronizando ${pendingMutations.length} mutaciones pendientes...`);
    let syncSuccessCount = 0;

    for (const mutation of pendingMutations) {
      if (mutation.userId !== user.id) continue;

      try {
        const query = supabase.from(mutation.table) as any;

        if (mutation.action === 'INSERT') {
          const { error } = await query.insert(mutation.data);
          if (error) throw error;
        } else if (mutation.action === 'UPDATE') {
          if (!mutation.data.id) throw new Error(`Mutation data missing 'id' for UPDATE action on table ${mutation.table}`);
          const { error } = await query.update(mutation.data).eq('id', mutation.data.id);
          if (error) throw error;
        } else if (mutation.action === 'DELETE') {
          if (!mutation.data.id) throw new Error(`Mutation data missing 'id' for DELETE action on table ${mutation.table}`);
          const { error } = await query.delete().eq('id', mutation.data.id);
          if (error) throw error;
        } else {
          throw new Error(`Acción de mutación desconocida: ${mutation.action}`);
        }

        await this.clearPendingMutation(mutation);
        syncSuccessCount++;
        console.log(`Mutación ${mutation.action} en ${mutation.table} (ID: ${mutation.data.id}) exitosa.`);

      } catch (error: any) {
        console.error(`Error sincronizando mutación ${mutation.action} en ${mutation.table} (ID: ${mutation.data.id}):`, error);
        toast(`Error sincronizando ${mutation.table}: ${error.message}. La mutación quedará pendiente.`);
      }
    }

    if (syncSuccessCount === pendingMutations.length) {
      toast(`Sincronización completada. ${syncSuccessCount} mutaciones aplicadas.`);
    } else {
      toast(`${syncSuccessCount} de ${pendingMutations.length} mutaciones sincronizadas. Revisa la consola para más detalles.`);
    }
  }
};