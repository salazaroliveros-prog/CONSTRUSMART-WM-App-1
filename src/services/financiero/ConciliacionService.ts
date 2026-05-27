import { supabase } from '@/lib/supabase';

export interface Conciliacion {
  id?: string;
  user_id: string;
  banco: string;
  periodo: string;
  saldo_libros: number;
  saldo_banco: number;
  diferencia?: number;
  conciliado?: boolean;
  notas?: string;
  proyecto_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PartidaConciliacion {
  id?: string;
  conciliacion_id: string;
  tipo: 'pendiente_libros' | 'pendiente_banco' | 'ajuste';
  monto: number;
  descripcion: string;
  fecha: string;
  aplicado: boolean;
}

export const ConciliacionService = {
  async getConciliaciones(userId: string, limit = 10) {
    const { data, error } = await supabase
      .from('conciliaciones')
      .select('*')
      .eq('user_id', userId)
      .order('periodo', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as Conciliacion[];
  },

  async getConciliacionPorProyecto(proyectoId: string) {
    const { data, error } = await supabase
      .from('conciliaciones')
      .select('*, partidas_conciliacion(*)')
      .eq('proyecto_id', proyectoId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async crearConciliacion(conciliacion: Conciliacion) {
    const { data, error } = await supabase
      .from('conciliaciones')
      .insert(conciliacion)
      .select()
      .single();

    if (error) throw error;
    return data as Conciliacion;
  },

  async upsertConciliacion(conciliacion: Conciliacion) {
    const { data, error } = await supabase
      .from('conciliaciones')
      .upsert(conciliacion, { onConflict: 'proyecto_id', ignoreDuplicates: false })
      .select()
      .single();

    if (error) throw error;
    return data as Conciliacion;
  },

  async updatePartida(id: string, aplicado: boolean) {
    const { error } = await supabase
      .from('partidas_conciliacion')
      .update({ aplicado })
      .eq('id', id);

    if (error) throw error;
  }
};
