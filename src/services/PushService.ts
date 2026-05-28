import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const PushService = {
  async requestPermissionAndSubscribe() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.warn('Push notifications not supported in this browser.');
      return null;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permiso de notificaciones denegado');
      }

      const registration = await navigator.serviceWorker.ready;
      // En una app real de producción, necesitarías la clave pública de VAPID.
      const publicKey = 'BEl66ihSgAd9b6GzAs-TjP6n6N6_6N6_6N6_6N6_6N6_6N6_6N6_6N6_6N6_6N6_6N6_6N6_6N6_6N6_'; 
      
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publicKey
        });
      }

      await this.saveToken(JSON.stringify(subscription));
      toast.success('Suscripción a notificaciones push activada');
      return subscription;
    } catch (err) {
      console.error('Error al suscribir a push:', err);
      toast.error('Error al activar notificaciones push');
      throw err;
    }
  },

  async saveToken(token: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('device_tokens')
      .insert({
        user_id: user.id,
        token,
        platform: 'web'
      });

    if (error) console.error('Error saving device token:', error);
  },

  async unsubscribe() {
    if (!('serviceWorker' in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('device_tokens')
            .delete()
            .eq('user_id', user.id)
            .eq('token', JSON.stringify(subscription));
        }
        toast.success('Suscripción a notificaciones cancelada');
      }
    } catch (err) {
      console.error('Error unsubscribing from push:', err);
    }
  }
};
