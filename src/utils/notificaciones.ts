import { supabase } from '@/lib/supabase';

type TipoNotificacion = 'info' | 'alerta' | 'exito' | 'warning';

export async function crearNotificacion(
  userId: string,
  tipo: TipoNotificacion,
  titulo: string,
  mensaje?: string,
): Promise<void> {
  try {
    await supabase.from('notificaciones').insert({
      user_id: userId,
      tipo,
      titulo,
      mensaje: mensaje || null,
      leido: false,
    } as any);
  } catch (e) {
    console.warn('Error creando notificación:', e);
  }
}