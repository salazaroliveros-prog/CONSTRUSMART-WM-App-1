/**
 * RenglonesService v3 — tipado fuerte
 * Servicio avanzado para gestión de renglones, biblioteca de materiales, y cálculo de APU
 */

import { supabase } from '@/lib/supabase';
import type { DBRenglon, DBRenglonUsage, DBRenglonPrecioHistorial } from '@/types/supabase';

export type TipoRenglon = 'material' | 'mano_obra' | 'herramienta' | 'transporte' | 'otro';

export interface Renglon {
  id: string;
  codigo: string;
  descripcion: string;
  tipoRenglon?: TipoRenglon;
  unidad: string;
  rendimiento: number;
  costoMaterial: number;
  costoManoObra: number;
  costoHerramienta: number;
  subrenglones?: SubRenglon[];
  materiales?: MaterialUnitario[];
  categoria?: string;
  etiquetas?: string[];
  tipologia?: string;
  estimacionTiempo?: number;
  dificultad?: 'baja' | 'media' | 'alta';
  equipoRequerido?: string[];
  notas?: string;
  favorito?: boolean;
  frecuenciaUso?: number;
  ultimoUso?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
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
  especificaciones?: string;
}

export interface HistorialPrecio {
  rengloId: string;
  fecha: string;
  costo: number;
  variacion: number;
}

const TABLE_RENGLONES = 'renglones' as const;
const TABLE_USAGE = 'renglon_usage' as const;
const TABLE_HISTORIAL = 'renglon_precios_historial' as const;

export function dbToRenglon(db: DBRenglon & Record<string, unknown>): Renglon {
  return {
    id: db.id ?? '',
    codigo: db.codigo ?? '',
    descripcion: db.descripcion ?? '',
    tipoRenglon: db.tipo_renglon as TipoRenglon | undefined,
    unidad: db.unidad ?? '',
    rendimiento: Number(db.rendimiento) || 0,
    costoMaterial: Number(db.costo_material) || 0,
    costoManoObra: Number(db.costo_mano_obra) || 0,
    costoHerramienta: Number(db.costo_herramienta) || 0,
    categoria: db.categoria as string | undefined,
    activo: db.activo !== false,
    created_at: db.created_at ?? undefined,
    updated_at: db.updated_at ?? undefined,
  };
}

const EXTRA_FIELDS = [
  'tipo_renglon', 'categoria', 'etiquetas', 'tipologia', 'estimacion_tiempo',
  'dificultad', 'equipo_requerido', 'notas', 'favorito', 'frecuencia_uso',
  'ultimo_uso', 'activo', 'subrenglones', 'materiales',
] as const;

export function renglonToDb(renglon: Partial<Renglon>): Partial<DBRenglon> & Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (renglon.codigo !== undefined) out.codigo = renglon.codigo;
  if (renglon.descripcion !== undefined) out.descripcion = renglon.descripcion;
  if (renglon.tipoRenglon !== undefined) out.tipo_renglon = renglon.tipoRenglon;
  if (renglon.unidad !== undefined) out.unidad = renglon.unidad;
  if (renglon.rendimiento !== undefined) out.rendimiento = renglon.rendimiento;
  if (renglon.costoMaterial !== undefined) out.costo_material = renglon.costoMaterial;
  if (renglon.costoManoObra !== undefined) out.costo_mano_obra = renglon.costoManoObra;
  if (renglon.costoHerramienta !== undefined) out.costo_herramienta = renglon.costoHerramienta;
  if (renglon.subrenglones !== undefined) out.subrenglones = renglon.subrenglones;
  if (renglon.materiales !== undefined) out.materiales = renglon.materiales;
  if (renglon.categoria !== undefined) out.categoria = renglon.categoria;
  if (renglon.etiquetas !== undefined) out.etiquetas = renglon.etiquetas;
  if (renglon.tipologia !== undefined) out.tipologia = renglon.tipologia;
  if (renglon.estimacionTiempo !== undefined) out.estimacion_tiempo = renglon.estimacionTiempo;
  if (renglon.dificultad !== undefined) out.dificultad = renglon.dificultad;
  if (renglon.equipoRequerido !== undefined) out.equipo_requerido = renglon.equipoRequerido;
  if (renglon.notas !== undefined) out.notas = renglon.notas;
  if (renglon.favorito !== undefined) out.favorito = renglon.favorito;
  if (renglon.frecuenciaUso !== undefined) out.frecuencia_uso = renglon.frecuenciaUso;
  if (renglon.ultimoUso !== undefined) out.ultimo_uso = renglon.ultimoUso;
  if (renglon.activo !== undefined) out.activo = renglon.activo;
  return out as Partial<DBRenglon> & Record<string, unknown>;
}

