import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

export type AuthStateChangeSubscription = ReturnType<typeof supabase.auth.onAuthStateChange>;
export type AuthStateChangeCallback = (event: string, session: Session | null) => Promise<void> | void;

export const AuthService = {
  async getSession(): Promise<{ session: Session | null; error: Error | null }> {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error: error || null };
  },

  onAuthStateChange(callback: AuthStateChangeCallback): AuthStateChangeSubscription {
    return supabase.auth.onAuthStateChange(callback);
  },

  async signInWithPassword(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { success: !error, error: error?.message };
  },

  async signUpWithEmail(email: string, password: string, nombre: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } },
    });
    return { success: !error, error: error?.message };
  },

  async signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    return { success: !error, error: error?.message };
  },

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { success: !error, error: error?.message };
  },

  async signOut(): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.auth.signOut();
    return { success: !error, error: error?.message };
  },
};
