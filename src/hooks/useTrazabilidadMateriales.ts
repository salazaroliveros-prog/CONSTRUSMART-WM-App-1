/**
 * useTrazabilidadMateriales - Hook para seguimiento de materiales
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import {
  inicializarMaterialRenglon,
  registrarCompra,
  registrarConsumo,
  generarResumenTrazabilidad,
  type MaterialesRenglon,
} from '@/utils/trazabilidadMateriales';

export function useTrazabilidadMateriales(presupuestoId?: string) {
  const { session } = useAppContext();
  const [materiales, setMateriales] = useState<MaterialesRenglon[]>([]);

  useEffect(() => {
    if (!presupuestoId) return;
    const cargar = async () => {
      const { data } = await supabase
        .from('materiales_proyecto')
        .select('*, movimientos_materiales(*)')
        .eq('presupuesto_id', presupuestoId);
      if (data) {
        setMateriales(data.map((m: any) => ({
          id: m.id,
          renglon_codigo: m.codigo || m.nombre,
          presupuesto_id: m.presupuesto_id,
          cantidad_presupuestada: Number(m.cantidad_estimada),
          unidad: m.unidad,
          costo_unitario_presupuestado: Number(m.costo_unitario),
          costo_total_presupuestado: Number(m.cantidad_estimada) * Number(m.costo_unitario),
          cantidad_comprada: Number(m.cantidad_utilizada),
          costo_unitario_real: Number(m.costo_unitario),
          costo_total_comprado: Number(m.cantidad_utilizada) * Number(m.costo_unitario),
          proveedor: m.proveedor,
          cantidad_consumida: 0,
          costo_unitario_consumo: 0,
          costo_total_consumida: 0,
          desperdicio_porcentaje: 0,
          variacion_costo_porcentaje: 0,
          estado: 'planeado',
        })));
      }
    };
    cargar();
  }, [presupuestoId]);

  const agregarMaterial = useCallback(
    async (renglon_codigo: string, presupuesto_id: string, cantidad: number, unidad: string, costo: number) => {
      const material = inicializarMaterialRenglon(
        renglon_codigo,
        presupuesto_id,
        cantidad,
        unidad,
        costo
      );
      setMateriales(prev => [...prev, material]);

      await supabase.from('materiales_proyecto').insert({
        presupuesto_id,
        nombre: renglon_codigo,
        codigo: renglon_codigo,
        unidad,
        cantidad_estimada: cantidad,
        costo_unitario: costo,
      });

      return material;
    },
    []
  );

  const registrarCompraItem = useCallback(
    async (material_id: string, cantidad: number, costo_unitario: number, proveedor?: string) => {
      setMateriales(prev =>
        prev.map(m =>
          m.id === material_id
            ? registrarCompra(m, cantidad, costo_unitario, proveedor)
            : m
        )
      );
      await supabase.from('movimientos_materiales').insert({
        material_id,
        tipo: 'entrada',
        cantidad,
        referencia: proveedor,
        user_id: session?.user?.id,
      });
    },
    [session]
  );

  const registrarConsumoItem = useCallback(
    async (material_id: string, cantidad: number) => {
      setMateriales(prev =>
        prev.map(m =>
          m.id === material_id ? registrarConsumo(m, cantidad) : m
        )
      );
      await supabase.from('movimientos_materiales').insert({
        material_id,
        tipo: 'salida',
        cantidad,
        user_id: session?.user?.id,
      });

      const m = materiales.find(x => x.id === material_id);
      if (m) {
        const utilizada = Number(m.cantidad_comprada) + cantidad;
        await supabase.from('materiales_proyecto').update({ cantidad_utilizada: utilizada }).eq('id', material_id);
      }
    },
    [materiales, session]
  );

  const resumen = generarResumenTrazabilidad(materiales);

  return {
    materiales,
    agregarMaterial,
    registrarCompra: registrarCompraItem,
    registrarConsumo: registrarConsumoItem,
    resumen,
  };
}
