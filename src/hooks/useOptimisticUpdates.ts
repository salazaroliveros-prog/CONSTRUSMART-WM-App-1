/**
 * useOptimisticUpdates.ts - Hook para actualizaciones optimistas de UI
 * 
 * Permite:
 * - Mostrar cambios inmediatamente en UI
 * - Revertir si la operación en servidor falla
 * - Manejar conflictos de concurrencia
 * - Mejora significativa de UX (percepción de velocidad)
 * 
 * Patrón:
 * ```typescript
 * const { actualizar, revertir } = useOptimisticUpdates({
 *   estado,
 *   setEstado,
 *   operacionServidor: async (nuevoEstado) => {
 *     await guardarEnSupabase(nuevoEstado);
 *   }
 * });
 * 
 * await actualizar(nuevoValor); // UI actualiza inmediatamente
 * ```
 */

import { useCallback, useRef, useEffect, useState } from 'react';

export interface OptimisticUpdateOptions<T> {
  estado: T;
  setEstado: (nuevoEstado: T | ((previo: T) => T)) => void;
  operacionServidor: (nuevoEstado: T) => Promise<void>;
  onError?: (error: Error, estadoOriginal: T) => void;
  retrasoSimulado?: number; // ms para simular latencia (debug)
}

export interface OptimisticUpdateResult {
  actualizando: boolean;
  error: string | null;
  limpiarError: () => void;
}

/**
 * Hook useOptimisticUpdates
 * 
 * Gestiona actualizaciones optimistas (cambios de UI antes de confirmación de servidor)
 */
export function useOptimisticUpdates<T>(options: OptimisticUpdateOptions<T>): OptimisticUpdateResult & {
  actualizar: (cambios: T | ((previo: T) => T)) => Promise<void>;
  revertir: (estadoAnterior: T) => void;
} {
  const { estado, setEstado, operacionServidor, onError, retrasoSimulado } = options;

  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const estadoAnteriorRef = useRef<T>(estado);

  /**
   * Actualizar de forma optimista
   */
  const actualizar = useCallback(
    async (cambios: T | ((previo: T) => T)) => {
      // Guardar estado anterior por si falla
      const estadoAnterior = estado;
      estadoAnteriorRef.current = estadoAnterior;

      try {
        // 1. Actualizar UI inmediatamente (optimista)
        const nuevoEstado = typeof cambios === 'function' ? cambios(estado) : cambios;
        setEstado(nuevoEstado);
        setActualizando(true);
        setError(null);

        // 2. Simular latencia si es necesario (para testing)
        if (retrasoSimulado && retrasoSimulado > 0) {
          await new Promise((resolve) => setTimeout(resolve, retrasoSimulado));
        }

        // 3. Enviar al servidor
        await operacionServidor(nuevoEstado);

        // 4. Success - la UI ya está actualizada
        setActualizando(false);
      } catch (err) {
        // Error - revertir al estado anterior
        const error = err instanceof Error ? err : new Error('Error desconocido');
        setError(error.message);
        setEstado(estadoAnterior);
        setActualizando(false);

        if (onError) {
          onError(error, estadoAnterior);
        }

        throw error;
      }
    },
    [estado, setEstado, operacionServidor, onError, retrasoSimulado]
  );

  /**
   * Revertir manualmente a estado anterior
   */
  const revertir = useCallback((estadoAnterior: T) => {
    setEstado(estadoAnterior);
    setActualizando(false);
    setError(null);
  }, [setEstado]);

  /**
   * Limpiar error
   */
  const limpiarError = useCallback(() => {
    setError(null);
  }, []);

  return {
    actualizando,
    error,
    actualizar,
    revertir,
    limpiarError,
  };
}

/**
 * Hook useOptimisticList - Para listas con CRUD optimistas
 * 
 * Uso:
 * ```typescript
 * const { items, agregar, actualizar, eliminar } = useOptimisticList({
 *   itemsInicial: presupuestos,
 *   onAgregar: async (item) => await crearPresupuesto(item),
 *   onActualizar: async (id, cambios) => await updatePresupuesto(id, cambios),
 *   onEliminar: async (id) => await deletePresupuesto(id),
 * });
 * ```
 */