export interface ResultadoBusqueda {
  renglon: Renglon;
  relevancia: number;
  razonCoincidencia: string;
}

// Biblioteca base de renglones comunes
export const RENGLONES_BASE: Renglon[] = [
  {
    id: '1',
    codigo: 'CIMEX001',
    descripcion: 'Excavación manual en tierra',
    unidad: 'm³',
    rendimiento: 3,
    costoMaterial: 0,
    costoManoObra: 150000,
    costoHerramienta: 20000,
    categoria: 'movimiento de tierra',
    tipologia: 'civil',
    dificultad: 'media',
    activo: true,
    materiales: [
      { id: '1', nombre: 'Pala', cantidad: 1, unidad: 'un', costoUnitario: 50000 },
      { id: '2', nombre: 'Pico', cantidad: 1, unidad: 'un', costoUnitario: 60000 },
    ],
  },
  {
    id: '2',
    codigo: 'CIMEX002',
    descripcion: 'Concreto f\'c=210 kg/cm² incluye transporte',
    unidad: 'm³',
    rendimiento: 5,
    costoMaterial: 450000,
    costoManoObra: 200000,
    costoHerramienta: 50000,
    categoria: 'concreto',
    tipologia: 'general',
    dificultad: 'media',
    activo: true,
  },
  {
    id: '3',
    codigo: 'STRUCT001',
    descripcion: 'Armadura de acero fy=420 Mpa',
    unidad: 'kg',
    rendimiento: 50,
    costoMaterial: 3500,
    costoManoObra: 1000,
    costoHerramienta: 500,
    categoria: 'acero',
    tipologia: 'general',
    dificultad: 'media',
    activo: true,
    materiales: [
      { id: '1', nombre: 'Varilla #4', cantidad: 1, unidad: 'kg', costoUnitario: 3500 },
      { id: '2', nombre: 'Alambre #18', cantidad: 0.1, unidad: 'kg', costoUnitario: 2000 },
    ],
  },
];

/**
 * Obtiene la biblioteca de renglones del usuario
 */
export async function obtenerBibliotecaRenglones(userId: string): Promise<Renglon[]> {
  try {
    const { data, error } = await supabase
      .from(TABLE_RENGLONES)
      .select('*')
      .eq('user_id', userId)
      .eq('activo', true)
      .order('codigo');

    if (error) {
      console.warn('No se pudo obtener biblioteca personalizada, usando base:', error);
      return RENGLONES_BASE;
    }

    return (data ?? []).map(dbToRenglon);
  } catch (error) {
    console.error('Error obteniendo biblioteca:', error);
    return RENGLONES_BASE;
  }
}

/**
 * Busca renglones en la biblioteca
 */
