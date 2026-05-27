import { supabase } from '@/lib/supabase';
import { ChecklistItem } from '@/types/supabase';

export const ChecklistService = {
  async getChecklist(presupuestoId: string, fase?: string) {
    let query = supabase
      .from('checklist_items')
      .select('*')
      .eq('presupuesto_id', presupuestoId);
    
    if (fase) {
      query = query.eq('fase', fase);
    }
    
    const { data, error } = await query.order('created_at');
    if (error) throw error;
    return data as any[];
  },

  async addItems(items: any[]) {
    const { data, error } = await supabase
      .from('checklist_items')
      .insert(items)
      .select();
    if (error) throw error;
    return data;
  },

  async addItem(item: Omit<ChecklistItem, 'id' | 'completado' | 'foto_url' | 'completado_por' | 'completado_en' | 'created_at'>) {
    const { data, error } = await supabase
      .from('checklist_items')
      .insert(item)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async toggleItem(id: string, completado: boolean, userId: string | null) {
    const { data, error } = await supabase
      .from('checklist_items')
      .update({
        completado,
        completado_por: completado ? userId : null,
        completado_en: completado ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteItem(id: string) {
    const { error } = await supabase
      .from('checklist_items')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};
