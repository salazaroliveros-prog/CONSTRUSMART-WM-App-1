/**
 * useChangeOrders - Hook para gestión de órdenes de cambio
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import { 
  crearChangeOrder, 
  aprobarChangeOrder, 
  rechazarChangeOrder,
  type ChangeOrder 
} from '@/utils/changeOrders';
import type { Presupuesto } from '@/types/supabase';
import { crearNotificacion } from '@/utils/notificaciones';

export function useChangeOrders(presupuesto: Presupuesto) {
  const { session } = useAppContext();
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!presupuesto.id) return;
    const cargar = async () => {
      const { data } = await supabase
        .from('cambios_presupuesto')
        .select('*')
        .eq('presupuesto_id', presupuesto.id)
        .order('version', { ascending: false });
      if (data) {
        setChangeOrders(data.map((c: any) => ({
          id: c.id,
          presupuesto_id: c.presupuesto_id,
          version: c.version,
          cambios: c.cambios,
          descripcion: c.motivo,
          estado: c.estado === 'aprobado' ? 'aprobada' : c.estado === 'rechazado' ? 'rechazada' : 'pendiente',
          solicitado_por: '',
          solicitado_fecha: new Date(c.created_at),
          aprobado_por: c.aprobado_por,
          aprobado_fecha: undefined,
          comentarios: undefined,
        })));
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
        
        await supabase.from('cambios_presupuesto').insert({
          presupuesto_id: presupuesto.id,
          version: orden.version,
          cambios: orden.cambios,
          motivo: orden.descripcion,
          estado: 'pendiente',
        });

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
      await supabase.from('cambios_presupuesto').update({ estado: 'aprobado' }).eq('id', ordenId);
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
      await supabase.from('cambios_presupuesto').update({ estado: 'rechazado' }).eq('id', ordenId);
      if (session?.user.id) {
        crearNotificacion(session.user.id, 'warning', 'Orden de cambio rechazada', motivo);
      }
    },
    [changeOrders, session]
  );

  return { changeOrders, crearOrden, aprobar, rechazar, loading };
}
