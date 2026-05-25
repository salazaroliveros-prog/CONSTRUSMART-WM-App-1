/**
 * useChangeOrders - Hook para gestión de órdenes de cambio
 */

import { useState, useCallback } from 'react';
import { 
  crearChangeOrder, 
  aprobarChangeOrder, 
  rechazarChangeOrder,
  type ChangeOrder 
} from '@/utils/changeOrders';
import type { Presupuesto } from '@/types/supabase';

export function useChangeOrders(presupuesto: Presupuesto) {
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [loading, setLoading] = useState(false);

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
        
        setChangeOrders(prev => [...prev, orden]);
        return orden;
      } finally {
        setLoading(false);
      }
    },
    [presupuesto, changeOrders]
  );

  const aprobar = useCallback(
    (ordenId: string, aprobadoPor: string, comentarios?: string) => {
      setChangeOrders(prev => 
        prev.map(co => 
          co.id === ordenId 
            ? aprobarChangeOrder(co, aprobadoPor, comentarios)
            : co
        )
      );
    },
    []
  );

  const rechazar = useCallback(
    (ordenId: string, rechazadoPor: string, motivo: string) => {
      setChangeOrders(prev =>
        prev.map(co =>
          co.id === ordenId
            ? rechazarChangeOrder(co, rechazadoPor, motivo)
            : co
        )
      );
    },
    []
  );

  return { changeOrders, crearOrden, aprobar, rechazar, loading };
}
