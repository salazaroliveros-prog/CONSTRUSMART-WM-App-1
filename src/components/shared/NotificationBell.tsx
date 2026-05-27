import React, { useState, useEffect, useCallback } from 'react';
import { Bell, BellDot, X, Check, Info, AlertTriangle, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { NotificationService } from '@/services/equipos/NotificationService';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { supabase } from '@/lib/supabase';

interface Notif {
  id: string;
  tipo: 'info' | 'alerta' | 'exito' | 'warning';
  titulo: string;
  mensaje: string | null;
  leido: boolean;
  created_at: string;
}

const iconMap = { info: Info, alerta: AlertTriangle, exito: CheckCircle, warning: AlertCircle };
const colorMap = {
  info: 'bg-blue-100 text-blue-700', alerta: 'bg-amber-100 text-amber-700',
  exito: 'bg-emerald-100 text-emerald-700', warning: 'bg-red-100 text-red-700',
};

const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const { session } = useAppContext();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!session) return;
    try {
      const data = await NotificationService.getNotificaciones(session.user.id);
      setNotifs(data as unknown as Notif[]);
    } catch (err) {
      console.error('Error al cargar notificaciones:', err);
    }
  }, [session]);

  useEffect(() => {
    cargar();
    const userId = session?.user.id;
    if (!userId) return;
    const canal = supabase.channel('notificaciones-bell')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notificaciones', filter: `user_id=eq.${userId}` }, () => cargar())
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, [cargar, session?.user.id]);

  const marcarLeido = async (id: string) => {
    try {
      await NotificationService.marcarLeido(id);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, leido: true } : n));
    } catch (err) {
      console.error('Error al marcar como leído:', err);
    }
  };

  const eliminar = async (id: string) => {
    try {
      await NotificationService.eliminar(id);
      setNotifs(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      toast.error('Error al eliminar notificación');
      console.error(err);
    }
  };

  const noLeidas = notifs.filter(n => !n.leido).length;

  useEffect(() => { if (!open) return; const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); }; document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h); }, [open]);

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="relative p-1.5 rounded-lg hover:bg-slate-100 transition-colors btn-press">
        {noLeidas > 0
          ? <BellDot className="w-4 h-4 text-blue-600" />
          : <Bell className="w-4 h-4 text-slate-500" />
        }
        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-700">Notificaciones</h3>
            <button onClick={() => setOpen(false)} className="p-0.5 rounded hover:bg-slate-100"><X className="w-3 h-3 text-slate-400" /></button>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {notifs.length === 0 && (
              <div className="py-8 text-center text-[11px] text-slate-400">Sin notificaciones</div>
            )}
            {notifs.map(n => {
              const Icon = iconMap[n.tipo];
              return (
                <div key={n.id} className={`px-4 py-2.5 border-b border-slate-50 last:border-0 flex gap-2.5 ${n.leido ? '' : 'bg-blue-50/40'}`}>
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${colorMap[n.tipo].split(' ')[1]}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] leading-tight ${n.leido ? 'text-slate-600' : 'text-slate-800 font-semibold'}`}>{n.titulo}</p>
                    {n.mensaje && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{n.mensaje}</p>}
                    <p className="text-[8px] text-slate-400 mt-0.5">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {!n.leido && <button onClick={() => marcarLeido(n.id)} className="p-0.5 rounded hover:bg-blue-100"><Check className="w-3 h-3 text-blue-500" /></button>}
                    <button onClick={() => setConfirmDelete(n.id)} className="p-0.5 rounded hover:bg-red-100"><Trash2 className="w-3 h-3 text-red-400" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={o => { if (!o) setConfirmDelete(null); }}
        onConfirm={() => { if (confirmDelete) eliminar(confirmDelete); setConfirmDelete(null); }}
        title="Eliminar notificación"
        description="¿Estás seguro de eliminar esta notificación?"
        confirmText="Aceptar"
      />
    </div>
  );
};

export default NotificationBell;
