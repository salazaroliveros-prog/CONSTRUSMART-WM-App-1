const CACHE_PREFIX = 'offline_';
const PENDING_KEY = 'offline_pending';
const TABLES = ['clientes', 'proyectos', 'presupuestos', 'transacciones', 'actividades', 'equipos', 'equipo_miembros'] as const;

function cacheKey(table: string, userId: string) {
  return `${CACHE_PREFIX}${table}_${userId}`;
}

export function loadCachedData<T>(table: string, userId: string): T[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(table, userId));
    if (!raw) return null;
    return JSON.parse(raw) as T[];
  } catch {
    return null;
  }
}

export function saveCachedData<T>(table: string, userId: string, data: T[]): void {
  try {
    localStorage.setItem(cacheKey(table, userId), JSON.stringify(data));
  } catch (e) {
    console.error(`Error caching ${table}:`, e);
  }
}

export function clearUserCache(userId: string): void {
  TABLES.forEach(t => {
    try { localStorage.removeItem(cacheKey(t, userId)); } catch { }
  });
}

export interface PendingMutation {
  id: string;
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  data: Record<string, unknown>;
  filters?: Record<string, unknown>;
  userId: string;
  createdAt: number;
}

function getPendingKey(userId: string) {
  return `${PENDING_KEY}_${userId}`;
}

export function getPendingMutations(userId: string): PendingMutation[] {
  try {
    const raw = localStorage.getItem(getPendingKey(userId));
    if (!raw) return [];
    return JSON.parse(raw) as PendingMutation[];
  } catch {
    return [];
  }
}

export function addPendingMutation(m: Omit<PendingMutation, 'id' | 'createdAt'>): void {
  try {
    const list = getPendingMutations(m.userId);
    list.push({ ...m, id: crypto.randomUUID(), createdAt: Date.now() });
    localStorage.setItem(getPendingKey(m.userId), JSON.stringify(list));
  } catch (e) {
    console.error('Error adding pending mutation:', e);
  }
}

export function removePendingMutation(userId: string, mutationId: string): void {
  try {
    const list = getPendingMutations(userId);
    const filtered = list.filter(m => m.id !== mutationId);
    localStorage.setItem(getPendingKey(userId), JSON.stringify(filtered));
  } catch (e) {
    console.error('Error removing pending mutation:', e);
  }
}

export function clearPendingMutations(userId: string): void {
  try {
    localStorage.removeItem(getPendingKey(userId));
  } catch { }
}

export function getPendingCount(userId: string): number {
  return getPendingMutations(userId).length;
}

export async function processPendingMutations(
  userId: string,
  exec: (m: PendingMutation) => Promise<void>,
  onProgress?: (done: number, total: number) => void,
): Promise<{ ok: number; fail: number }> {
  const pending = getPendingMutations(userId);
  if (!pending.length) return { ok: 0, fail: 0 };

  let ok = 0;
  let fail = 0;
  const MAX_ATTEMPTS = 3;

  for (let i = 0; i < pending.length; i++) {
    const m = pending[i];
    let success = false;
    let attempt = 0;

    while (attempt < MAX_ATTEMPTS && !success) {
      try {
        await exec(m);
        success = true;
        ok++;
        removePendingMutation(userId, m.id);
      } catch (e) {
        attempt++;
        if (attempt >= MAX_ATTEMPTS) {
          fail++;
          console.error(`Final failure for mutation ${m.id} on table ${m.table} after ${MAX_ATTEMPTS} attempts:`, e);
        } else {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    onProgress?.(i + 1, pending.length);
  }

  return { ok, fail };
}

export async function checkOnline(): Promise<boolean> {
  if (!navigator.onLine) return false;
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 3000);
    await fetch('https://arkemshnmyfokhmbsvpv.supabase.co/auth/v1/health', {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(id);
    return true;
  } catch {
    return false;
  }
}
