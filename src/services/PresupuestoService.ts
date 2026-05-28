/**
 * PresupuestoService
 * Servicio especializado para gestión de presupuestos
 * Maneja cálculos, persistencia y validaciones
 */

import { supabase } from '@/lib/supabase';
import {
  calcularTotalesPresupuesto,
  type FactoresCalculo,
  type LineaCalculada,
  type ResultadoCalculo,
} from './CalculoService';

export interface LineaPresupuestoCompleta {
  id: string;
  codigo: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  costoMaterial: number;
  costoManoObra: number;
  costoHerramienta: number;
  rendimiento: number;
  subrenglones?: SubRenglon[];
  materiales?: MaterialUnitario[];
  notas?: string;
}

export interface SubRenglon {
  id: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  costoUnitario: number;
}

export interface MaterialUnitario {
  id: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  costoUnitario: number;
  proveedor?: string;
}

export interface PresupuestoCompleto {
  id: string;
  proyecto: string;
  cliente?: string;
  ubicacion?: string;
  tipologia?: string;
  fase: 'planeación' | 'ejecución' | 'pausa' | 'finalizado';
  lineas: LineaPresupuestoCompleta[];
  factores: FactoresCalculo;
  resultado: ResultadoCalculo;
  created_at?: string;
  updated_at?: string;
}

/**
 * Obtiene un presupuesto por ID
 */
export async function obtenerPresupuesto(id: string, userId: string): Promise<PresupuestoCompleto | null> {
  try {
    const { data, error } = await supabase
      .from('presupuestos')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    const d = data as any;

    return {
      id: d.id,
      proyecto: d.proyecto,
      cliente: d.cliente,
      ubicacion: d.ubicacion,
      tipologia: d.tipologia,
      fase: d.fase,
      lineas: d.lineas || [],
      factores: {
        indirectos: d.factor_indirectos || 0,
        administrativos: d.factor_administrativos || 0,
        imprevistos: d.factor_imprevistos || 0,
        utilidad: d.factor_utilidad || 0,
      },
      resultado: {
        costoDirecto: d.costo_directo || 0,
        costosIndirectos: 0,
        costosAdministrativos: 0,
        costosImprevistos: 0,
        subtotal: 0,
        utilidad: 0,
        total: d.total || 0,
        estimacionDiasTotal: 0,
        precioPorDia: 0,
        margenUtilidad: 0,
        margenRelativo: 0,
      },
      created_at: d.created_at,
      updated_at: d.updated_at,
    };
  } catch (error) {
    console.error('Error obteniendo presupuesto:', error);
    return null;
  }
}

/**
 * Obtiene todos los presupuestos del usuario
 */
export async function obtenerPresupuestos(userId: string): Promise<PresupuestoCompleto[]> {
  try {
    const { data, error } = await supabase
      .from('presupuestos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return (data as any[]).map((p: any) => ({
      id: p.id,
      proyecto: p.proyecto,
      cliente: p.cliente,
      ubicacion: p.ubicacion,
      tipologia: p.tipologia,
      fase: p.fase,
      lineas: p.lineas || [],
      factores: {
        indirectos: p.factor_indirectos || 0,
        administrativos: p.factor_administrativos || 0,
        imprevistos: p.factor_imprevistos || 0,
        utilidad: p.factor_utilidad || 0,
      },
      resultado: {
        costoDirecto: 0,
        costosIndirectos: 0,
        costosAdministrativos: 0,
        costosImprevistos: 0,
        subtotal: 0,
        utilidad: 0,
        total: p.total || 0,
        estimacionDiasTotal: 0,
        precioPorDia: 0,
        margenUtilidad: 0,
        margenRelativo: 0,
      },
      created_at: p.created_at,
      updated_at: p.updated_at,
    }));
  } catch (error) {
    console.error('Error obteniendo presupuestos:', error);
    return [];
  }
}

/**
 * Guarda un presupuesto (crear o actualizar)
 */
