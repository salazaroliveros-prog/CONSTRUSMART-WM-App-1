/**
 * useTrazabilidadMateriales - Hook para seguimiento de materiales
 */

import { useState, useCallback, useEffect } from 'react';
import { MaterialesService } from '@/services/presupuestos/MaterialesService';
import { BodegaService } from '@/services/proyectos/BodegaService';
import { useAppContext } from '@/contexts/AppContext';
import {
  generarResumenTrazabilidad,
  type MaterialesRenglon,
} from '@/utils/trazabilidadMateriales';

export function useTrazabilidadMateriales(presupuestoId?: string) {
  const { session } = useAppContext();
  const [materiales, setMateriales] = useState<MaterialesRenglon[]>([]);
  const [loading, setLoading] = useState(false);

  const cargar = useCallback(async () => {
    if (!presupuestoId) return;
    setLoading(true);
    try {
      const items = await MaterialesService.getMateriales(presupuestoId);
      const movs = await BodegaService.getMovimientos(presupuestoId);

      const movMap: Record<string, { comprado: number; consumido: number; ultimoPrecio: number }> = {};
      (movs || []).forEach((m: any) => {
        const mid = m.material_id as string;
        if (!movMap[mid]) movMap[mid] = { comprado: 0, consumido: 0, ultimoPrecio: 0 };
        if (m.tipo === 'entrada') {
          movMap[mid].comprado += Number(m.cantidad);
        } else if (m.tipo === 'salida') {
          movMap[mid].consumido += Number(m.cantidad);
        }
      });

      setMateriales(items.map((m: any) => {
        const mov = movMap[m.id] || { comprado: 0, consumido: 0, ultimoPrecio: Number(m.costo_unitario) };
        const cantEst = Number(m.cantidad_estimada) || 0;
        const costoEst = Number(m.costo_unitario) || 0;
        
        return {
          id: m.id,
          renglon_codigo: m.codigo || m.nombre,
          presupuesto_id: m.presupuesto_id,
          cantidad_presupuestada: cantEst,
          unidad: m.unidad,
          costo_unitario_presupuestado: costoEst,
          costo_total_presupuestado: cantEst * costoEst,
          cantidad_comprada: mov.comprado,
          costo_unitario_real: costoEst,
          costo_total_comprado: mov.comprado * costoEst,
          proveedor: m.proveedor,
          cantidad_consumida: mov.consumido,
          costo_unitario_consumo: costoEst,
          costo_total_consumida: mov.consumido * costoEst,
          desperdicio_porcentaje: cantEst > 0 ? (Math.max(0, mov.consumido - cantEst) / cantEst) * 100 : 0,
          variacion_costo_porcentaje: 0,
          estado: mov.consumido >= cantEst ? 'completado' : mov.comprado > 0 ? 'en_progreso' : 'planeado',
        };
      }));
    } catch (error) {
      console.error('Error al cargar trazabilidad:', error);
    } finally {
      setLoading(false);
    }
  }, [presupuestoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const registrarCompraItem = useCallback(
    async (material_id: string, cantidad: number, costo_unitario: number, proveedor?: string) => {
      await BodegaService.registrarCompra(material_id, cantidad, proveedor || 'Compra Directa', session?.user?.id);
      await cargar();
    },
    [session, cargar]
  );

  const registrarConsumoItem = useCallback(
    async (material_id: string, cantidad: number) => {
      await BodegaService.registrarUso(material_id, cantidad, 'Uso en obra', session?.user?.id);
      await cargar();
    },
    [session, cargar]
  );

  const resumen = generarResumenTrazabilidad(materiales);

  return { materiales, registrarCompraItem, registrarConsumoItem, resumen, loading, recargar: cargar };
}