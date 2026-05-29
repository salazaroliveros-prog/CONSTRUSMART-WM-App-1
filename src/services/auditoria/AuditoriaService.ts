import { supabase } from '@/lib/supabase';

export const AuditoriaService = {
  async log(tabla: string, registroId: string, accion: 'INSERT' | 'UPDATE' | 'DELETE', anterior: any, nuevo: any, userId: string) {
    const { error } = await (supabase
      .from('audit_log') as any)
      .insert({
        user_id: userId,
        tabla,
        registro_id: registroId,
        accion,
        valor_anterior: anterior,
        valor_nuevo: nuevo
      });
    if (error) console.error('Error en AuditoriaService:', error);
  }
};
