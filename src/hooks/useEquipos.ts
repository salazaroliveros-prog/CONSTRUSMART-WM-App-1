/**
 * useEquipos.ts - Hook especializado para gestión de equipos y miembros
 * 
 * Encapsula:
 * - CRUD de equipos
 * - Gestión de miembros en equipos
 * - Roles y permisos
 * - Realtime updates
 * - Notificaciones
 * 
 * Uso:
 * ```typescript
 * const { equipos, agregarEquipo, agregarMiembro } = useEquipos();
 * ```
 */

import { useCallback, useState } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { useToast } from '@/hooks/use-toast';
import type { Equipo, EquipoMiembro } from '@/types/supabase';

export interface UseEquiposState {
  equipos: Equipo[];
  equipoActual: Equipo | null;
  miembros: EquipoMiembro[];
  cargando: boolean;
  error: string | null;
}

export interface UseEquiposAcciones {
  // Gestión de equipos
  crear: (nombre: string, descripcion?: string) => Promise<void>;
  actualizar: (id: string, nombre?: string, descripcion?: string, estado?: 'activo' | 'inactivo') => Promise<void>;
  eliminar: (id: string) => Promise<void>;
  seleccionar: (id: string | null) => void;

  // Gestión de miembros
  agregarMiembro: (equipoId: string, userId: string, rol: 'admin' | 'miembro' | 'visor') => Promise<void>;
  actualizarRolMiembro: (equipoId: string, userId: string, rol: 'admin' | 'miembro' | 'visor') => Promise<void>;
  eliminarMiembro: (equipoId: string, userId: string) => Promise<void>;

  // Consultas
  obtenerMiembrosEquipo: (equipoId: string) => EquipoMiembro[];
  puedoEditar: (equipoId: string) => boolean;
  puedoAdministrar: (equipoId: string) => boolean;

  // Estadísticas
  obtenerEstadisticas: () => {
    totalEquipos: number;
    totalMiembros: number;
    equiposActivos: number;
    rolesDistribucion: Record<string, number>;
  };
}

/**
 * Hook useEquipos
 */
