import { supabase } from '@/lib/supabase';
import type { Empleado, CreateEmpleado } from '@/types/supabase';

const dbToEmpleado = (d: Record<string, unknown>): Empleado => ({
  id: d.id as string,
  user_id: d.user_id as string,
  nombre: d.nombre as string,
  puesto: d.puesto as string,
  telefono: (d.telefono as string) || '',
  salario_diario: Number(d.salario_diario) || 0,
  activo: d.activo as boolean ?? true,
  created_at: d.created_at as string,
});

export const EmpleadoService = {
  async listar(userId: string): Promise<Empleado[]> {
    const { data, error } = await supabase
      .from('empleados')
      .select('*')
      .eq('user_id', userId)
      .order('nombre');
    if (error) throw error;
    return (data || []).map(d => dbToEmpleado(d));
  },

  async crear(datos: CreateEmpleado, userId: string): Promise<Empleado> {
    const { data, error } = await supabase
      .from('empleados')
      .insert({ ...datos, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return dbToEmpleado(data);
  },

  async actualizar(id: string, datos: Partial<CreateEmpleado>): Promise<Empleado> {
    const { data, error } = await supabase
      .from('empleados')
      .update(datos)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return dbToEmpleado(data);
  },

  async eliminar(id: string): Promise<void> {
    const { error } = await supabase.from('empleados').delete().eq('id', id);
    if (error) throw error;
  },
};
