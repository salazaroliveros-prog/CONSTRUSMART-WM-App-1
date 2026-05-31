import { supabase } from '@/lib/supabase';
import type { DBEmpleado } from '@/types/supabase';
import type { Empleado, CreateEmpleado, UpdateEmpleado } from '@/types/supabase';

const TABLE = 'empleados' as const;

export const EmpleadoService = {
  async listar(userId: string): Promise<Empleado[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('nombre');

    if (error) throw error;
    return (data || []) as unknown as Empleado[];
  },

  async crear(payload: Partial<DBEmpleado>): Promise<Empleado> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Empleado;
  },

  async actualizar(id: string, userId: string, payload: Partial<DBEmpleado>): Promise<Empleado> {
    const { data, error } = await supabase
      .from(TABLE)
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Empleado;
  },

  async eliminar(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async getPorId(id: string): Promise<Empleado | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as unknown as Empleado;
  }
};
