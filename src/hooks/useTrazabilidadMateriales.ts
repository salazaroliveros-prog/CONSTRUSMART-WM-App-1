/**
 * useTrazabilidadMateriales - Hook para seguimiento de materiales
 */

import { useState, useCallback } from 'react';
import {
  inicializarMaterialRenglon,
  registrarCompra,
  registrarConsumo,
  generarResumenTrazabilidad,
  type MaterialesRenglon,
} from '@/utils/trazabilidadMateriales';

export function useTrazabilidadMateriales() {
  const [materiales, setMateriales] = useState<MaterialesRenglon[]>([]);

  const agregarMaterial = useCallback(
    (renglon_codigo: string, presupuesto_id: string, cantidad: number, unidad: string, costo: number) => {
      const material = inicializarMaterialRenglon(
        renglon_codigo,
        presupuesto_id,
        cantidad,
        unidad,
        costo
      );
      setMateriales(prev => [...prev, material]);
      return material;
    },
    []
  );

  const registrarCompraItem = useCallback(
    (material_id: string, cantidad: number, costo_unitario: number, proveedor?: string) => {
      setMateriales(prev =>
        prev.map(m =>
          m.id === material_id
            ? registrarCompra(m, cantidad, costo_unitario, proveedor)
            : m
        )
      );
    },
    []
  );

  const registrarConsumoItem = useCallback(
    (material_id: string, cantidad: number) => {
      setMateriales(prev =>
        prev.map(m =>
          m.id === material_id ? registrarConsumo(m, cantidad) : m
        )
      );
    },
    []
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