export function buscarRenglones(
  renglones: Renglon[],
  termino: string,
  filtros?: {
    categoria?: string;
    tipologia?: string;
    dificultad?: string;
  }
): Renglon[] {
  let resultados = renglones;

  if (termino.trim()) {
    const term = termino.toLowerCase();
    resultados = resultados.filter(
      (r) =>
        r.codigo.toLowerCase().includes(term) ||
        r.descripcion.toLowerCase().includes(term) ||
        (r.categoria?.toLowerCase().includes(term) ?? false)
    );
  }

  if (filtros?.categoria) {
    resultados = resultados.filter((r) => r.categoria === filtros.categoria);
  }
  if (filtros?.tipologia) {
    resultados = resultados.filter((r) => r.tipologia === filtros.tipologia);
  }
  if (filtros?.dificultad) {
    resultados = resultados.filter((r) => r.dificultad === filtros.dificultad);
  }

  return resultados;
}

/**
 * Obtiene renglones frecuentes del usuario (historial)
 */
export async function obtenerRenglonesFreuentes(
  userId: string,
  limite: number = 10
): Promise<Renglon[]> {
  try {
    const { data, error } = await supabase
      .from(TABLE_USAGE)
      .select('renglon_id')
      .eq('user_id', userId)
      .limit(limite);

    if (error || !data || data.length === 0) return [];

    const ids = data.map((d) => d.renglon_id);
    const { data: renglones } = await supabase
      .from(TABLE_RENGLONES)
      .select('*')
      .in('id', ids);

    return (renglones ?? []).map(dbToRenglon);
  } catch (error) {
    console.error('Error obteniendo renglones frecuentes:', error);
    return [];
  }
}

/**
 * Crea un renglon personalizado
 */
export async function crearRenglon(renglon: Omit<Renglon, 'id'>, userId: string): Promise<string | null> {
  try {
    const payload = {
      ...renglonToDb(renglon),
      user_id: userId,
      created_at: new Date().toISOString(),
    } satisfies Partial<DBRenglon> & Record<string, unknown>;

    const { data, error } = await supabase
      .from(TABLE_RENGLONES)
      .insert(payload)
      .select('id')
      .single<{ id: string }>();

    if (error || !data) throw error || new Error('No se pudo crear renglon');

    // Registrar precio inicial en historial
    const costoTotal = (renglon.costoMaterial ?? 0) + (renglon.costoManoObra ?? 0) + (renglon.costoHerramienta ?? 0);
    if (costoTotal > 0) {
      try {
        await supabase.from(TABLE_HISTORIAL).insert({
          renglon_id: data.id,
          costo_material: renglon.costoMaterial ?? 0,
          costo_mano_obra: renglon.costoManoObra ?? 0,
          costo_herramienta: renglon.costoHerramienta ?? 0,
          user_id: userId,
        } satisfies Partial<DBRenglonPrecioHistorial>);
      } catch (e) {
        console.warn('Error registrando precio inicial:', e);
      }
    }

    return data.id;
  } catch (error) {
    console.error('Error creando renglon:', error);
    return null;
  }
}

/**
 * Actualiza un renglon
 */
