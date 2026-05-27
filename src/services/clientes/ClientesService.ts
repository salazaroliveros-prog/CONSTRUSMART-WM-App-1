import { supabase } from '@/lib/supabase';
import type { Cliente, CreateCliente, UpdateCliente } from '@/types/supabase';
import { dbToCliente, clienteToDb } from '@/types/supabase';

export const ClientesService = {
  async getClientes(userId: string) {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(dbToCliente) as Cliente[];
  },

  async addCliente(cliente: CreateCliente, userId: string) {
    const dbRecord = clienteToDb(cliente as UpdateCliente);
    const { data, error } = await supabase
      .from('clientes')
      .insert({ ...dbRecord, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return dbToCliente(data) as Cliente;
  },

  async updateCliente(id: string, cliente: UpdateCliente, userId: string) {
    const dbRecord = clienteToDb(cliente);
    const { data, error } = await supabase
      .from('clientes')
      .update(dbRecord)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return dbToCliente(data) as Cliente;
  },

  async deleteCliente(id: string, userId: string) {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  },
};
