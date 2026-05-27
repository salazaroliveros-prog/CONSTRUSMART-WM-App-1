import { supabase } from '@/lib/supabase';
import type { Proveedor, CreateProveedor, UpdateProveedor } from '@/types/supabase';
import { dbToProveedor, proveedorToDb } from '@/types/supabase';

export const ProveedoresService = {
  async listar(userId: string): Promise<Proveedor[]> {
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .eq('user_id', userId)
      .order('nombre');
    if (error) throw error;
    return (data || []).map(d => dbToProveedor(d));
  },

  async obtener(id: string): Promise<Proveedor | null> {
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data ? dbToProveedor(data) : null;
  },

  async crear(datos: CreateProveedor, userId: string): Promise<Proveedor> {
    const dbRecord = proveedorToDb(datos as UpdateProveedor);
    const { data, error } = await supabase
      .from('proveedores')
      .insert({ ...dbRecord, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return dbToProveedor(data);
  },

  async actualizar(id: string, datos: UpdateProveedor): Promise<Proveedor> {
    const dbRecord = proveedorToDb(datos);
    const { data, error } = await supabase
      .from('proveedores')
      .update(dbRecord)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return dbToProveedor(data);
  },

  async eliminar(id: string): Promise<void> {
    const { error } = await supabase.from('proveedores').delete().eq('id', id);
    if (error) throw error;
  },
};