export async function actualizarRenglon(
  id: string,
  cambios: Partial<Renglon>,
  userId: string
): Promise<boolean> {
  try {
    const payload = {
      ...renglonToDb(cambios),
      updated_at: new Date().toISOString(),
    } satisfies Partial<DBRenglon> & Record<string, unknown>;

    const { error } = await supabase
      .from(TABLE_RENGLONES)
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    // Registrar historial si cambiaron precios
    const tieneCambioPrecio =
      cambios.costoMaterial !== undefined ||
      cambios.costoManoObra !== undefined ||
      cambios.costoHerramienta !== undefined;
    if (tieneCambioPrecio) {
      const costoTotal =
        (cambios.costoMaterial ?? 0) +
        (cambios.costoManoObra ?? 0) +
        (cambios.costoHerramienta ?? 0);
      if (costoTotal > 0) {
        try {
          await supabase.from(TABLE_HISTORIAL).insert({
            renglon_id: id,
            costo_material: cambios.costoMaterial ?? 0,
            costo_mano_obra: cambios.costoManoObra ?? 0,
            costo_herramienta: cambios.costoHerramienta ?? 0,
            user_id: userId,
          } satisfies Partial<DBRenglonPrecioHistorial>);
        } catch (e) {
          console.warn('Error registrando historial de precio:', e);
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error actualizando renglon:', error);
    return false;
  }
}

/**
 * Elimina un renglon (soft delete)
 */
export async function eliminarRenglon(id: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(TABLE_RENGLONES)
      .update({ activo: false, updated_at: new Date().toISOString() } satisfies Partial<DBRenglon>)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error eliminando renglon:', error);
    return false;
  }
}

/**
 * Clona un renglon
 */
export async function clonarRenglon(id: string, userId: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from(TABLE_RENGLONES)
      .select('*')
      .eq('id', id)
      .single<DBRenglon>();

    if (!data) return null;

    const renglonApp = dbToRenglon(data);
    const copia: Omit<Renglon, 'id'> = {
      ...renglonApp,
      codigo: `${renglonApp.codigo}-COPIA`,
      descripcion: `${renglonApp.descripcion} (Copia)`,
    };

    return crearRenglon(copia, userId);
  } catch (error) {
    console.error('Error clonando renglon:', error);
    return null;
  }
}

/**
 * Importa renglones desde CSV
 */
export async function importarRenglonesDesdeCSV(
  csv: string,
  userId: string
): Promise<{ exitosos: number; errores: string[] }> {
  const errores: string[] = [];
  let exitosos = 0;

  const lineas = csv.split('\n').slice(1);

  for (const linea of lineas) {
    if (!linea.trim()) continue;

    try {
      const [codigo, descripcion, unidad, rendimiento, costoMaterial, costoManoObra, costoHerramienta] =
        linea.split(',');

      const renglon: Omit<Renglon, 'id'> = {
        codigo: codigo?.trim() || '',
        descripcion: descripcion?.trim() || '',
        unidad: unidad?.trim() || '',
        rendimiento: parseFloat(rendimiento) || 0,
        costoMaterial: parseFloat(costoMaterial) || 0,
        costoManoObra: parseFloat(costoManoObra) || 0,
        costoHerramienta: parseFloat(costoHerramienta) || 0,
        activo: true,
      };

      const id = await crearRenglon(renglon, userId);
      if (id) exitosos++;
      else {
        const lineaSanitizada = linea.replace(/[\r\n\t]/g, ' ').slice(0, 200);
        errores.push(`Fila: ${lineaSanitizada} - Error desconocido`);
      }
    } catch (error) {
      const lineaSanitizada = linea.replace(/[\r\n\t]/g, ' ').slice(0, 200);
      errores.push(`Fila: ${lineaSanitizada} - ${String(error)}`);
    }
  }

  return { exitosos, errores };
}

/**
 * Obtiene categorías disponibles
 */
export function obtenerCategorias(): string[] {
  return [
    'movimiento de tierra', 'concreto', 'acero', 'carpintería',
    'albañilería', 'acabados', 'electricidad', 'plomería',
    'pintura', 'vidrios', 'herrería', 'varios',
  ];
}

/**
 * Obtiene tipologías disponibles
 */
export function obtenerTipologias(): string[] {
  return ['general', 'residencial', 'comercial', 'industrial', 'civil', 'pública'];
}

/**
 * Registra uso de un renglon (para historial)
 */
export async function registrarUsoRenglon(
  renglonId: string,
  presupuestoId: string,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from(TABLE_USAGE).insert({
      renglon_id: renglonId,
      presupuesto_id: presupuestoId,
      user_id: userId,
      created_at: new Date().toISOString(),
    } satisfies Partial<DBRenglonUsage>);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error registrando uso:', error);
    return false;
  }
}

/**
 * Búsqueda avanzada con relevancia
 */
