import { supabase } from '@/lib/supabase';
import { ChecklistItem } from '@/types/supabase';

export const ChecklistService = {
  async getChecklist(presupuestoId: string, fase: string) {
    const { data, error } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('presupuesto_id', presupuestoId)
      .eq('fase', fase)
      .order('created_at');
    if (error) throw error;
    return data as ChecklistItem[];
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