export function useEquipos(): UseEquiposState & UseEquiposAcciones {
  const context = useAppContext();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { equipos = [], equipoMiembros = [], session, agregarEquipo, actualizarEquipo, eliminarEquipo, agregarEquipoMiembro, actualizarEquipoMiembro, eliminarEquipoMiembro } = context as any;
  const { toast } = useToast();
  const [equipoActual, setEquipoActual] = useState<Equipo | null>(null);

  /**
   * Crear nuevo equipo
   */
  const crear = useCallback(
    async (nombre: string, descripcion?: string) => {
      if (!nombre.trim()) {
        toast({
          title: 'Error',
          description: 'El nombre del equipo es requerido',
          variant: 'destructive',
        });
        return;
      }

      try {
        await agregarEquipo({
          nombre: nombre.trim(),
          descripcion: descripcion?.trim() || undefined,
          estado: 'activo',
        });

        toast({
          title: 'Éxito',
          description: `Equipo "${nombre}" creado correctamente`,
        });
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : 'Error desconocido';
        toast({
          title: 'Error',
          description: mensaje,
          variant: 'destructive',
        });
      }
    },
    [agregarEquipo, toast]
  );

  /**
   * Actualizar equipo
   */
  const actualizar = useCallback(
    async (id: string, nombre?: string, descripcion?: string, estado?: 'activo' | 'inactivo') => {
      try {
        await actualizarEquipo(id, {
          nombre: nombre?.trim(),
          descripcion: descripcion?.trim(),
          estado,
        });

        toast({
          title: 'Éxito',
          description: 'Equipo actualizado correctamente',
        });
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : 'Error desconocido';
        toast({
          title: 'Error',
          description: mensaje,
          variant: 'destructive',
        });
      }
    },
    [actualizarEquipo, toast]
  );

  /**
   * Eliminar equipo
   */
  const eliminar = useCallback(
    async (id: string) => {
      try {
        await eliminarEquipo(id);

        if (equipoActual?.id === id) {
          setEquipoActual(null);
        }

        toast({
          title: 'Éxito',
          description: 'Equipo eliminado correctamente',
        });
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : 'Error desconocido';
        toast({
          title: 'Error',
          description: mensaje,
          variant: 'destructive',
        });
      }
    },
    [equipoActual?.id, eliminarEquipo, toast]
  );

  /**
   * Seleccionar equipo activo
   */
  const seleccionar = useCallback((id: string | null) => {
    if (id) {
      const equipo = equipos.find((e: Equipo) => e.id === id);
      setEquipoActual(equipo || null);
    } else {
      setEquipoActual(null);
    }
  }, [equipos]);

  /**
   * Agregar miembro a equipo
   */
  const agregarMiembro = useCallback(
    async (equipoId: string, userId: string, rol: 'admin' | 'miembro' | 'visor') => {
      try {
        await agregarEquipoMiembro({
          equipoId,
          userId,
          rol,
        });

        toast({
          title: 'Éxito',
          description: 'Miembro agregado al equipo',
        });
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : 'Error desconocido';
        toast({
          title: 'Error',
          description: mensaje,
          variant: 'destructive',
        });
      }
    },
    [agregarEquipoMiembro, toast]
  );

  /**
   * Actualizar rol de miembro
   */
  const actualizarRolMiembro = useCallback(
    async (equipoId: string, userId: string, rol: 'admin' | 'miembro' | 'visor') => {
      try {
        const miembro = equipoMiembros.find((m: EquipoMiembro) => m.equipoId === equipoId && m.userId === userId);
        if (!miembro) throw new Error('Miembro no encontrado');

        await actualizarEquipoMiembro(miembro.id, { rol });

        toast({
          title: 'Éxito',
          description: `Rol actualizado a ${rol}`,
        });
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : 'Error desconocido';
        toast({
          title: 'Error',
          description: mensaje,
          variant: 'destructive',
        });
      }
    },
    [equipoMiembros, actualizarEquipoMiembro, toast]
  );

  /**
   * Eliminar miembro
   */
  const eliminarMiembro = useCallback(
    async (equipoId: string, userId: string) => {
      try {
        const miembro = equipoMiembros.find((m: EquipoMiembro) => m.equipoId === equipoId && m.userId === userId);
        if (!miembro) throw new Error('Miembro no encontrado');

        await eliminarEquipoMiembro(miembro.id);

        toast({
          title: 'Éxito',
          description: 'Miembro removido del equipo',
        });
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : 'Error desconocido';
        toast({
          title: 'Error',
          description: mensaje,
          variant: 'destructive',
        });
      }
    },
    [equipoMiembros, eliminarEquipoMiembro, toast]
  );

  /**
   * Obtener miembros de un equipo
   */
  const obtenerMiembrosEquipo = useCallback(
    (equipoId: string): EquipoMiembro[] => {
      return equipoMiembros.filter((m: EquipoMiembro) => m.equipoId === equipoId);
    },
    [equipoMiembros]
  );

  /**
   * Verificar si puedo editar este equipo
   */
  const puedoEditar = useCallback(
    (equipoId: string): boolean => {
      if (!session) return false;

      const miembro = equipoMiembros.find((m: EquipoMiembro) => m.equipoId === equipoId && m.userId === session.user.id);
      return miembro?.rol === 'admin' || miembro?.rol === 'miembro';
    },
    [session, equipoMiembros]
  );

  /**
   * Verificar si puedo administrar este equipo
   */
  const puedoAdministrar = useCallback(
    (equipoId: string): boolean => {
      if (!session) return false;

      const miembro = equipoMiembros.find((m: EquipoMiembro) => m.equipoId === equipoId && m.userId === session.user.id);
      return miembro?.rol === 'admin';
    },
    [session, equipoMiembros]
  );

  /**
   * Obtener estadísticas
   */
  const obtenerEstadisticas = useCallback(() => {
    const rolesDistribucion: Record<string, number> = { admin: 0, miembro: 0, visor: 0 };

    equipoMiembros.forEach((m: EquipoMiembro) => {
      rolesDistribucion[m.rol]++;
    });

    return {
      totalEquipos: equipos.length,
      totalMiembros: equipoMiembros.length,
      equiposActivos: (equipos as Equipo[]).filter((e: Equipo) => e.estado === 'activo').length,
      rolesDistribucion,
    };
  }, [equipos, equipoMiembros]);

  return {
    // Estado
    equipos,
    equipoActual,
    miembros: equipoActual ? obtenerMiembrosEquipo(equipoActual.id) : [],
    cargando: false,
    error: null,

    // Acciones
    crear,
    actualizar,
    eliminar,
    seleccionar,
    agregarMiembro,
    actualizarRolMiembro,
    eliminarMiembro,
    obtenerMiembrosEquipo,
    puedoEditar,
    puedoAdministrar,
    obtenerEstadisticas,
  };
}

export default useEquipos;
