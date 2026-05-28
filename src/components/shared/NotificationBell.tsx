import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { PushService } from '@/services/PushService'; // Import PushService
import { toast } from 'sonner';
import { Bell, Check, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Placeholder for notification type (adjust as needed)
type Notification = {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: 'info' | 'alerta' | 'exito' | 'warning';
  leido: boolean;
  created_at: string;
  accion_url?: string;
};

const NotificationBell: React.FC = () => {
  const { session, notifications = [], markNotificationAsRead, deleteNotification } = useAppContext();
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);

  const checkSubscription = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return setIsSubscribed(false);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error("Error checking subscription:", err);
      setIsSubscribed(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      checkSubscription();
    } else {
      setIsSubscribed(false);
    }
  }, [session, checkSubscription]);

  const handleToggleSubscription = async () => {
    if (loadingSubscription) return;
    setLoadingSubscription(true);
    try {
      if (isSubscribed) {
        await PushService.unsubscribe();
        setIsSubscribed(false);
        toast.success('Suscripción a notificaciones cancelada');
      } else {
        await PushService.requestPermissionAndSubscribe();
        setIsSubscribed(true);
      }
    } catch (err) {
      console.error('Error toggling subscription:', err);
      toast.error('Error al cambiar el estado de la suscripción');
    } finally {
      setLoadingSubscription(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.leido).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative p-2 hover:bg-accent/10 rounded-lg">
          {unreadCount > 0 && <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">{unreadCount}</span>}
          <Bell className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0" onCloseAutoFocus={e => e.preventDefault()}> {/* Prevent closing on click outside */}
        <DropdownMenuLabel className="flex items-center justify-between p-3 border-b">
          <div className="font-bold">Notificaciones</div>
          <div className="flex items-center gap-2">
             {isSubscribed === null ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <Button onClick={handleToggleSubscription} disabled={loadingSubscription} className="h-7 px-2 text-xs">
                  {loadingSubscription ? 'Procesando...' : isSubscribed ? 'Darse de baja' : 'Suscribirse'}
                </Button>
              )}
          </div>
        </DropdownMenuLabel>
        <ScrollArea className="h-[300px] px-3">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No hay notificaciones</div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`p-3 rounded-lg flex items-start gap-3 my-2 cursor-pointer transition-colors ${n.leido ? 'bg-muted/20 hover:bg-muted/40' : 'bg-accent/10 hover:bg-accent/30 border border-accent'}`}>
                <Avatar className="h-8 w-8">
                  {/* Placeholder for notification type icon */}
                  <AvatarImage src="/path/to/avatar.png" /> {/* Replace with actual icon */}
                  <AvatarFallback className={`bg-blue-500`}>
                    {/* Dynamic fallback based on notification type */}
                    {n.tipo === 'exito' && <Check className="h-4 w-4 text-white" />}
                    {n.tipo === 'alerta' && <XCircle className="h-4 w-4 text-white" />}
                    {n.tipo === 'warning' && <XCircle className="h-4 w-4 text-white" />}
                    {n.tipo === 'info' && <Bell className="h-4 w-4 text-white" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-semibold text-sm flex items-center justify-between">
                    {n.titulo}
                    {!n.leido && <span className="text-xs text-red-500 font-light">Nuevo</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{n.mensaje}</p>
                  <div className="text-xs text-muted-foreground/70">
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex flex-col justify-between items-center">
                  {!n.leido && (
                    <Button variant="ghost" size="icon" onClick={() => markNotificationAsRead(n.id)} className="text-blue-500 hover:bg-blue-500/10 h-7 w-7">
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => deleteNotification(n.id)} className="text-red-500 hover:bg-red-500/10 h-7 w-7">
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;

