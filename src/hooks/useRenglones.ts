/**
 * useRenglones Hook
 * Hook especializado para gestión de la biblioteca de renglones
 */

import { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import {
  obtenerBibliotecaRenglones,
  buscarRenglones,
  obtenerRenglonesFreuentes,
  crearRenglon,
  actualizarRenglon,
  eliminarRenglon,
  clonarRenglon,
  importarRenglonesDesdeCSV,
  obtenerCategorias,
  obtenerTipologias,
  registrarUsoRenglon,
  RENGLONES_BASE,
  type Renglon,
} from '@/services/RenglonesService';

export interface UseRenglonesOptions {
  autoCargar?: boolean;
}

export function useRenglones(options: UseRenglonesOptions = {}) {
  const { session } = useAppContext();
  const [renglones, setRenglones] = useState<Renglon[]>(RENGLONES_BASE);
  const [renglonesFreuentes, setRenglonesFreuentes] = useState<Renglon[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = session?.user.id || '';

  // Cargar biblioteca
  const cargar = useCallback(async () => {
    if (!userId) {
      setRenglones(RENGLONES_BASE);
      return;
    }
    setCargando(true);
    setError(null);
    try {
      const datos = await obtenerBibliotecaRenglones(userId);
      setRenglones(datos.length > 0 ? datos : RENGLONES_BASE);
    } catch (err) {
      setError('Error cargando biblioteca');
      setRenglones(RENGLONES_BASE);
    } finally {
      setCargando(false);
    }
  }, [userId]);

  // Cargar automáticamente
  useEffect(() => {
    if (options.autoCargar) {
      cargar();
    }
  }, [options.autoCargar, cargar]);

  // Cargar frecuentes
  const cargarFreuentes = useCallback(async () => {
    if (!userId) return;
    try {
      const frecuentes = await obtenerRenglonesFreuentes(userId);
      setRenglonesFreuentes(frecuentes);
    } catch (err) {
      console.error('Error cargando frecuentes:', err);
    }
  }, [userId]);

  // Buscar
  const buscar = useCallback(
    (
      termino: string,
      filtros?: {
        categoria?: string;
        tipologia?: string;
        dificultad?: string;
      }
    ) => {
      return buscarRenglones(renglones, termino, filtros);
    },
    [renglones]
  );

  // Crear
  const crear = useCallback(
    async (renglon: Omit<Renglon, 'id'>) => {
      if (!userId) {
        setError('Usuario no autenticado');
        return null;
      }

      setCargando(true);
      setError(null);
      try {
        const id = await crearRenglon(renglon, userId);
        if (id) {
          const nuevoRenglon: Renglon = { ...renglon, id };
          setRenglones((prev) => [nuevoRenglon, ...prev]);
          return id;
        }
      } catch (err) {
        setError('Error creando renglon');
        console.error(err);
      } finally {
        setCargando(false);
      }
      return null;
    },
    [userId]
  );

  // Actualizar
  const actualizar = useCallback(
    async (id: string, cambios: Partial<Renglon>) => {
      if (!userId) {
        setError('Usuario no autenticado');
        return false;
      }

      setCargando(true);
      setError(null);
      try {
        const resultado = await actualizarRenglon(id, cambios, userId);
        if (resultado) {
          setRenglones((prev) =>
            prev.map((r) => (r.id === id ? { ...r, ...cambios } : r))
          );
        }
        return resultado;
      } catch (err) {
        setError('Error actualizando renglon');
        console.error(err);
        return false;
      } finally {
        setCargando(false);
      }
    },
    [userId]
  );

  // Eliminar
  const eliminar = useCallback(
    async (id: string) => {
      if (!userId) {
        setError('Usuario no autenticado');
        return false;
      }

      setCargando(true);
      setError(null);
      try {
        const resultado = await eliminarRenglon(id, userId);
        if (resultado) {
          setRenglones((prev) => prev.filter((r) => r.id !== id));
        }
        return resultado;
      } catch (err) {
        setError('Error eliminando renglon');
        console.error(err);
        return false;
      } finally {
        setCargando(false);
      }
    },
    [userId]
  );

  // Clonar
  const clonar = useCallback(
    async (id: string) => {
      if (!userId) {
        setError('Usuario no autenticado');
        return null;
      }

      setCargando(true);
      setError(null);
      try {
        const nuevoId = await clonarRenglon(id, userId);
        if (nuevoId) {
          await cargar();
        }
        return nuevoId;
      } catch (err) {
        setError('Error clonando renglon');
        console.error(err);
        return null;
      } finally {
        setCargando(false);
      }
    },
    [userId, cargar]
  );

  // Importar desde CSV
  const importarCSV = useCallback(
    async (csv: string) => {
      if (!userId) {
        setError('Usuario no autenticado');
        return { exitosos: 0, errores: [] };
      }

      setCargando(true);
      setError(null);
      try {
        const resultado = await importarRenglonesDesdeCSV(csv, userId);
        if (resultado.exitosos > 0) {
          await cargar();
        }
        return resultado;
      } catch (err) {
        setError('Error importando renglones');
        console.error(err);
        return { exitosos: 0, errores: [String(err)] };
      } finally {
        setCargando(false);
      }
    },
    [userId, cargar]
  );

  // Registrar uso
  const registrarUso = useCallback(
    async (renglonId: string, presupuestoId: string) => {
      if (!userId) return false;
      try {
        return await registrarUsoRenglon(renglonId, presupuestoId, userId);
      } catch (err) {
        console.error('Error registrando uso:', err);
        return false;
      }
    },
    [userId]
  );

  // Obtener opciones de filtro
  const categorias = obtenerCategorias();
  const tipologias = obtenerTipologias();

  // Obtener categorías con renglones
  const obtenerRenglonesPorCategoria = useCallback(
    (categoria: string) => {
      return renglones.filter((r) => r.categoria === categoria);
    },
    [renglones]
  );

  // Contar renglones por categoría
  const contarPorCategoria = useCallback(() => {
    const contador: Record<string, number> = {};
    categorias.forEach((cat) => {
      contador[cat] = renglones.filter((r) => r.categoria === cat).length;
    });
    return contador;
  }, [renglones, categorias]);

  return {
    renglones,
    renglonesFreuentes,
    cargando,
    error,
    cargar,
    cargarFreuentes,
    buscar,
    crear,
    actualizar,
    eliminar,
    clonar,
    importarCSV,
    registrarUso,
    categorias,
    tipologias,
    obtenerRenglonesPorCategoria,
    contarPorCategoria,
  };
}
