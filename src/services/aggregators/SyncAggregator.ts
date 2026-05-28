// src/services/aggregators/SyncAggregator.ts
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase'; // Assuming Database type is available

type PendingMutation = {
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any; // Actual data payload
  userId: string;
  timestamp: number; // Unique identifier for mutation
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
          // Filter mutations for the current user ONLY
          return parsed.filter(m => m.userId === user.id);
        }
        return []; // Return empty if no user is logged in
      } catch (e) {
        console.error("Error parsing pending mutations from local storage:", e);
        return [];
      }
    }
    return []; // Return empty if nothing is stored
  },

  async savePendingMutation(mutation: PendingMutation) {
     const existing = await this.getPendingMutations();
     existing.push(mutation);
     localStorage.setItem(PENDING_MUTATIONS_STORAGE_KEY, JSON.stringify(existing));
  },

  async clearPendingMutation(mutation: PendingMutation) {
     const existing = await this.getPendingMutations();
     // Filter out the specific mutation by its timestamp (assuming it's unique)
     const updated = existing.filter(m => m.timestamp !== mutation.timestamp);
     localStorage.setItem(PENDING_MUTATIONS_STORAGE_KEY, JSON.stringify(updated));
  },

  async syncPendingMutations() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.info('Por favor, inicia sesión para sincronizar datos.');
      return;
    }

    const pendingMutations = await this.getPendingMutations();

    if (pendingMutations.length === 0) {
      toast.info('No hay mutaciones pendientes para sincronizar.');
      return;
    }

    toast.info(`Sincronizando ${pendingMutations.length} mutaciones pendientes...`);
    let syncSuccessCount = 0;

    for (const mutation of pendingMutations) {
      // Double-check user ID just in case, though getPendingMutations should handle this
      if (mutation.userId !== user.id) continue; 

      try {
        let query = supabase.from(mutation.table);

        if (mutation.action === 'INSERT') {
          // Supabase insert might return the inserted row, but we only need error handling here
          query = query.insert(mutation.data);
        } else if (mutation.action === 'UPDATE') {
          // Ensure 'id' is present in mutation.data for UPDATE/DELETE
          if (!mutation.data.id) throw new Error(`Mutation data missing 'id' for UPDATE action on table ${mutation.table}`);
          query = query.update(mutation.data).eq('id', mutation.data.id);
        } else if (mutation.action === 'DELETE') {
          if (!mutation.data.id) throw new Error(`Mutation data missing 'id' for DELETE action on table ${mutation.table}`);
          query = query.delete().eq('id', mutation.data.id);
        } else {
          throw new Error(`Acción de mutación desconocida: ${mutation.action}`);
        }

        const { error } = await query;
        if (error) throw error;

        await this.clearPendingMutation(mutation); // Remove from pending list after successful sync
        syncSuccessCount++;
        console.log(`Mutación ${mutation.action} en ${mutation.table} (ID: ${mutation.data.id}) exitosa.`);

      } catch (error) {
        console.error(`Error sincronizando mutación ${mutation.action} en ${mutation.table} (ID: ${mutation.data.id}):`, error);
        toast.error(`Error sincronizando ${mutation.table}: ${error.message}. La mutación quedará pendiente.`);
        // Error handling: Continue with next mutation. Consider adding retry logic or alerting user for manual intervention.
      }
    }

    if (syncSuccessCount === pendingMutations.length) {
      toast.success(`Sincronización completada. ${syncSuccessCount} mutaciones aplicadas.`);
    } else {
      toast.warning(`${syncSuccessCount} de ${pendingMutations.length} mutaciones sincronizadas. Revisa la consola para más detalles.`);
    }
  }
};

// Mock pending mutations - replace with actual retrieval from storage
const mockPendingMutations: PendingMutation[] = [
  // Example: { table: 'clientes', action: 'INSERT', data: { nombre: 'Cliente Offline', telefono: '12345' }, userId: 'user-uuid', timestamp: Date.now() },
];

export const SyncAggregator = {
  // Simulates fetching pending mutations from local storage or a similar source
  async getPendingMutations(): Promise<PendingMutation[]> {
    // In a real app, you'd use localStorage, IndexedDB, etc.
    // For now, return the mock array.
    // localStorage.getItem('pendingMutations')
    const storedMutations = localStorage.getItem('pendingMutations');
    if (storedMutations) {
      try {
        const parsed: PendingMutation[] = JSON.parse(storedMutations);
        // Basic filtering, e.g., only sync if user is online
        const { data: { user } } = await supabase.auth.getUser();
        if(user) {
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
     // In a real app, you'd add to localStorage, IndexedDB, etc.
     const existing = await this.getPendingMutations();
     existing.push(mutation);
     localStorage.setItem('pendingMutations', JSON.stringify(existing));
  },

  async clearPendingMutation(mutation: PendingMutation) {
     const existing = await this.getPendingMutations();
     const updated = existing.filter(m => m.timestamp !== mutation.timestamp); // Assuming timestamp is unique identifier
     localStorage.setItem('pendingMutations', JSON.stringify(updated));
  },

  async syncPendingMutations() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.info('Por favor, inicia sesión para sincronizar datos.');
      return;
    }

    const pendingMutations = await this.getPendingMutations();

    if (pendingMutations.length === 0) {
      toast.info('No hay mutaciones pendientes para sincronizar.');
      return;
    }

    toast.info(`Sincronizando ${pendingMutations.length} mutaciones pendientes...`);
    let syncSuccessCount = 0;

    // Process mutations sequentially to maintain order if necessary, or in parallel if order doesn't matter
    for (const mutation of pendingMutations) {
        if (mutation.userId !== user.id) continue; // Should not happen if getPendingMutations filters correctly

      try {
        let query = supabase.from(mutation.table);

        if (mutation.action === 'INSERT') {
          query = query.insert(mutation.data);
        } else if (mutation.action === 'UPDATE') {
          query = query.update(mutation.data).eq('id', mutation.data.id); // Assuming 'id' is always present in UPDATE data
        } else if (mutation.action === 'DELETE') {
          query = query.delete().eq('id', mutation.data.id); // Assuming 'id' is always present in DELETE data
        } else {
          throw new Error(`Acción de mutación desconocida: ${mutation.action}`);
        }

        const { error } = await query;
        if (error) throw error;

        await this.clearPendingMutation(mutation); // Remove from pending list after successful sync
        syncSuccessCount++;
        console.log(`Mutación ${mutation.action} en ${mutation.table} (ID: ${mutation.data.id}) exitosa.`);

      } catch (error) {
        console.error(`Error sincronizando mutación ${mutation.action} en ${mutation.table} (ID: ${mutation.data.id}):`, error);
        toast.error(`Error sincronizando ${mutation.table}: ${error.message}. La mutación quedará pendiente.`);
        // Decide on error handling: stop, continue, retry? For now, we continue.
      }
    }

    if (syncSuccessCount === pendingMutations.length) {
      toast.success(`Sincronización completada. ${syncSuccessCount} mutaciones aplicadas.`);
    } else {
      toast.warning(`${syncSuccessCount} de ${pendingMutations.length} mutaciones sincronizadas. Revisa la consola para más detalles.`);
    }
  }
};