export interface OptimisticListOptions<T extends { id: string }> {
  itemsInicial: T[];
  onAgregar?: (item: T) => Promise<void>;
  onActualizar?: (id: string, cambios: Partial<T>) => Promise<void>;
  onEliminar?: (id: string) => Promise<void>;
  onError?: (error: Error, operacion: 'agregar' | 'actualizar' | 'eliminar') => void;
}

export function useOptimisticList<T extends { id: string }>(
  options: OptimisticListOptions<T>
): {
  items: T[];
  agregar: (item: T) => Promise<void>;
  actualizar: (id: string, cambios: Partial<T>) => Promise<void>;
  eliminar: (id: string) => Promise<void>;
  actualizando: Set<string>; // IDs siendo procesados
  error: string | null;
  limpiarError: () => void;
} {
  const { itemsInicial, onAgregar, onActualizar, onEliminar, onError } = options;

  const [items, setItems] = useState<T[]>(itemsInicial);
  const [actualizando, setActualizando] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const backupRef = useRef<Map<string, T>>(new Map());

  /**
   * Agregar item
   */
  const agregar = useCallback(
    async (item: T) => {
      const idTemp = `temp_${Date.now()}`;
      const itemConId = { ...item, id: idTemp } as T;

      try {
        // Agregar optimista
        setItems((prev) => [itemConId, ...prev]);
        setActualizando((prev) => new Set([...prev, idTemp]));

        // Enviar servidor
        await onAgregar?.(itemConId);

        setActualizando((prev) => {
          const nuevo = new Set(prev);
          nuevo.delete(idTemp);
          return nuevo;
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error desconocido');

        // Revertir
        setItems((prev) => prev.filter((i) => i.id !== idTemp));
        setActualizando((prev) => {
          const nuevo = new Set(prev);
          nuevo.delete(idTemp);
          return nuevo;
        });
        setError(error.message);
        onError?.(error, 'agregar');
      }
    },
    [onAgregar, onError]
  );

  /**
   * Actualizar item
   */
  const actualizar = useCallback(
    async (id: string, cambios: Partial<T>) => {
      try {
        const itemOriginal = items.find((i) => i.id === id);
        if (!itemOriginal) throw new Error('Item no encontrado');

        // Backup por si falla
        backupRef.current.set(id, itemOriginal);

        // Actualizar optimista
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, ...cambios } : i))
        );
        setActualizando((prev) => new Set([...prev, id]));

        // Enviar servidor
        await onActualizar?.(id, cambios);

        backupRef.current.delete(id);
        setActualizando((prev) => {
          const nuevo = new Set(prev);
          nuevo.delete(id);
          return nuevo;
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error desconocido');

        // Revertir
        const backup = backupRef.current.get(id);
        if (backup) {
          setItems((prev) =>
            prev.map((i) => (i.id === id ? backup : i))
          );
        }

        setActualizando((prev) => {
          const nuevo = new Set(prev);
          nuevo.delete(id);
          return nuevo;
        });
        setError(error.message);
        onError?.(error, 'actualizar');
      }
    },
    [items, onActualizar, onError]
  );

  /**
   * Eliminar item
   */
  const eliminar = useCallback(
    async (id: string) => {
      try {
        const itemOriginal = items.find((i) => i.id === id);
        if (!itemOriginal) throw new Error('Item no encontrado');

        // Backup
        backupRef.current.set(id, itemOriginal);

        // Eliminar optimista
        setItems((prev) => prev.filter((i) => i.id !== id));
        setActualizando((prev) => new Set([...prev, id]));

        // Enviar servidor
        await onEliminar?.(id);

        backupRef.current.delete(id);
        setActualizando((prev) => {
          const nuevo = new Set(prev);
          nuevo.delete(id);
          return nuevo;
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error desconocido');

        // Revertir
        const backup = backupRef.current.get(id);
        if (backup) {
          setItems((prev) => [...prev, backup]);
        }

        setActualizando((prev) => {
          const nuevo = new Set(prev);
          nuevo.delete(id);
          return nuevo;
        });
        setError(error.message);
        onError?.(error, 'eliminar');
      }
    },
    [items, onEliminar, onError]
  );

  /**
   * Limpiar error
   */
  const limpiarError = useCallback(() => {
    setError(null);
  }, []);

  return {
    items,
    agregar,
    actualizar,
    eliminar,
    actualizando,
    error,
    limpiarError,
  };
}

export default useOptimisticUpdates;
