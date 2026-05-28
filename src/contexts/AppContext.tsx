import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTheme } from '@/components/theme-provider';
import { supabase } from '@/lib/supabase';
import { FinancieroService } from '@/services/financiero/FinancieroService';
import { PresupuestosService } from '@/services/presupuestos/PresupuestosService';
import { ProyectosService } from '@/services/proyectos/ProyectosService';
import { EquiposService } from '@/services/equipos/EquiposService';
import { ClientesService } from '@/services/clientes/ClientesService';
import { ActividadesService } from '@/services/ActividadesService';
import type { Session, RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { 
  Cliente, Proyecto, Transaccion, Actividad, Presupuesto, Equipo, EquipoMiembro,
  Proveedor, OrdenCompra,
  CreateCliente, CreateProyecto, CreateTransaccion, CreateActividad, CreatePresupuesto, CreateEquipo, CreateEquipoMiembro,
  UpdateCliente, UpdateProyecto, UpdatePresupuesto, UpdateEquipo, UpdateEquipoMiembro,
  CreatePresupuestoInput,
  validateEquipo, validateEquipoMiembro, validateTransaccion,
  dbToCliente, clienteToDb, dbToProyecto, proyectoToDb,
  dbToTransaccion, dbToActividad, dbToPresupuesto, presupuestoToDb,
  dbToEquipo, equipoToDb, dbToEquipoMiembro, equipoMiembroToDb,
  dbToProveedor, dbToOrdenCompra
} from '@/types/supabase';
import {
  loadCachedData, saveCachedData, clearUserCache,
  addPendingMutation, getPendingCount, processPendingMutations, clearPendingMutations,
  type PendingMutation,
} from '@/services/offline';
import { crearNotificacion } from '@/utils/notificaciones';
import type { ViewType } from '@/types/supabase';

export interface User {
  nombre: string;
  empresa: string;
  avatar: string;
}

type AppNotification = {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: 'info' | 'alerta' | 'exito' | 'warning';
  leido: boolean;
  created_at: string;
  accion_url?: string;
}

// ===================== AUTH CONTEXT =====================
// Contiene SOLO lo que AppLayout necesita: view, session, loading
// Esto evita que AppLayout re-renderice cuando los datos CRUD cambian
interface AuthContextType {
  view: ViewType;
  setView: (v: ViewType) => void;
  session: Session | null;
  loading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, nombre: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  user: User;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  isOnline: boolean;
  pendingCount: number;
}

// ===================== DATA CONTEXT =====================
// Contiene los datos CRUD que cambian frecuentemente
interface DataContextType {
  clientes: Cliente[];
  addCliente: (c: CreateCliente) => Promise<void>;
  updateCliente: (id: string, c: UpdateCliente) => Promise<void>;
  deleteCliente: (id: string) => Promise<void>;
  proyectos: Proyecto[];
  addProyecto: (p: CreateProyecto) => Promise<void>;
  updateProyecto: (id: string, p: UpdateProyecto) => Promise<void>;
  transacciones: Transaccion[];
  addTransaccion: (t: CreateTransaccion) => Promise<void>;
  deleteTransaccion: (id: string) => Promise<void>;
  actividades: Actividad[];
  addActividad: (a: CreateActividad) => Promise<void>;
  deleteActividad: (id: string) => Promise<void>;
  presupuestos: Presupuesto[];
  addPresupuesto: (p: CreatePresupuestoInput) => Promise<string | null>;
  updatePresupuesto: (id: string, p: UpdatePresupuesto) => Promise<void>;
  deletePresupuesto: (id: string) => Promise<void>;
  transicionFase: (id: string, nuevaFase: Presupuesto['fase']) => Promise<void>;
  equipos: Equipo[];
  addEquipo: (e: CreateEquipo) => Promise<void>;
  updateEquipo: (id: string, e: UpdateEquipo) => Promise<void>;
  deleteEquipo: (id: string) => Promise<void>;
  equipoMiembros: EquipoMiembro[];
  addEquipoMiembro: (em: CreateEquipoMiembro) => Promise<void>;
  updateEquipoMiembro: (id: string, em: UpdateEquipoMiembro) => Promise<void>;
  deleteEquipoMiembro: (id: string) => Promise<void>;
  proveedores: Proveedor[];
  ordenesCompra: OrdenCompra[];
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const DataContext = createContext<DataContextType | undefined>(undefined);

// Hook unificado que combina ambos contextos para compatibilidad hacia atrás
// Los consumidores existentes siguen funcionando sin cambios
export const useAppContext = (): AuthContextType & DataContextType => {
  const auth = useContext(AuthContext);
  const data = useContext(DataContext);
  if (!auth) throw new Error('useAppContext must be used within AppProvider');
  if (!data) throw new Error('useAppContext must be used within AppProvider');
  // Combinar ambos contextos con useMemo para mantener referencia estable
  // Esto evita que cada componente que usa useAppContext obtenga un objeto
  // nuevo en cada render, lo que causaba re-renders en cadena y parpadeo
  return React.useMemo(() => ({ ...auth, ...data }), [auth, data]);
};

export const useAuthContext = () => {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuthContext must be used within AppProvider');
  return auth;
};

export const useDataContext = () => {
  const data = useContext(DataContext);
  if (!data) throw new Error('useDataContext must be used within AppProvider');
  return data;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
   const [view, setView] = useState<ViewType>('login');
   const [session, setSession] = useState<Session | null>(null);
   const [loading, setLoading] = useState(true);
   const [authError, setAuthError] = useState<string | null>(null);
   const [sidebarOpen, setSidebarOpen] = useState(false);
   const { setTheme } = useTheme();
   const loadingRef = useRef(false);

   const [clientes, setClientes] = useState<Cliente[]>([]);
   const [proyectos, setProyectos] = useState<Proyecto[]>([]);
   const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
   const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
   const [actividades, setActividades] = useState<Actividad[]>([]);
    const [equipos, setEquipos] = useState<Equipo[]>([]);
    const [equipoMiembros, setEquipoMiembros] = useState<EquipoMiembro[]>([]);
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [ordenesCompra, setOrdenesCompra] = useState<OrdenCompra[]>([]);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingCount, setPendingCount] = useState(0);
   const realtimeClientes = useRef<RealtimeChannel | null>(null);
   const realtimeProyectos = useRef<RealtimeChannel | null>(null);
   const realtimePresupuestos = useRef<RealtimeChannel | null>(null);
   const realtimeTransacciones = useRef<RealtimeChannel | null>(null);
   const realtimeActividades = useRef<RealtimeChannel | null>(null);
   const realtimeEquipos = useRef<RealtimeChannel | null>(null);
   const realtimeEquipoMiembros = useRef<RealtimeChannel | null>(null);
   const realtimeRenglones = useRef<RealtimeChannel | null>(null);
   const realtimeRenglonUsage = useRef<RealtimeChannel | null>(null);
   const realtimeRenglonPrecios = useRef<RealtimeChannel | null>(null);
   const realtimeCambios = useRef<RealtimeChannel | null>(null);
   const realtimeMateriales = useRef<RealtimeChannel | null>(null);
   const realtimeMovimientos = useRef<RealtimeChannel | null>(null);
   const realtimeConciliaciones = useRef<RealtimeChannel | null>(null);
   const realtimePartidas = useRef<RealtimeChannel | null>(null);
   const realtimeChecklist = useRef<RealtimeChannel | null>(null);
   const realtimeNotificaciones = useRef<RealtimeChannel | null>(null);
   const initDoneRef = useRef(false);
   const mountedRef = useRef(true);

   const user = useMemo(() => ({
     nombre: session?.user?.user_metadata?.nombre || session?.user?.email?.split('@')[0] || 'Usuario',
     empresa: 'CONSTRUCTORA WM/M&S',
     avatar: session?.user?.user_metadata?.avatar_url || session?.user?.user_metadata?.picture || '',
   }), [session?.user?.user_metadata?.nombre, session?.user?.user_metadata?.avatar_url, session?.user?.user_metadata?.picture, session?.user?.email]);

    const loadAll = useCallback(async (userId?: string) => {
      if (!userId) return;
      if (loadingRef.current) return;
      loadingRef.current = true;

      const PAGE_SIZE = 200;
      const tables = [
        { name: 'clientes', setter: setClientes, mapper: dbToCliente, },
        { name: 'proyectos', setter: setProyectos, mapper: dbToProyecto, },
        { name: 'presupuestos', setter: setPresupuestos, mapper: dbToPresupuesto, },
        { name: 'transacciones', setter: setTransacciones, mapper: dbToTransaccion, },
        { name: 'actividades', setter: setActividades, mapper: dbToActividad, },
        { name: 'equipos', setter: setEquipos, mapper: dbToEquipo, },
        { name: 'equipo_miembros', setter: setEquipoMiembros, mapper: dbToEquipoMiembro, },
        { name: 'proveedores', setter: setProveedores, mapper: dbToProveedor, },
        { name: 'ordenes_compra', setter: setOrdenesCompra, mapper: dbToOrdenCompra, },
      ] as const;

      let anyOnline = false;

      for (const t of tables) {
        try {
          const res = await supabase.from(t.name).select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(PAGE_SIZE);
          if (res.error) throw res.error;
          anyOnline = true;
          const data = (res.data || []).map((d: Record<string, unknown>) => t.mapper(d));
          (t.setter as React.Dispatch<React.SetStateAction<any[]>>)(data);
          saveCachedData(t.name, userId, data);
        } catch {
          const cached = loadCachedData(t.name, userId);
          if (cached) {
            (t.setter as React.Dispatch<React.SetStateAction<any[]>>)(cached);
          }
        }
      }

      if (!anyOnline) {
        const hasAnyCache = tables.some(t => loadCachedData(t.name, userId));
        if (hasAnyCache) {
          toast.info('Modo offline — mostrando datos guardados');
        }
      }

      loadingRef.current = false;
    }, []);

  // Inicialización de sesión y realtime listeners
  useEffect(() => {
    mountedRef.current = true;

    const sessionTimeout = setTimeout(() => {
      if (mountedRef.current) {
        setLoading(false);
        setView('login');
      }
    }, 8000);

    const initSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mountedRef.current) return;
        setSession(data.session);
        if (data.session) {
          initDoneRef.current = true;
          await loadAll(data.session.user.id);
          if (!mountedRef.current) return;
          setView('dashboard');
          setupRealtimeListeners(data.session.user.id);
        } else {
          setView('login');
        }
      } catch (err) {
        if (!mountedRef.current) return;
        setAuthError('No se pudo recuperar la sesión. Por favor, inicia sesión nuevamente.');
        setView('login');
      } finally {
        clearTimeout(sessionTimeout);
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };
    initSession();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event: string, s: Session | null) => {
      if (!initDoneRef.current) return;
      setSession(s);
      if (s) {
        try { await loadAll(s.user.id); } catch { /* Error handled by loadAll */ }
        if (!mountedRef.current) return;
        setupRealtimeListeners(s.user.id);
        if (view === 'login') setView('dashboard');
      } else {
        setClientes([]); setProyectos([]); setTransacciones([]); setActividades([]);
        setNotifications([]);
        setView('login');
      }
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
        mountedRef.current = false;
        clearTimeout(sessionTimeout);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        if (sub?.subscription) sub.subscription.unsubscribe();
        if (realtimeClientes.current) realtimeClientes.current.unsubscribe();
       if (realtimeProyectos.current) realtimeProyectos.current.unsubscribe();
       if (realtimeTransacciones.current) realtimeTransacciones.current.unsubscribe();
        if (realtimeActividades.current) realtimeActividades.current.unsubscribe();
        if (realtimePresupuestos.current) realtimePresupuestos.current.unsubscribe();
        if (realtimeRenglones.current) realtimeRenglones.current.unsubscribe();
        if (realtimeRenglonUsage.current) realtimeRenglonUsage.current.unsubscribe();
        if (realtimeRenglonPrecios.current) realtimeRenglonPrecios.current.unsubscribe();
        if (realtimeCambios.current) realtimeCambios.current.unsubscribe();
        if (realtimeMateriales.current) realtimeMateriales.current.unsubscribe();
        if (realtimeMovimientos.current) realtimeMovimientos.current.unsubscribe();
        if (realtimeConciliaciones.current) realtimeConciliaciones.current.unsubscribe();
        if (realtimePartidas.current) realtimePartidas.current.unsubscribe();
        if (realtimeChecklist.current) realtimeChecklist.current.unsubscribe();
        if (realtimeNotificaciones.current) realtimeNotificaciones.current.unsubscribe();
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   useEffect(() => {
     if (session?.user.id) {
       setPendingCount(getPendingCount(session.user.id));
     } else {
       setPendingCount(0);
     }
   }, [session?.user.id]);

   const syncingRef = useRef(false);
   useEffect(() => {
     if (!isOnline || !session?.user.id || syncingRef.current) return;
     const pending = getPendingCount(session.user.id);
     if (pending === 0) return;

     syncingRef.current = true;
     const sync = async () => {
       const { ok, fail } = await processPendingMutations(
         session.user.id,
         async (m) => {
           let q = supabase.from(m.table);
           if (m.action === 'INSERT') {
             const { error } = await q.insert(m.data).select().single();
             if (error) throw error;
           } else if (m.action === 'UPDATE') {
             q = q.update(m.data);
             if (m.filters) {
               Object.entries(m.filters).forEach(([k, v]) => { q = q.eq(k, v); });
             }
             const { error } = await q;
             if (error) throw error;
           } else if (m.action === 'DELETE') {
             if (m.filters) {
               Object.entries(m.filters).forEach(([k, v]) => { q = q.eq(k, v); });
             }
             const { error } = await q.delete();
             if (error) throw error;
           }
         },
         (done, total) => {
           if (mountedRef.current) {
             setPendingCount(getPendingCount(session.user.id));
             if (done < total) {
               toast.loading(`Sincronizando ${done}/${total}...`, { id: 'sync' });
             }
           }
         }
       );
       if (mountedRef.current) {
         setPendingCount(getPendingCount(session.user.id));
         if (ok > 0 || fail > 0) {
           toast.dismiss('sync');
         }
         if (ok > 0 && fail === 0) {
           toast.success(`${ok} cambio${ok > 1 ? 's' : ''} sincronizado${ok > 1 ? 's' : ''}`);
         } else if (fail > 0) {
           toast.warning(`${ok} sincronizado${ok > 1 ? 's' : ''}, ${fail} pendiente${fail > 1 ? 's' : ''}`);
         }
         await loadAll(session.user.id);
       }
       syncingRef.current = false;
     };
     sync().catch(() => { syncingRef.current = false; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOnline, session?.user.id]);

 const setupRealtimeListeners = (userId: string) => {
     if (realtimeClientes.current) realtimeClientes.current.unsubscribe();
     realtimeClientes.current = supabase
       .channel('clientes')
       .on('postgres_changes', {
         event: '*',
         schema: 'public',
         table: 'clientes',
         filter: `user_id=eq.${userId}`
       }, (payload) => {
         handleRealtimeChange('clientes', payload);
       })
       .subscribe();

     if (realtimeProyectos.current) realtimeProyectos.current.unsubscribe();
     realtimeProyectos.current = supabase
       .channel('proyectos')
       .on('postgres_changes', {
         event: '*',
         schema: 'public',
         table: 'proyectos',
         filter: `user_id=eq.${userId}`
       }, (payload) => {
         handleRealtimeChange('proyectos', payload);
       })
       .subscribe();

      if (realtimePresupuestos.current) realtimePresupuestos.current.unsubscribe();
      realtimePresupuestos.current = supabase
        .channel('presupuestos')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'presupuestos',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          handleRealtimeChange('presupuestos', payload);
        })
        .subscribe();

      if (realtimeTransacciones.current) realtimeTransacciones.current.unsubscribe();
     realtimeTransacciones.current = supabase
       .channel('transacciones')
       .on('postgres_changes', {
         event: '*',
         schema: 'public',
         table: 'transacciones',
         filter: `user_id=eq.${userId}`
       }, (payload) => {
         handleRealtimeChange('transacciones', payload);
       })
       .subscribe();

     if (realtimeActividades.current) realtimeActividades.current.unsubscribe();
     realtimeActividades.current = supabase
       .channel('actividades')
       .on('postgres_changes', {
         event: '*',
         schema: 'public',
         table: 'actividades',
         filter: `user_id=eq.${userId}`
       }, (payload) => {
         handleRealtimeChange('actividades', payload);
       })
       .subscribe();

     if (realtimeEquipos.current) realtimeEquipos.current.unsubscribe();
     realtimeEquipos.current = supabase
       .channel('equipos')
       .on('postgres_changes', {
         event: '*',
         schema: 'public',
         table: 'equipos',
         filter: `user_id=eq.${userId}`
       }, (payload) => {
         handleRealtimeChange('equipos', payload);
       })
       .subscribe();

     if (realtimeEquipoMiembros.current) realtimeEquipoMiembros.current.unsubscribe();
     realtimeEquipoMiembros.current = supabase
       .channel('equipo_miembros')
       .on('postgres_changes', {
         event: '*',
         schema: 'public',
         table: 'equipo_miembros',
         filter: `user_id=eq.${userId}`
       }, (payload) => {
         handleRealtimeChange('equipo_miembros', payload);
       })
       .subscribe();

     if (realtimeRenglones.current) realtimeRenglones.current.unsubscribe();
     realtimeRenglones.current = supabase
       .channel('renglones')
       .on('postgres_changes', {
         event: '*', schema: 'public', table: 'renglones',
         filter: `user_id=eq.${userId}`
       }, () => { /* feature hook refreshes on mount */ })
       .subscribe();

     if (realtimeRenglonUsage.current) realtimeRenglonUsage.current.unsubscribe();
     realtimeRenglonUsage.current = supabase
       .channel('renglon_usage')
       .on('postgres_changes', {
         event: '*', schema: 'public', table: 'renglon_usage',
         filter: `user_id=eq.${userId}`
       }, () => {})
       .subscribe();

     if (realtimeRenglonPrecios.current) realtimeRenglonPrecios.current.unsubscribe();
     realtimeRenglonPrecios.current = supabase
       .channel('renglon_precios_historial')
       .on('postgres_changes', {
         event: '*', schema: 'public', table: 'renglon_precios_historial'
       }, () => {})
       .subscribe();

     if (realtimeCambios.current) realtimeCambios.current.unsubscribe();
     realtimeCambios.current = supabase
       .channel('cambios_presupuesto')
       .on('postgres_changes', {
         event: '*', schema: 'public', table: 'cambios_presupuesto'
       }, () => {})
       .subscribe();

     if (realtimeMateriales.current) realtimeMateriales.current.unsubscribe();
     realtimeMateriales.current = supabase
       .channel('materiales_proyecto')
       .on('postgres_changes', {
         event: '*', schema: 'public', table: 'materiales_proyecto'
       }, () => {})
       .subscribe();

     if (realtimeMovimientos.current) realtimeMovimientos.current.unsubscribe();
     realtimeMovimientos.current = supabase
       .channel('movimientos_materiales')
       .on('postgres_changes', {
         event: '*', schema: 'public', table: 'movimientos_materiales',
         filter: `user_id=eq.${userId}`
       }, () => {})
       .subscribe();

     if (realtimeConciliaciones.current) realtimeConciliaciones.current.unsubscribe();
     realtimeConciliaciones.current = supabase
       .channel('conciliaciones')
       .on('postgres_changes', {
         event: '*', schema: 'public', table: 'conciliaciones',
         filter: `user_id=eq.${userId}`
       }, () => {})
       .subscribe();

     if (realtimePartidas.current) realtimePartidas.current.unsubscribe();
     realtimePartidas.current = supabase
       .channel('partidas_conciliacion')
       .on('postgres_changes', {
         event: '*', schema: 'public', table: 'partidas_conciliacion'
       }, () => {})
       .subscribe();

     if (realtimeChecklist.current) realtimeChecklist.current.unsubscribe();
     realtimeChecklist.current = supabase
       .channel('checklist_items')
       .on('postgres_changes', {
         event: '*', schema: 'public', table: 'checklist_items'
       }, () => {})
       .subscribe();

     if (realtimeNotificaciones.current) realtimeNotificaciones.current.unsubscribe();
     realtimeNotificaciones.current = supabase
       .channel('notificaciones')
       .on('postgres_changes', {
         event: '*', schema: 'public', table: 'notificaciones',
         filter: `user_id=eq.${userId}`
       }, () => {})
       .subscribe();
   };

  // Manejar cambios realtime
  const handleRealtimeChange = (table: string, payload: unknown) => {
    const realPayload = payload as {
      eventType: string;
      new?: Record<string, unknown>;
      old?: Record<string, unknown>;
    };
    switch (table) {
      case 'clientes':
        if (realPayload.eventType === 'INSERT' && realPayload.new) {
          setClientes(prev => [dbToCliente(realPayload.new!), ...prev]);
        } else if (realPayload.eventType === 'UPDATE' && realPayload.new) {
          setClientes(prev => prev.map(x => x.id === (realPayload.new as any).id ? dbToCliente(realPayload.new!) : x));
        } else if (realPayload.eventType === 'DELETE' && realPayload.old) {
          setClientes(prev => prev.filter(x => x.id !== (realPayload.old as any).id));
        }
        break;
      case 'proyectos':
        if (realPayload.eventType === 'INSERT' && realPayload.new) {
          setProyectos(prev => [dbToProyecto(realPayload.new!), ...prev]);
        } else if (realPayload.eventType === 'UPDATE' && realPayload.new) {
          setProyectos(prev => prev.map(x => x.id === (realPayload.new as any).id ? dbToProyecto(realPayload.new!) : x));
        } else if (realPayload.eventType === 'DELETE' && realPayload.old) {
          setProyectos(prev => prev.filter(x => x.id !== (realPayload.old as any).id));
        }
        break;
      case 'transacciones':
        if (realPayload.eventType === 'INSERT' && realPayload.new) {
          setTransacciones(prev => [dbToTransaccion(realPayload.new!), ...prev]);
        } else if (realPayload.eventType === 'UPDATE' && realPayload.new) {
          setTransacciones(prev => prev.map(x => x.id === (realPayload.new as any).id ? dbToTransaccion(realPayload.new!) : x));
        } else if (realPayload.eventType === 'DELETE' && realPayload.old) {
          setTransacciones(prev => prev.filter(x => x.id !== (realPayload.old as any).id));
        }
        break;
      case 'presupuestos':
        if (realPayload.eventType === 'INSERT' && realPayload.new) {
          setPresupuestos(prev => [dbToPresupuesto(realPayload.new!), ...prev]);
        } else if (realPayload.eventType === 'UPDATE' && realPayload.new) {
          setPresupuestos(prev => prev.map(x => x.id === (realPayload.new as any).id ? dbToPresupuesto(realPayload.new!) : x));
        } else if (realPayload.eventType === 'DELETE' && realPayload.old) {
          setPresupuestos(prev => prev.filter(x => x.id !== (realPayload.old as any).id));
        }
        break;
      case 'actividades':
        if (realPayload.eventType === 'INSERT' && realPayload.new) {
          setActividades(prev => [dbToActividad(realPayload.new!), ...prev]);
        } else if (realPayload.eventType === 'UPDATE' && realPayload.new) {
          setActividades(prev => prev.map(x => x.id === (realPayload.new as any).id ? dbToActividad(realPayload.new!) : x));
        } else if (realPayload.eventType === 'DELETE' && realPayload.old) {
          setActividades(prev => prev.filter(x => x.id !== (realPayload.old as any).id));
        }
        break;
      case 'equipos':
        if (realPayload.eventType === 'INSERT' && realPayload.new) {
          setEquipos(prev => [dbToEquipo(realPayload.new!), ...prev]);
        } else if (realPayload.eventType === 'UPDATE' && realPayload.new) {
          setEquipos(prev => prev.map(x => x.id === (realPayload.new as any).id ? dbToEquipo(realPayload.new!) : x));
        } else if (realPayload.eventType === 'DELETE' && realPayload.old) {
          setEquipos(prev => prev.filter(x => x.id !== (realPayload.old as any).id));
        }
        break;
      case 'equipo_miembros':
        if (realPayload.eventType === 'INSERT' && realPayload.new) {
          setEquipoMiembros(prev => [dbToEquipoMiembro(realPayload.new!), ...prev]);
        } else if (realPayload.eventType === 'UPDATE' && realPayload.new) {
          setEquipoMiembros(prev => prev.map(x => x.id === (realPayload.new as any).id ? dbToEquipoMiembro(realPayload.new!) : x));
        } else if (realPayload.eventType === 'DELETE' && realPayload.old) {
          setEquipoMiembros(prev => prev.filter(x => x.id !== (realPayload.old as any).id));
        }
        break;
    }
  };

  // ---------- Auth ----------
  const signIn = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setAuthError(error.message); return false; }
    return true;
  }, []);

  const signUp = useCallback(async (email: string, password: string, nombre: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { nombre } },
    });
    if (error) { setAuthError(error.message); return false; }
    return true;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  }, []);

  const signOut = useCallback(async () => {
    if (session?.user.id) {
      clearUserCache(session.user.id);
      clearPendingMutations(session.user.id);
    }
    await supabase.auth.signOut();
    setView('login');
  }, [session?.user.id]);

  // ---------- CRUD Clientes ----------
  const addCliente = async (c: CreateCliente) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    const userId = session.user.id;
    try {
      const dbRecord = {
        user_id: userId,
        nombre: c.nombre,
        telefono: c.telefono || null,
        email: c.email || null,
        direccion: c.direccion || null,
        tipo_proyecto: c.tipoProyecto || 'Residencial',
        estado: c.estado || 'Potencial',
        notas: c.notas || null,
        fecha: c.fecha || new Date().toISOString().split('T')[0],
      };
      if (!isOnline) {
        addPendingMutation({ table: 'clientes', action: 'INSERT', data: dbRecord, userId });
        const optimistic = dbToCliente({ ...dbRecord, id: crypto.randomUUID(), created_at: new Date().toISOString() });
        setClientes(p => [optimistic, ...p]);
        saveCachedData('clientes', userId, [optimistic, ...clientes]);
        setPendingCount(getPendingCount(userId));
        toast.success('Guardado localmente (sin conexión)');
        return;
      }
      const mapped = await ClientesService.addCliente(c as CreateCliente, userId);
      setClientes(p => [mapped, ...p]);
      saveCachedData('clientes', userId, [mapped, ...clientes]);
      toast.success('Cliente guardado');
    } catch (error) {
      console.error('Error al agregar cliente:', error);
      toast.error('Error al guardar cliente', { description: error instanceof Error ? error.message : 'Error desconocido' });
      throw error;
    }
  };

  const updateCliente = async (id: string, c: UpdateCliente) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    const userId = session.user.id;
    try {
      const dbRecord = clienteToDb(c);
      if (!isOnline) {
        addPendingMutation({ table: 'clientes', action: 'UPDATE', data: dbRecord, filters: { id, user_id: userId }, userId });
        setClientes(p => { const updated = p.map(x => x.id === id ? { ...x, ...c } : x); saveCachedData('clientes', userId, updated); return updated; });
        setPendingCount(getPendingCount(userId));
        toast.success('Actualizado localmente (sin conexión)');
        return;
      }
      const mapped = await ClientesService.updateCliente(id, c, userId);
      setClientes(p => { const updated = p.map(x => x.id === id ? mapped : x); saveCachedData('clientes', userId, updated); return updated; });
      toast.success('Cliente actualizado');
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      toast.error('Error al actualizar cliente', { description: error instanceof Error ? error.message : 'Error desconocido' });
      throw error;
    }
  };

  const deleteCliente = async (id: string) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    const userId = session.user.id;
    if (!isOnline) {
      addPendingMutation({ table: 'clientes', action: 'DELETE', data: {}, filters: { id, user_id: userId }, userId });
      setClientes(p => { const filtered = p.filter(x => x.id !== id); saveCachedData('clientes', userId, filtered); return filtered; });
      setPendingCount(getPendingCount(userId));
      toast.success('Eliminado localmente (sin conexión)');
      return;
    }
    await ClientesService.deleteCliente(id, userId);
    setClientes(p => { const filtered = p.filter(x => x.id !== id); saveCachedData('clientes', userId, filtered); return filtered; });
    toast.success('Cliente eliminado');
  };

  // ---------- CRUD Proyectos ----------
  const addProyecto = async (p: CreateProyecto) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    const userId = session.user.id;
    try {
      const dbRecord = {
        user_id: userId,
        nombre: p.nombre,
        cliente: p.cliente || null,
        tipo: p.tipo || null,
        estado: p.estado || 'Planeación',
        presupuesto_total: p.presupuestoTotal ?? 0,
        avance_fisico: p.avanceFisico ?? 0,
        avance_financiero: p.avanceFinanciero ?? 0,
        ingresos: p.ingresos ?? 0,
        gastos: p.gastos ?? 0,
        pendiente_aportar: p.pendienteAportar ?? 0,
        fecha_inicio: p.fechaInicio || null,
        fecha_fin: p.fechaFin || null,
      };
      if (!isOnline) {
        addPendingMutation({ table: 'proyectos', action: 'INSERT', data: dbRecord, userId });
        const optimistic = dbToProyecto({ ...dbRecord, id: crypto.randomUUID(), created_at: new Date().toISOString() });
        setProyectos(prev => [optimistic, ...prev]);
        saveCachedData('proyectos', userId, [optimistic, ...proyectos]);
        setPendingCount(getPendingCount(userId));
        toast.success('Guardado localmente (sin conexión)');
        return;
      }
      const data = await ProyectosService.addProyecto(dbRecord);
      const mapped = dbToProyecto(data);
      setProyectos(prev => [mapped, ...prev]);
      saveCachedData('proyectos', userId, [mapped, ...proyectos]);
      toast.success('Proyecto guardado');
    } catch (error) {
      console.error('Error al agregar proyecto:', error);
      toast.error('Error al guardar proyecto', { description: error instanceof Error ? error.message : 'Error desconocido' });
      throw error;
    }
  };

  const updateProyecto = async (id: string, p: UpdateProyecto) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    const userId = session.user.id;
    try {
      const dbRecord = proyectoToDb(p);
      if (!isOnline) {
        addPendingMutation({ table: 'proyectos', action: 'UPDATE', data: dbRecord, filters: { id, user_id: userId }, userId });
        setProyectos(prev => { const updated = prev.map(x => x.id === id ? { ...x, ...p } : x); saveCachedData('proyectos', userId, updated); return updated; });
        setPendingCount(getPendingCount(userId));
        toast.success('Actualizado localmente (sin conexión)');
        return;
      }
      const data = await ProyectosService.updateProyecto(id, userId, dbRecord);
      const mapped = dbToProyecto(data);
      setProyectos(prev => { const updated = prev.map(x => x.id === id ? mapped : x); saveCachedData('proyectos', userId, updated); return updated; });
      toast.success('Proyecto actualizado');
    } catch (error) {
      console.error('Error al actualizar proyecto:', error);
      toast.error('Error al actualizar proyecto', { description: error instanceof Error ? error.message : 'Error desconocido' });
      throw error;
    }
  };

  const deletePresupuesto = async (id: string) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    const userId = session.user.id;
    if (!isOnline) {
      addPendingMutation({ table: 'presupuestos', action: 'DELETE', data: {}, filters: { id, user_id: userId }, userId });
      setPresupuestos(p => { const filtered = p.filter(x => x.id !== id); saveCachedData('presupuestos', userId, filtered); return filtered; });
      setPendingCount(getPendingCount(userId));
      toast.success('Eliminado localmente (sin conexión)');
      return;
    }
    await PresupuestosService.deletePresupuesto(id, userId);
    setPresupuestos(p => { const filtered = p.filter(x => x.id !== id); saveCachedData('presupuestos', userId, filtered); return filtered; });
    toast.success('Proyecto eliminado');
  };

  // ---------- CRUD Transacciones ----------
  const addTransaccion = async (t: CreateTransaccion) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    const userId = session.user.id;
    try {
      const dbRecord = {
        user_id: userId,
        tipo: t.tipo,
        descripcion: t.descripcion || null,
        cantidad: t.cantidad ?? 1,
        unidad: t.unidad || null,
        categoria: t.categoria,
        costo_unitario: t.costoUnitario ?? 0,
        costo_total: t.costoTotal ?? 0,
        fecha: t.fecha || new Date().toISOString().split('T')[0],
        proyecto_id: t.proyectoId || null,
      };
      
      if (!isOnline) {
        addPendingMutation({ table: 'transacciones', action: 'INSERT', data: dbRecord, userId });
        const optimistic = dbToTransaccion({ ...dbRecord, id: crypto.randomUUID(), created_at: new Date().toISOString() });
        setTransacciones(p => [optimistic, ...p]);
        saveCachedData('transacciones', userId, [optimistic, ...transacciones]);
        setPendingCount(getPendingCount(userId));
        toast.success('Guardado localmente (sin conexión)');
        return;
      }
      
      const data = await FinancieroService.registrarTransaccion(dbRecord as any);
      if (data) {
        const mapped = dbToTransaccion(data);
        setTransacciones(p => [mapped, ...p]);
        saveCachedData('transacciones', userId, [mapped, ...transacciones]);
        toast.success('Transacción registrada');
      }
    } catch (error) {
      console.error('Error al agregar transacción:', error);
      toast.error('Error al registrar transacción');
      throw error;
    }
  };

  const deleteTransaccion = async (id: string) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    const userId = session.user.id;
    if (!isOnline) {
      addPendingMutation({ table: 'transacciones', action: 'DELETE', data: {}, filters: { id, user_id: userId }, userId });
      setTransacciones(p => { const filtered = p.filter(x => x.id !== id); saveCachedData('transacciones', userId, filtered); return filtered; });
      setPendingCount(getPendingCount(userId));
      toast.success('Eliminado localmente (sin conexión)');
      return;
    }
    try {
      await FinancieroService.deleteTransaccion(id, userId);
      setTransacciones(p => { const filtered = p.filter(x => x.id !== id); saveCachedData('transacciones', userId, filtered); return filtered; });
      toast.success('Transacción eliminada');
    } catch {
      toast.error('Error al eliminar transacción');
    }
  };

  // ---------- CRUD Actividades ----------
  const addActividad = async (a: CreateActividad) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    const userId = session.user.id;
    try {
      const dbRecord = {
        user_id: userId,
        titulo: a.titulo,
        fecha: a.fecha,
        hora: a.hora || null,
        descripcion: a.descripcion || null,
        presupuesto_id: a.presupuestoId || null,
      };
      if (!isOnline) {
        addPendingMutation({ table: 'actividades', action: 'INSERT', data: dbRecord, userId });
        const optimistic = dbToActividad({ ...dbRecord, id: crypto.randomUUID(), created_at: new Date().toISOString() });
        setActividades(p => [optimistic, ...p]);
        saveCachedData('actividades', userId, [optimistic, ...actividades]);
        setPendingCount(getPendingCount(userId));
        toast.success('Guardado localmente (sin conexión)');
        return;
      }
      const data = await ActividadesService.addActividad(dbRecord);
      const mapped = dbToActividad(data);
      setActividades(p => [mapped, ...p]);
      saveCachedData('actividades', userId, [mapped, ...actividades]);
      toast.success('Actividad guardada');
    } catch (error) {
      console.error('Error al agregar actividad:', error);
      toast.error('Error al guardar actividad', { description: error instanceof Error ? error.message : 'Error desconocido' });
      throw error;
    }
  };

  const deleteActividad = async (id: string) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    const userId = session.user.id;
    if (!isOnline) {
      addPendingMutation({ table: 'actividades', action: 'DELETE', data: {}, filters: { id, user_id: userId }, userId });
      setActividades(p => { const filtered = p.filter(x => x.id !== id); saveCachedData('actividades', userId, filtered); return filtered; });
      setPendingCount(getPendingCount(userId));
      toast.success('Eliminado localmente (sin conexión)');
      return;
    }
    try {
      await ActividadesService.deleteActividad(id, userId);
      setActividades(p => { const filtered = p.filter(x => x.id !== id); saveCachedData('actividades', userId, filtered); return filtered; });
      toast.success('Actividad eliminada');
    } catch {
      toast.error('Error al eliminar actividad');
    }
  };

  // ---------- CRUD Presupuestos (unificado con fase) ----------
  const cachePresupuestos = (userId: string) => {
    saveCachedData('presupuestos', userId, presupuestos);
  };

  const addPresupuesto = async (p: CreatePresupuestoInput): Promise<string | null> => {
    if (!session) return null;
    const userId = session.user.id;
    const tmpId = crypto.randomUUID();
    try {
      const dbRecord = {
        user_id: userId,
        proyecto: p.proyecto?.trim() || 'Sin nombre',
        cliente: p.cliente || null,
        ubicacion: p.ubicacion || null,
        tipologia: p.tipologia || null,
        fase: p.fase || 'planeación',
        proyecto_id: p.proyectoId || null,
        factor_indirectos: p.factor_indirectos ?? 12,
        factor_administrativos: p.factor_administrativos ?? 8,
        factor_imprevistos: p.factor_imprevistos ?? 5,
        factor_utilidad: p.factor_utilidad ?? 15,
        lineas: p.lineas && Array.isArray(p.lineas) ? p.lineas : [],
        total: typeof p.total === 'number' ? p.total : 0,
        avance_fisico: 0,
        avance_financiero: 0,
        ingresos: 0,
        gastos: 0,
        pendiente_aportar: 0,
        costo_directo: p.costo_directo ?? 0,
        fecha_inicio: null,
        fecha_fin: null,
      };

      if (!isOnline) {
        addPendingMutation({ table: 'presupuestos', action: 'INSERT', data: dbRecord, userId });
        const optimistic = dbToPresupuesto({ ...dbRecord, id: tmpId, created_at: new Date().toISOString() });
        setPresupuestos(prev => [optimistic, ...prev]);
        cachePresupuestos(userId);
        setPendingCount(getPendingCount(userId));
        toast.success('Guardado localmente (sin conexión)');
        return tmpId;
      }

      const inserted = await PresupuestosService.addPresupuesto(dbRecord);
      setPresupuestos(prev => [dbToPresupuesto(inserted), ...prev]);
      cachePresupuestos(userId);
      toast.success('Presupuesto guardado');
      return inserted.id;
    } catch (error: any) {
      console.error('Error al agregar presupuesto:', error);
      const msg = error?.message || error?.description || 'Error desconocido';
      const code = error?.code ? ` (${error?.code})` : '';
      cachePresupuestos(userId);
      toast.error('Error al guardar presupuesto', { description: `${msg}${code}` });
      throw error;
    }
  };

  const updatePresupuesto = async (id: string, p: UpdatePresupuesto) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    const userId = session.user.id;
    try {
      const dbPayload = { ...presupuestoToDb(p), updated_at: new Date().toISOString() };
      if (!isOnline) {
        addPendingMutation({ table: 'presupuestos', action: 'UPDATE', data: dbPayload, filters: { id, user_id: userId }, userId });
        setPresupuestos(prev => { const updated = prev.map(x => x.id === id ? { ...x, ...p } : x); saveCachedData('presupuestos', userId, updated); return updated; });
        setPendingCount(getPendingCount(userId));
        toast.success('Actualizado localmente (sin conexión)');
        return;
      }
      const data = await PresupuestosService.updatePresupuesto(id, userId, dbPayload);
      const mapped = dbToPresupuesto(data);
      setPresupuestos(prev => { const updated = prev.map(x => x.id === id ? mapped : x); saveCachedData('presupuestos', userId, updated); return updated; });
      toast.success('Presupuesto actualizado');
    } catch (error: any) {
      console.error('Error al actualizar presupuesto:', error);
      const msg = error?.message || error?.description || 'Error desconocido';
      const code = error?.code ? ` (${error?.code})` : '';
      toast.error('Error al actualizar presupuesto', { description: `${msg}${code}` });
      throw error;
    }
  };

  const transicionFase = async (id: string, nuevaFase: Presupuesto['fase']) => {
    if (!session) return;
    const userId = session.user.id;
    const original = presupuestos.find(p => p.id === id)?.fase;
    try {
      setPresupuestos(prev => prev.map(p => p.id === id ? { ...p, fase: nuevaFase } : p));
      if (!isOnline) {
        addPendingMutation({ table: 'presupuestos', action: 'UPDATE', data: { fase: nuevaFase }, filters: { id, user_id: userId }, userId });
        cachePresupuestos(userId);
        setPendingCount(getPendingCount(userId));
        toast.success('Fase cambiada localmente (sin conexión)');
        return;
      }
      const data = await PresupuestosService.updatePresupuesto(id, userId, { fase: nuevaFase, updated_at: new Date().toISOString() });
      setPresupuestos(prev => prev.map(p => p.id === id ? dbToPresupuesto(data) : p));
      cachePresupuestos(userId);
      const nombreProyecto = presupuestos.find(p => p.id === id)?.proyecto || 'Proyecto';
      crearNotificacion(userId, 'info', `Fase cambiada: ${nuevaFase}`, `"${nombreProyecto}" movido a ${nuevaFase}`);
      toast.success(`Proyecto movido a fase: ${nuevaFase}`);
    } catch (error: any) {
      console.error('Error en transicionFase:', error);
      if (original) setPresupuestos(prev => prev.map(p => p.id === id ? { ...p, fase: original } : p));
      toast.error('Error al cambiar de fase');
      throw error;
    }
  };

  // ---------- CRUD Equipos ----------
  const addEquipo = async (e: CreateEquipo) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    try {
      const validated = validateEquipo({
        nombre: e.nombre,
        user_id: e.userId || session.user.id,
        estado: e.estado,
        descripcion: e.descripcion,
      });
      const dbRecord = { ...equipoToDb(validated), user_id: userId };
      if (!isOnline) {
        addPendingMutation({ table: 'equipos', action: 'INSERT', data: dbRecord, userId });
        const optimistic = dbToEquipo({ ...dbRecord, id: crypto.randomUUID(), created_at: new Date().toISOString() });
        setEquipos(p => [optimistic, ...p]);
        saveCachedData('equipos', userId, [optimistic, ...equipos]);
        setPendingCount(getPendingCount(userId));
        toast.success('Guardado localmente (sin conexión)');
        return;
      }
      const data = await EquiposService.addEquipo(dbRecord);
      const mapped = dbToEquipo(data);
      setEquipos(p => [mapped, ...p]);
      saveCachedData('equipos', userId, [mapped, ...equipos]);
      toast.success('Equipo guardado');
    } catch (error) {
      console.error('Error al agregar equipo:', error);
      toast.error('Error al guardar equipo', { description: error instanceof Error ? error.message : 'Error desconocido' });
      throw error;
    }
  };

  const updateEquipo = async (id: string, e: UpdateEquipo) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    const userId = session.user.id;
    try {
      const validated = validateEquipo({ ...e, id, user_id: userId });
      const dbRecord = equipoToDb(validated);
      if (!isOnline) {
        addPendingMutation({ table: 'equipos', action: 'UPDATE', data: dbRecord, filters: { id, user_id: userId }, userId });
        setEquipos(p => { const updated = p.map(x => x.id === id ? { ...x, ...e } : x); saveCachedData('equipos', userId, updated); return updated; });
        setPendingCount(getPendingCount(userId));
        toast.success('Actualizado localmente (sin conexión)');
        return;
      }
      const data = await EquiposService.updateEquipo(id, dbRecord, userId);
      const mapped = dbToEquipo(data);
      setEquipos(p => { const updated = p.map(x => x.id === id ? mapped : x); saveCachedData('equipos', userId, updated); return updated; });
      toast.success('Equipo actualizado');
    } catch (error) {
      console.error('Error al actualizar equipo:', error);
      toast.error('Error al actualizar equipo', { description: error instanceof Error ? error.message : 'Error desconocido' });
      throw error;
    }
  };

  const deleteEquipo = async (id: string) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    const userId = session.user.id;
    if (!isOnline) {
      addPendingMutation({ table: 'equipos', action: 'DELETE', data: {}, filters: { id, user_id: userId }, userId });
      setEquipos(p => { const filtered = p.filter(x => x.id !== id); saveCachedData('equipos', userId, filtered); return filtered; });
      setPendingCount(getPendingCount(userId));
      toast.success('Eliminado localmente (sin conexión)');
      return;
    }
    await EquiposService.deleteEquipo(id, userId);
    setEquipos(p => { const filtered = p.filter(x => x.id !== id); saveCachedData('equipos', userId, filtered); return filtered; });
    toast.success('Equipo eliminado');
  };

  // ---------- CRUD Equipo Miembros ----------
  const addEquipoMiembro = async (em: CreateEquipoMiembro) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    try {
      const validated = validateEquipoMiembro({
        equipo_id: em.equipoId,
        user_id: em.userId || session.user.id,
        rol: em.rol,
      });
      const dbRecord = { ...equipoMiembroToDb(validated), user_id: userId };
      if (!isOnline) {
        addPendingMutation({ table: 'equipo_miembros', action: 'INSERT', data: dbRecord, userId });
        const optimistic = dbToEquipoMiembro({ ...dbRecord, id: crypto.randomUUID(), created_at: new Date().toISOString() });
        setEquipoMiembros(p => [optimistic, ...p]);
        saveCachedData('equipo_miembros', userId, [optimistic, ...equipoMiembros]);
        setPendingCount(getPendingCount(userId));
        toast.success('Guardado localmente (sin conexión)');
        return;
      }
      const data = await EquiposService.addMiembro(dbRecord);
      const mapped = dbToEquipoMiembro(data);
      setEquipoMiembros(p => [mapped, ...p]);
      saveCachedData('equipo_miembros', userId, [mapped, ...equipoMiembros]);
      toast.success('Miembro agregado al equipo');
    } catch (error) {
      console.error('Error al agregar miembro:', error);
      toast.error('Error al agregar miembro', { description: error instanceof Error ? error.message : 'Error desconocido' });
      throw error;
    }
  };

  const updateEquipoMiembro = async (id: string, em: UpdateEquipoMiembro) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    const userId = session.user.id;
    try {
      const validated = validateEquipoMiembro({ ...em, id, user_id: userId });
      const dbRecord = equipoMiembroToDb(validated);
      if (!isOnline) {
        addPendingMutation({ table: 'equipo_miembros', action: 'UPDATE', data: dbRecord, filters: { id }, userId });
        setEquipoMiembros(p => { const updated = p.map(x => x.id === id ? { ...x, ...em } : x); saveCachedData('equipo_miembros', userId, updated); return updated; });
        setPendingCount(getPendingCount(userId));
        toast.success('Actualizado localmente (sin conexión)');
        return;
      }
      const data = await EquiposService.updateMiembro(id, dbRecord);
      const mapped = dbToEquipoMiembro(data);
      setEquipoMiembros(p => { const updated = p.map(x => x.id === id ? mapped : x); saveCachedData('equipo_miembros', userId, updated); return updated; });
      toast.success('Miembro actualizado');
    } catch (error) {
      console.error('Error al actualizar miembro:', error);
      toast.error('Error al actualizar miembro', { description: error instanceof Error ? error.message : 'Error desconocido' });
      throw error;
    }
  };

  const deleteEquipoMiembro = async (id: string) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    const userId = session.user.id;
    if (!isOnline) {
      addPendingMutation({ table: 'equipo_miembros', action: 'DELETE', data: {}, filters: { id, user_id: userId }, userId });
      setEquipoMiembros(p => { const filtered = p.filter(x => x.id !== id); saveCachedData('equipo_miembros', userId, filtered); return filtered; });
      setPendingCount(getPendingCount(userId));
      toast.success('Eliminado localmente (sin conexión)');
      return;
    }
    await EquiposService.deleteMiembro(id, userId);
    setEquipoMiembros(p => { const filtered = p.filter(x => x.id !== id); saveCachedData('equipo_miembros', userId, filtered); return filtered; });
    toast.success('Miembro removido del equipo');
  };

  const { theme } = useTheme();
  const darkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const toggleDarkMode = useCallback(() => setTheme(theme === 'dark' ? 'light' : 'dark'), [theme, setTheme]);
  const toggleSidebar = useCallback(() => setSidebarOpen(p => !p), []);

  const markNotificationAsRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(notification => notification.id === id ? { ...notification, leido: true } : notification));
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // ===== AUTH CONTEXT VALUE (ESTABLE) =====
  // Solo cambia cuando view, session o loading cambian
  // NO incluye los arrays de datos CRUD
   
  const authContextValue = useMemo(() => ({
    view, setView, session, loading, authError, signIn, signUp, signInWithGoogle, signOut, user,
    sidebarOpen, toggleSidebar,
    darkMode, toggleDarkMode,
    isOnline, pendingCount,
  }), [
    view, session, loading, authError, user,
    sidebarOpen, toggleSidebar, darkMode, toggleDarkMode, isOnline, pendingCount,
    signIn, signUp, signInWithGoogle, signOut,
  ]);

  // ===== DATA CONTEXT VALUE (DINÁMICO) =====
  // Las funciones CRUD dependen de session/isOnline del closure y no están
  // envueltas en useCallback. Excluirlas de deps es intencional porque:
  // 1. Se recrean en cada render (cambian siempre)
  // 2. Incluirlas forzaría re-render en cada keystroke
  // 3. Los arrays de datos (clientes, etc.) ya capturan el estado actual
  const dataContextValue = useMemo(() => ({
    clientes, addCliente, updateCliente, deleteCliente,
    proyectos, addProyecto, updateProyecto,
    transacciones, addTransaccion, deleteTransaccion,
    actividades, addActividad, deleteActividad,
    presupuestos, addPresupuesto, updatePresupuesto, deletePresupuesto, transicionFase,
    equipos, addEquipo, updateEquipo, deleteEquipo,
    equipoMiembros, addEquipoMiembro, updateEquipoMiembro, deleteEquipoMiembro,
    proveedores, ordenesCompra,
    notifications, markNotificationAsRead, deleteNotification,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [
    clientes, proyectos, transacciones, actividades, presupuestos,
    equipos, equipoMiembros, proveedores, ordenesCompra, notifications,
    addCliente, updateCliente, deleteCliente,
    addProyecto, updateProyecto,
    addTransaccion, deleteTransaccion,
    addActividad, deleteActividad,
    addPresupuesto, updatePresupuesto, deletePresupuesto, transicionFase,
    addEquipo, updateEquipo, deleteEquipo,
    addEquipoMiembro, updateEquipoMiembro, deleteEquipoMiembro,
    markNotificationAsRead, deleteNotification,
  ]);

  return (
    <AuthContext.Provider value={authContextValue}>
      <DataContext.Provider value={dataContextValue}>
        {children}
      </DataContext.Provider>
    </AuthContext.Provider>
  );
};