export function buscarAvanzado(
  renglones: Renglon[],
  termino: string,
  opciones?: {
    tipo?: TipoRenglon;
    categoria?: string;
    soloFavoritos?: boolean;
    limite?: number;
  }
): ResultadoBusqueda[] {
  const terminoLower = termino.toLowerCase();
  const resultados: ResultadoBusqueda[] = [];

  let candidatos = renglones.filter((r) => r.activo);

  if (opciones?.tipo) {
    candidatos = candidatos.filter((r) => r.tipoRenglon === opciones.tipo);
  }
  if (opciones?.categoria) {
    candidatos = candidatos.filter(
      (r) => r.categoria?.toLowerCase() === opciones.categoria!.toLowerCase()
    );
  }
  if (opciones?.soloFavoritos) {
    candidatos = candidatos.filter((r) => r.favorito);
  }

  candidatos.forEach((renglon) => {
    let relevancia = 0;
    let razon = '';

    if (renglon.codigo.toLowerCase().includes(terminoLower)) {
      relevancia = 100;
      razon = 'Código coincide exactamente';
    } else if (renglon.descripcion.toLowerCase().includes(terminoLower)) {
      relevancia = 80;
      razon = 'Descripción contiene el término';
    } else if (renglon.etiquetas?.some((e) => e.toLowerCase().includes(terminoLower))) {
      relevancia = 60;
      razon = 'Etiqueta coincide';
    } else if (renglon.categoria?.toLowerCase().includes(terminoLower)) {
      relevancia = 40;
      razon = 'Categoría coincide';
    }

    if (relevancia > 0) {
      if (renglon.favorito) relevancia = Math.min(100, relevancia + 15);
      if (renglon.frecuenciaUso) relevancia += Math.min(10, renglon.frecuenciaUso / 5);
      resultados.push({
        renglon,
        relevancia: Math.round(relevancia),
        razonCoincidencia: razon,
      });
    }
  });

  resultados.sort((a, b) => b.relevancia - a.relevancia);
  return resultados.slice(0, opciones?.limite || 20);
}

/**
 * Toggle de favorito
 */
export async function toggleFavorito(id: string, userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from(TABLE_RENGLONES)
      .select('favorito')
      .eq('id', id)
      .eq('user_id', userId)
      .single<{ favorito: boolean }>();

    if (!data) return false;

    const { error } = await supabase
      .from(TABLE_RENGLONES)
      .update({ favorito: !data.favorito, updated_at: new Date().toISOString() } satisfies Partial<DBRenglon>)
      .eq('id', id)
      .eq('user_id', userId);

    return !error;
  } catch (error) {
    console.error('Error toggleando favorito:', error);
    return false;
  }
}

/**
 * Obtiene favoritos del usuario
 */
export async function obtenerFavoritos(userId: string): Promise<Renglon[]> {
  try {
    const { data } = await supabase
      .from(TABLE_RENGLONES)
      .select('*')
      .eq('user_id', userId)
      .eq('favorito', true)
      .eq('activo', true)
      .order('frecuencia_uso', { ascending: false, nullsFirst: false });

    return (data ?? []).map(dbToRenglon);
  } catch (error) {
    console.error('Error obteniendo favoritos:', error);
    return [];
  }
}

/**
 * Calcula tendencia de precios
 */