export async function guardarPresupuesto(
  presupuesto: PresupuestoCompleto,
  userId: string
): Promise<string | null> {
  try {
    // Calcular totales
    const lineasCalculadas: LineaCalculada[] = presupuesto.lineas.map((linea) => {
      return {
        id: linea.id,
        costoUnitario: linea.costoMaterial + linea.costoManoObra + linea.costoHerramienta,
        cantidad: linea.cantidad,
        subtotal: (linea.costoMaterial + linea.costoManoObra + linea.costoHerramienta) * linea.cantidad,
        estimacionDias: Math.ceil((linea.cantidad || 0) / (linea.rendimiento || 1)),
      };
    });

    const resultado = calcularTotalesPresupuesto(lineasCalculadas, presupuesto.factores);

    const payload = {
      proyecto: presupuesto.proyecto,
      cliente: presupuesto.cliente,
      ubicacion: presupuesto.ubicacion,
      tipologia: presupuesto.tipologia,
      fase: presupuesto.fase,
      lineas: presupuesto.lineas,
      factor_indirectos: presupuesto.factores.indirectos,
      factor_administrativos: presupuesto.factores.administrativos,
      factor_imprevistos: presupuesto.factores.imprevistos,
      factor_utilidad: presupuesto.factores.utilidad,
      costo_directo: resultado.costoDirecto,
      total: resultado.total,
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    if (!presupuesto.id) {
      // Crear nuevo
      const { data, error } = await supabase
        .from('presupuestos')
        .insert(payload as any)
        .select()
        .single();

      if (error) throw error;
      return (data as any).id;
    } else {
      // Actualizar existente
      const { error } = await supabase
        .from('presupuestos')
        .update(payload as any)
        .eq('id', presupuesto.id)
        .eq('user_id', userId);

      if (error) throw error;
      return presupuesto.id;
    }
  } catch (error) {
    console.error('Error guardando presupuesto:', error);
    throw error;
  }
}

/**
 * Elimina un presupuesto
 */
export async function eliminarPresupuesto(id: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('presupuestos')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error eliminando presupuesto:', error);
    return false;
  }
}

/**
 * Duplica un presupuesto
 */
export async function duplicarPresupuesto(
  id: string,
  userId: string,
  nuevoNombre: string
): Promise<string | null> {
  try {
    const presupuesto = await obtenerPresupuesto(id, userId);
    if (!presupuesto) return null;

    const nuevo: PresupuestoCompleto = {
      ...presupuesto,
      id: '',
      proyecto: `${nuevoNombre} (Copia)`,
      created_at: undefined,
      updated_at: undefined,
    };

    return guardarPresupuesto(nuevo, userId);
  } catch (error) {
    console.error('Error duplicando presupuesto:', error);
    return null;
  }
}

/**
 * Obtiene presupuestos por tipología
 */
export async function obtenerPresupuestosPorTipologia(
  userId: string,
  tipologia: string
): Promise<PresupuestoCompleto[]> {
  try {
    const { data, error } = await supabase
      .from('presupuestos')
      .select('*')
      .eq('user_id', userId)
      .eq('tipologia', tipologia)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return (data as any[]).map((p: any) => ({
      id: p.id,
      proyecto: p.proyecto,
      cliente: p.cliente,
      ubicacion: p.ubicacion,
      tipologia: p.tipologia,
      fase: p.fase,
      lineas: p.lineas || [],
      factores: {
        indirectos: p.factor_indirectos || 0,
        administrativos: p.factor_administrativos || 0,
        imprevistos: p.factor_imprevistos || 0,
        utilidad: p.factor_utilidad || 0,
      },
      resultado: {
        costoDirecto: 0,
        costosIndirectos: 0,
        costosAdministrativos: 0,
        costosImprevistos: 0,
        subtotal: 0,
        utilidad: 0,
        total: p.total || 0,
        estimacionDiasTotal: 0,
        precioPorDia: 0,
        margenUtilidad: 0,
        margenRelativo: 0,
      },
      created_at: p.created_at,
      updated_at: p.updated_at,
    }));
  } catch (error) {
    console.error('Error obteniendo presupuestos por tipología:', error);
    return [];
  }
}

/**
 * Obtiene estadísticas de presupuestos
 */
export async function obtenerEstadisticasPresupuestos(userId: string) {
  try {
    const { data, error } = await supabase
      .from('presupuestos')
      .select('total, fase, created_at')
      .eq('user_id', userId);

    if (error || !data) return null;

    const rows = data as any[];
    const total = rows.reduce((sum: number, p: any): number => {
      return sum + (p.total || 0);
    }, 0);
    const promedio = rows.length > 0 ? total / rows.length : 0;
    const mayor = Math.max(...rows.map((p: any): number => p.total || 0));
    const menor = Math.min(...rows.map((p: any): number => p.total || 0));
    const porFase = {
      planeacion: rows.filter((p: any): boolean => p.fase === 'planeación').length,
      ejecucion: rows.filter((p: any): boolean => p.fase === 'ejecución').length,
      pausa: rows.filter((p: any): boolean => p.fase === 'pausa').length,
      finalizado: rows.filter((p: any): boolean => p.fase === 'finalizado').length,
    };

    return {
      totalPresupuestos: rows.length,
      totalMonto: total,
      promedioMonto: promedio,
      mayorMonto: mayor,
      menorMonto: menor,
      porFase,
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return null;
  }
}