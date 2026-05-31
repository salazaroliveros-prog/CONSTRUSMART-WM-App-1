import { supabase } from '@/lib/supabase';
import type {
  OrdenCompra, CreateOrdenCompra, UpdateOrdenCompra,
  OrdenCompraItem, CreateOrdenCompraItem, UpdateOrdenCompraItem,
  RecepcionOC, CreateRecepcionOC, CreateRecepcionOCItem,
} from '@/types/supabase';
import { dbToOrdenCompra, ordenCompraToDb, dbToOrdenCompraItem, ordenCompraItemToDb, dbToRecepcionOC, recepcionOCToDb, dbToRecepcionOCItem } from '@/types/supabase';

export const OrdenesCompraService = {
  // ====== Órdenes de Compra ======
  async listar(userId: string): Promise<OrdenCompra[]> {
    const { data, error } = await supabase
      .from('ordenes_compra')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(d => dbToOrdenCompra(d));
  },

  async obtener(id: string): Promise<OrdenCompra | null> {
    const { data, error } = await supabase
      .from('ordenes_compra')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data ? dbToOrdenCompra(data) : null;
  },

  async crear(datos: CreateOrdenCompra, userId: string): Promise<OrdenCompra> {
    const dbRecord = ordenCompraToDb(datos as UpdateOrdenCompra);
    const { data, error } = await supabase
      .from('ordenes_compra')
      .insert({ ...dbRecord, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return dbToOrdenCompra(data);
  },

  async actualizar(id: string, datos: UpdateOrdenCompra): Promise<OrdenCompra> {
    const dbRecord = ordenCompraToDb(datos);
    const { data, error } = await supabase
      .from('ordenes_compra')
      .update(dbRecord)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return dbToOrdenCompra(data);
  },

  async eliminar(id: string): Promise<void> {
    const { error } = await supabase.from('ordenes_compra').delete().eq('id', id);
    if (error) throw error;
  },

  // ====== Generar folio ======
  // Genera folio seguro con reintentos para evitar colisiones
  async generarFolio(userId: string): Promise<string> {
    const maxReintentos = 3;
    let intento = 0;

    while (intento < maxReintentos) {
      try {
        // Leer último folio para este usuario
        const { data, error } = await supabase
          .from('ordenes_compra')
          .select('folio')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        const rows = data as any[];
        const ultimo = rows?.[0]?.folio as string || 'OC-202600001';
        
        // Extraer número y año-mes del folio: OC-YYYYMM-XXXXX
        let proximoFolio: string;
        const ahora = new Date();
        const anioMes = `${ahora.getFullYear()}${String(ahora.getMonth() + 1).padStart(2, '0')}`;

        // Si el último folio es del mes actual, incrementar el contador
        if (ultimo.includes(anioMes)) {
          const partes = ultimo.split('-');
          if (partes.length === 3) {
            const contador = parseInt(partes[2], 10) || 0;
            proximoFolio = `OC-${anioMes}-${String(contador + 1).padStart(5, '0')}`;
          } else {
            // Fallback: folio mal formado, generar nuevo
            proximoFolio = `OC-${anioMes}-00001`;
          }
        } else {
          // Nuevo mes, resetear contador
          proximoFolio = `OC-${anioMes}-00001`;
        }

        // Verificar unicidad antes de retornar
        const { data: existente, error: checkError } = await supabase
          .from('ordenes_compra')
          .select('id')
          .eq('folio', proximoFolio)
          .limit(1);

        if (checkError) throw checkError;

        if (!existente || existente.length === 0) {
          return proximoFolio;
        }

        // Si existe, reintentar (incrementar para la próxima iteración)
        intento++;
      } catch (err) {
        console.error(`Intento ${intento + 1} de generar folio falló:`, err);
        intento++;
        if (intento >= maxReintentos) throw err;
      }
    }

    throw new Error('No se pudo generar un folio único después de varios intentos');
  },

  // ====== Items ======
  async listarItems(ordenCompraId: string): Promise<OrdenCompraItem[]> {
    const { data, error } = await supabase
      .from('orden_compra_items')
      .select('*')
      .eq('orden_compra_id', ordenCompraId)
      .order('created_at');
    if (error) throw error;
    return (data || []).map(d => dbToOrdenCompraItem(d));
  },

  async crearItem(datos: CreateOrdenCompraItem): Promise<OrdenCompraItem> {
    const dbRecord = ordenCompraItemToDb(datos as UpdateOrdenCompraItem);
    const { data, error } = await supabase
      .from('orden_compra_items')
      .insert(dbRecord)
      .select()
      .single();
    if (error) throw error;
    return dbToOrdenCompraItem(data);
  },

  async crearItems(items: CreateOrdenCompraItem[]): Promise<OrdenCompraItem[]> {
    const dbRecords = items.map(i => ordenCompraItemToDb(i as UpdateOrdenCompraItem));
    const { data, error } = await supabase
      .from('orden_compra_items')
      .insert(dbRecords)
      .select();
    if (error) throw error;
    return (data || []).map(d => dbToOrdenCompraItem(d));
  },

  async actualizarItem(id: string, datos: UpdateOrdenCompraItem): Promise<void> {
    const dbRecord = ordenCompraItemToDb(datos);
    const { error } = await supabase
      .from('orden_compra_items')
      .update(dbRecord)
      .eq('id', id);
    if (error) throw error;
  },

  async eliminarItem(id: string): Promise<void> {
    const { error } = await supabase.from('orden_compra_items').delete().eq('id', id);
    if (error) throw error;
  },

  // ====== Recepción ======
  async crearRecepcion(datos: CreateRecepcionOC, userId: string): Promise<RecepcionOC> {
    const dbRecord = recepcionOCToDb(datos);
    const { data, error } = await supabase
      .from('recepcion_oc')
      .insert({ ...dbRecord, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return dbToRecepcionOC(data);
  },

  async listarRecepciones(ordenCompraId: string): Promise<RecepcionOC[]> {
    const { data, error } = await supabase
      .from('recepcion_oc')
      .select('*')
      .eq('orden_compra_id', ordenCompraId)
      .order('fecha_recepcion', { ascending: false });
    if (error) throw error;
    return (data || []).map(d => dbToRecepcionOC(d));
  },

  async crearItemsRecepcion(items: CreateRecepcionOCItem[]): Promise<void> {
    const { error } = await supabase.from('recepcion_oc_items').insert(items);
    if (error) throw error;
  },

  async actualizarCantidadRecibida(itemId: string, cantidad: number): Promise<void> {
    const { error } = await supabase
      .from('orden_compra_items')
      .update({ cantidad_recibida: cantidad })
      .eq('id', itemId);
    if (error) throw error;
  },

  async actualizarEstatusOC(ocId: string, estatus: OrdenCompra['estatus']): Promise<void> {
    const { error } = await supabase
      .from('ordenes_compra')
      .update({ estatus })
      .eq('id', ocId);
    if (error) throw error;
  },
};
