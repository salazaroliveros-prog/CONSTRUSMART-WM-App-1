import { supabase } from '@/lib/supabase';
import type { ChecklistItem } from '@/types/supabase';

const TABLE = 'checklist_items' as const;

export const ChecklistService = {
  async getChecklist(presupuestoId: string, fase?: string): Promise<ChecklistItem[]> {
    let query = supabase
      .from(TABLE)
      .select('*')
      .eq('presupuesto_id', presupuestoId)
      .order('created_at', { ascending: true });

    if (fase) {
      query = query.eq('fase', fase);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as ChecklistItem[];
  },

  async addItems(items: Partial<ChecklistItem>[]): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .insert(items);
    if (error) throw error;
  },

  async addItem(item: Omit<ChecklistItem, 'id' | 'completado' | 'foto_url' | 'completado_por' | 'completado_en' | 'created_at'>): Promise<ChecklistItem> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert(item)
      .select()
      .single<ChecklistItem>();
    if (error) throw error;
    if (!data) throw new Error('No se pudo crear item del checklist');
    return data;
  },

  async toggleItem(id: string, completado: boolean, userId: string | null): Promise<ChecklistItem> {
    const { data, error } = await supabase
      .from(TABLE)
      .update({
        completado,
        completado_por: completado ? userId : null,
        completado_en: completado ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .select()
      .single<ChecklistItem>();
    if (error) throw error;
    if (!data) throw new Error('No se pudo actualizar item');
    return data;
  },

  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};