export async function calcularTendenciaPrecios(
  renglonId: string
): Promise<{
  tendencia: 'alza' | 'baja' | 'estable';
  variacionPorcentaje: number;
  periodoAnalisis: string;
}> {
  try {
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    const { data: historial } = await supabase
      .from(TABLE_HISTORIAL)
      .select('*')
      .eq('renglon_id', renglonId)
      .gte('created_at', hace30Dias.toISOString())
      .order('created_at', { ascending: false });

    if (!historial || historial.length < 2) {
      return { tendencia: 'estable', variacionPorcentaje: 0, periodoAnalisis: 'Datos insuficientes' };
    }

    const getCostoTotal = (h: DBRenglonPrecioHistorial) =>
      (h.costo_material ?? 0) + (h.costo_mano_obra ?? 0) + (h.costo_herramienta ?? 0);

    const precioFinal = getCostoTotal(historial[0]);
    const precioInicial = getCostoTotal(historial[historial.length - 1]);
    const variacion = precioInicial === 0 ? 0 : ((precioFinal - precioInicial) / precioInicial) * 100;

    return {
      tendencia: Math.abs(variacion) < 2 ? 'estable' : variacion > 0 ? 'alza' : 'baja',
      variacionPorcentaje: Math.round(variacion * 100) / 100,
      periodoAnalisis: `${historial.length} registros en 30 días`,
    };
  } catch (error) {
    console.error('Error calculando tendencia:', error);
    return { tendencia: 'estable', variacionPorcentaje: 0, periodoAnalisis: 'Error en el cálculo' };
  }
}

/**
 * Obtiene estadísticas del catálogo
 */
export function obtenerEstadisticasCatalogo(renglones: Renglon[]): {
  total: number;
  porTipo: Record<string, number>;
  porCategoria: Record<string, number>;
  favoritos: number;
  precioPromedio: number;
  precioMinimo: number;
  precioMaximo: number;
} {
  const totalCostos = renglones.reduce((sum, r) => {
    return sum + (r.costoMaterial || 0) + (r.costoManoObra || 0) + (r.costoHerramienta || 0);
  }, 0);

  const porTipo: Record<string, number> = {};
  const porCategoria: Record<string, number> = {};

  renglones.forEach((r) => {
    if (r.tipoRenglon) porTipo[r.tipoRenglon] = (porTipo[r.tipoRenglon] || 0) + 1;
    if (r.categoria) porCategoria[r.categoria] = (porCategoria[r.categoria] || 0) + 1;
  });

  const precios = renglones.map((r) => (r.costoMaterial || 0) + (r.costoManoObra || 0) + (r.costoHerramienta || 0));

  return {
    total: renglones.length,
    porTipo,
    porCategoria,
    favoritos: renglones.filter((r) => r.favorito).length,
    precioPromedio: renglones.length > 0 ? totalCostos / renglones.length : 0,
    precioMinimo: precios.length > 0 ? Math.min(...precios) : 0,
    precioMaximo: precios.length > 0 ? Math.max(...precios) : 0,
  };
}

/**
 * Exporta catálogo a JSON
 */
export function exportarCatalogoJSON(renglones: Renglon[]): {
  renglones: Renglon[];
  exportadoEn: string;
  total: number;
} {
  const activos = renglones.filter((r) => r.activo);
  return {
    renglones: activos,
    exportadoEn: new Date().toISOString(),
    total: activos.length,
  };
}

/**
 * Sugiere renglones similares basado en historial
 */
export function sugerirSimilares(
  renglon: Renglon,
  catalogo: Renglon[],
  limite: number = 5
): Renglon[] {
  return catalogo
    .filter(
      (r) =>
        r.id !== renglon.id &&
        r.activo &&
        (r.categoria === renglon.categoria ||
          r.tipoRenglon === renglon.tipoRenglon ||
          r.dificultad === renglon.dificultad)
    )
    .slice(0, limite);
}

export default {
  obtenerBibliotecaRenglones,
  buscarRenglones,
  buscarAvanzado,
  obtenerRenglonesFreuentes,
  obtenerFavoritos,
  crearRenglon,
  actualizarRenglon,
  eliminarRenglon,
  clonarRenglon,
  importarRenglonesDesdeCSV,
  obtenerCategorias,
  obtenerTipologias,
  registrarUsoRenglon,
  toggleFavorito,
  calcularTendenciaPrecios,
  obtenerEstadisticasCatalogo,
  exportarCatalogoJSON,
  sugerirSimilares,
  RENGLONES_BASE,
};