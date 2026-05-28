/**
 * useChangeOrders - Hook para gestión de órdenes de cambio
 */

import { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { 
  crearChangeOrder, 
  aprobarChangeOrder, 
  rechazarChangeOrder,
  type ChangeOrder 
} from '@/utils/changeOrders';
import type { Presupuesto } from '@/types/supabase';
import { crearNotificacion } from '@/utils/notificaciones';
import { ChangeOrdersService } from '@/services/proyectos/ChangeOrdersService';

export function useChangeOrders(presupuesto: Presupuesto) {
  const { session } = useAppContext();
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!presupuesto.id) return;
    const cargar = async () => {
      try {
        const data = await ChangeOrdersService.listar(presupuesto.id);
        setChangeOrders(data);
      } catch (e) {
        console.error('Error cargando órdenes de cambio:', e);
      }
    };
    cargar();
  }, [presupuesto.id]);

  const crearOrden = useCallback(
    async (lineasNuevas: Array<{ id: string; codigo?: string; cantidad: number; unitario: number }>, motivo: string) => {
      setLoading(true);
      try {
        const orden = crearChangeOrder(
          presupuesto.id,
          presupuesto,
          lineasNuevas,
          motivo,
          changeOrders
        );
        
        await ChangeOrdersService.crear(orden);

        setChangeOrders(prev => [...prev, orden]);
        if (session?.user.id) {
          crearNotificacion(session.user.id, 'alerta', 'Orden de cambio creada', motivo);
        }
        return orden;
      } finally {
        setLoading(false);
      }
    },
    [presupuesto, changeOrders, session]
  );

  const aprobar = useCallback(
    async (ordenId: string, aprobadoPor: string, comentarios?: string) => {
      const updated = changeOrders.map(co =>
        co.id === ordenId
          ? aprobarChangeOrder(co, aprobadoPor, comentarios)
          : co
      );
      setChangeOrders(updated);
      await ChangeOrdersService.aprobar(ordenId, aprobadoPor, comentarios);
      if (session?.user.id) {
        crearNotificacion(session.user.id, 'exito', 'Orden de cambio aprobada');
      }
    },
    [changeOrders, session]
  );

  const rechazar = useCallback(
    async (ordenId: string, rechazadoPor: string, motivo: string) => {
      const updated = changeOrders.map(co =>
        co.id === ordenId
          ? rechazarChangeOrder(co, rechazadoPor, motivo)
          : co
      );
      setChangeOrders(updated);
      await ChangeOrdersService.rechazar(ordenId, rechazadoPor, motivo);
      if (session?.user.id) {
        crearNotificacion(session.user.id, 'warning', 'Orden de cambio rechazada', motivo);
      }
    },
    [changeOrders, session]
  );

  return { changeOrders, crearOrden, aprobar, rechazar, loading };
}
