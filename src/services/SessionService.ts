/**
 * Servicio centralizado para acceso a sesión y usuario actual.
 * Evita llamadas directas a supabase.auth.getUser() dispersas en el código.
 */
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface UserInfo {
  id: string;
  email?: string;
  nombre?: string;
  avatarUrl?: string;
}

export class SessionService {
  /**
   * Obtiene el usuario actual autenticado desde Supabase.
   * Con manejo centralizado de errores.
   */
  static async getCurrentUser(): Promise<UserInfo | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.warn('[SessionService] Error fetching user:', error.message);
        return null;
      }
      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        nombre: user.user_metadata?.nombre || user.email?.split('@')[0],
        avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture,
      };
    } catch (err) {
      console.error('[SessionService] Unexpected error in getCurrentUser:', err);
      return null;
    }
  }

  /**
   * Obtiene solo el ID del usuario, más eficiente si solo necesitas eso.
   */
  static async getUserId(): Promise<string | null> {
    try {
      const user = await this.getCurrentUser();
      return user?.id || null;
    } catch {
      return null;
    }
  }
}
