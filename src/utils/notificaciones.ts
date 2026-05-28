import { NotificacionesService, type TipoNotificacion } from '@/services/NotificacionesService';

export async function crearNotificacion(
  userId: string,
  tipo: TipoNotificacion,
  titulo: string,
  mensaje?: string,
): Promise<void> {
  return NotificacionesService.crear(userId, tipo, titulo, mensaje);
}