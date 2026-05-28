import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

export const PushService = {
  async requestPermissionAndSubscribe() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.warn('Push notifications not supported in this browser.');
      return null;
    }

    const publicKey = import.meta.env.VITE_PUBLIC_VAPID_KEY?.trim()
    if (!publicKey) {
      console.warn('VAPID public key no configurada. Se omite suscripción a push.');
      return null;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permiso de notificaciones denegado');
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
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
