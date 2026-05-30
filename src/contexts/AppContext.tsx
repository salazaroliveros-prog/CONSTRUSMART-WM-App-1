import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTheme } from '@/components/theme-provider';
import { AuthService } from '@/services/AuthService';
import { FinancieroService } from '@/services/financiero/FinancieroService';
import { PresupuestosService } from '@/services/presupuestos/PresupuestosService';
import { ProyectosService } from '@/services/proyectos/ProyectosService';
import { EquiposService } from '@/services/equipos/EquiposService';
import { ClientesService } from '@/services/clientes/ClientesService';
import { ActividadesService } from '@/services/ActividadesService';
import { ProveedoresService } from '@/services/compras/ProveedoresService';
import { OrdenesCompraService } from '@/services/compras/OrdenesCompraService';
import { NotificacionesService } from '@/services/NotificacionesService';
import { MaterialesService } from '@/services/presupuestos/MaterialesService';
import { RealtimeService } from '@/services/RealtimeService';
import type { TableName, QueryResultMap } from '@/services/AppDataService';
import type { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { 
  Cliente, Proyecto, Transaccion, Actividad, Presupuesto, Equipo, EquipoMiembro,
  Proveedor, OrdenCompra,
  CreateCliente, CreateProyecto, CreateTransaccion, CreateActividad, CreatePresupuesto, CreateEquipo, CreateEquipoMiembro,
  CreateProveedor, UpdateCliente, UpdateProyecto, UpdatePresupuesto, UpdateEquipo, UpdateEquipoMiembro,
  UpdateProveedor, UpdateTransaccion, UpdateActividad, UpdateOrdenCompra,
  CreatePresupuestoInput,
  validateEquipo, validateEquipoMiembro, validateTransaccion,
  dbToCliente, clienteToDb, dbToProyecto, proyectoToDb,
  dbToTransaccion, dbToActividad, dbToPresupuesto, presupuestoToDb,
  dbToEquipo, equipoToDb, dbToEquipoMiembro, equipoMiembroToDb,
  dbToProveedor, dbToOrdenCompra, proveedorToDb, ordenCompraToDb, actividadToDb,
  Database
} from '@/types/supabase';
import {
  loadCachedData, saveCachedData, clearUserCache,
  addPendingMutation, getPendingCount, getPendingMutations, processPendingMutations, clearPendingMutations,
  type PendingMutation,
} from '@/services/offline';
import { crearNotificacion } from '@/utils/notificaciones';
/* eslint-disable react-hooks/exhaustive-deps */
import type { ViewType } from '@/types/supabase';
import { LoggerService } from '@/services/LoggerService';

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

const dbToNotification = (row: Database['notificaciones']): AppNotification => {
  const createdRaw = row.created_at;
  const created_at = createdRaw
    ? (typeof createdRaw === 'string' ? createdRaw : new Date(createdRaw).toISOString())
    : new Date().toISOString();
  return {
    id: String(row.id || ''),
    titulo: String(row.titulo || 'Notificación'),
    mensaje: String(row.mensaje || ''),
    tipo: (row.tipo as AppNotification['tipo']) || 'info',
    leido: Boolean(row.leido),
    created_at,
    accion_url: row.accion_url ? String(row.accion_url) : undefined,
  };
};

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
  resetPassword: (email: string) => Promise<boolean>;
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
  deleteProyecto: (id: string) => Promise<void>;
  transacciones: Transaccion[];
  addTransaccion: (t: CreateTransaccion) => Promise<void>;
  updateTransaccion: (id: string, t: UpdateTransaccion) => Promise<void>;
  deleteTransaccion: (id: string) => Promise<void>;
  actividades: Actividad[];
  addActividad: (a: CreateActividad) => Promise<void>;
  updateActividad: (id: string, a: UpdateActividad) => Promise<void>;
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
  addProveedor: (p: CreateProveedor) => Promise<void>;
  updateProveedor: (id: string, p: UpdateProveedor) => Promise<void>;
  deleteProveedor: (id: string) => Promise<void>;
  ordenesCompra: OrdenCompra[];
  addOrdenCompra: (oc: CreateOrdenCompra) => Promise<OrdenCompra | null>;
  refreshOrdenesCompra: () => Promise<void>;
  updateOrdenCompra: (id: string, data: UpdateOrdenCompra) => Promise<void>;
  deleteOrdenCompra: (id: string) => Promise<void>;
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
   const loadingRef = useRef(false);
   const realtimeCleanupRef = useRef<(() => void) | null>(null);
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
        try {
        const dataSvc = (await import('@/services/AppDataService')).default;
        const data = await dataSvc.loadAll(userId);

         const mapAndSet = <T extends TableName, State>(
           name: T,
           setter: React.Dispatch<React.SetStateAction<State[]>>,
           mapper: (row: Database[T]) => State,
         ) => {
           const rows = (data[name] || []) as Database[T][];
           const mapped = rows.map(mapper);
           setter(mapped);
           if (rows.length > 0) saveCachedData(name, userId, mapped);
         };

         mapAndSet('clientes', setClientes, dbToCliente);
         mapAndSet('proyectos', setProyectos, dbToProyecto);
         mapAndSet('presupuestos', setPresupuestos, dbToPresupuesto);
         mapAndSet('transacciones', setTransacciones, dbToTransaccion);
         mapAndSet('actividades', setActividades, dbToActividad);
         mapAndSet('equipos', setEquipos, dbToEquipo);
         mapAndSet('equipo_miembros', setEquipoMiembros, dbToEquipoMiembro);
         mapAndSet('proveedores', setProveedores, dbToProveedor);
         mapAndSet('ordenes_compra', setOrdenesCompra, dbToOrdenCompra);
         mapAndSet('notificaciones', setNotifications, dbToNotification);

       } catch (e) {
         // cargar desde cache individualmente si falla la carga en línea
         const tables: TableName[] = ['clientes', 'proyectos', 'presupuestos', 'transacciones', 'actividades', 'equipos', 'equipo_miembros', 'proveedores', 'ordenes_compra', 'notificaciones'];
         let anyCache = false;
         for (const t of tables) {
           switch (t) {
             case 'clientes': {
               const cached = loadCachedData<Cliente>(t, userId);
               if (cached) { anyCache = true; setClientes(cached); }
               break;
             }
             case 'proyectos': {
               const cached = loadCachedData<Proyecto>(t, userId);
               if (cached) { anyCache = true; setProyectos(cached); }
               break;
             }
             case 'presupuestos': {
               const cached = loadCachedData<Presupuesto>(t, userId);
               if (cached) { anyCache = true; setPresupuestos(cached); }
               break;
             }
             case 'transacciones': {
               const cached = loadCachedData<Transaccion>(t, userId);
               if (cached) { anyCache = true; setTransacciones(cached); }
               break;
             }
             case 'actividades': {
               const cached = loadCachedData<Actividad>(t, userId);
               if (cached) { anyCache = true; setActividades(cached); }
               break;
             }
             case 'equipos': {
               const cached = loadCachedData<Equipo>(t, userId);
               if (cached) { anyCache = true; setEquipos(cached); }
               break;
             }
             case 'equipo_miembros': {
               const cached = loadCachedData<EquipoMiembro>(t, userId);
               if (cached) { anyCache = true; setEquipoMiembros(cached); }
               break;
             }
             case 'proveedores': {
               const cached = loadCachedData<Proveedor>(t, userId);
               if (cached) { anyCache = true; setProveedores(cached); }
               break;
             }
             case 'ordenes_compra': {
               const cached = loadCachedData<OrdenCompra>(t, userId);
               if (cached) { anyCache = true; setOrdenesCompra(cached); }
               break;
             }
             case 'notificaciones': {
               const cached = loadCachedData<AppNotification>(t, userId);
               if (cached) { anyCache = true; setNotifications(cached); }
               break;
             }
           }
         }
         if (anyCache) toast.info('Modo offline — mostrando datos guardados');
       } finally {
         loadingRef.current = false;
       }
     }, []);

   useEffect(() => {
    const sessionTimeout = setTimeout(() => {
      if (mountedRef.current) {
        setLoading(false);
        setView('login');
      }
    }, 8000);

    const initSession = async () => {
      try {
        const { session: currentSession, error } = await AuthService.getSession();
        if (error) throw error;
        if (!mountedRef.current) return;
        setSession(currentSession);
        if (currentSession) {
          initDoneRef.current = true;
          await loadAll(currentSession.user.id);
          if (!mountedRef.current) return;
          setView('dashboard');
          setupRealtimeListeners(currentSession.user.id);
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

    const { data: sub } = AuthService.onAuthStateChange(async (_event: string, s: Session | null) => {
      if (!initDoneRef.current) return;
      setSession(s);
      if (s) {
        try { await loadAll(s.user.id); } catch { /* Error handled by loadAll */ }
        if (!mountedRef.current) return;
        setupRealtimeListeners(s.user.id);
        if (view === 'login') setView('dashboard');
        
        // Push notification subscription
        if (import.meta.env.VITE_PUBLIC_VAPID_KEY) {
          import('@/services/PushService').then(({ PushService }) => {
            PushService.requestPermissionAndSubscribe().catch(e => console.info('Push subscription skipped/failed', e));
          });
        }
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
        realtimeCleanupRef.current?.();
      };
     
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
            // Delegate mutation execution to AppDataService to centralize Supabase access and error handling
            const svc = (await import('@/services/AppDataService')).default;
            const resp = await svc.executeMutation({ table: m.table, action: m.action, data: m.data, filters: m.filters });
            if (!resp.success) throw resp.error || new Error('Mutation failed');
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
     
    }, [isOnline, session?.user.id]);

 const setupRealtimeListeners = (userId: string) => {
     realtimeCleanupRef.current?.();
     realtimeCleanupRef.current = RealtimeService.subscribe(userId, handleRealtimeChange);
   };

  type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE';
  type RealtimePayload<T extends TableName> = {
    eventType: RealtimeEventType;
    new?: Database[T];
    old?: Database[T];
  };

  const parseRealtimePayload = <T extends TableName>(payload: unknown): RealtimePayload<T> => payload as RealtimePayload<T>;

  const isRecordWithId = (value: unknown): value is { id: string } =>
    typeof value === 'object' && value !== null && 'id' in value && typeof (value as Record<string, unknown>).id === 'string';

  const getRecordId = (record?: { id?: unknown }): string | undefined =>
    typeof record?.id === 'string' ? record.id : undefined;

  const getPendingMutationId = (mutation: PendingMutation): string | undefined => {
    if (mutation.data && isRecordWithId(mutation.data)) return mutation.data.id;
    if (mutation.filters && isRecordWithId(mutation.filters)) return mutation.filters.id;
    return undefined;
  };

  const applyRealtimeChange = <T extends TableName, S extends { id: string }>(
    payload: RealtimePayload<T>,
    setter: React.Dispatch<React.SetStateAction<S[]>>,
    converter: (row: Database[T]) => S,
  ) => {
    if (payload.eventType === 'INSERT' && payload.new) {
      const id = getRecordId(payload.new);
      if (!id) return;
      setter(prev => prev.some(x => x.id === id) ? prev : [converter(payload.new), ...prev]);
    } else if (payload.eventType === 'UPDATE' && payload.new) {
      const id = getRecordId(payload.new);
      if (!id) return;
      setter(prev => prev.map(x => x.id === id ? converter(payload.new!) : x));
    } else if (payload.eventType === 'DELETE' && payload.old) {
      const id = getRecordId(payload.old);
      if (!id) return;
      setter(prev => prev.filter(x => x.id !== id));
    }
  };

  // Manejar cambios realtime
  const handleRealtimeChange = (table: TableName, payload: unknown) => {
    const realPayload = payload as {
      eventType?: string;
      new?: Record<string, unknown>;
      old?: Record<string, unknown>;
    };

    const eventId = getRecordId(realPayload.new) || getRecordId(realPayload.old);

    // Si existe una mutación pendiente local para el mismo registro, ignorar el evento realtime
    // para evitar "saltos" en la UI (reconciliación optimista)
    try {
      if (eventId && session?.user?.id) {
        const pending = getPendingMutations(session.user.id);
        const hasConflict = pending.some(m => m.table === table && getPendingMutationId(m) === eventId);
        if (hasConflict) return;
      }
    } catch (e) {
      LoggerService.warn('Error en reconciliación realtime:', e);
    }

    switch (table) {
      case 'clientes':
        applyRealtimeChange(parseRealtimePayload<'clientes'>(payload), setClientes, dbToCliente);
        break;
      case 'proyectos':
        applyRealtimeChange(parseRealtimePayload<'proyectos'>(payload), setProyectos, dbToProyecto);
        break;
      case 'transacciones':
        applyRealtimeChange(parseRealtimePayload<'transacciones'>(payload), setTransacciones, dbToTransaccion);
        break;
      case 'presupuestos':
        applyRealtimeChange(parseRealtimePayload<'presupuestos'>(payload), setPresupuestos, dbToPresupuesto);
        break;
      case 'actividades':
        applyRealtimeChange(parseRealtimePayload<'actividades'>(payload), setActividades, dbToActividad);
        break;
      case 'equipos':
        applyRealtimeChange(parseRealtimePayload<'equipos'>(payload), setEquipos, dbToEquipo);
        break;
      case 'equipo_miembros':
        applyRealtimeChange(parseRealtimePayload<'equipo_miembros'>(payload), setEquipoMiembros, dbToEquipoMiembro);
        break;
      case 'proveedores':
        applyRealtimeChange(parseRealtimePayload<'proveedores'>(payload), setProveedores, dbToProveedor);
        break;
      case 'ordenes_compra':
        applyRealtimeChange(parseRealtimePayload<'ordenes_compra'>(payload), setOrdenesCompra, dbToOrdenCompra);
        break;
      case 'notificaciones':
        applyRealtimeChange(parseRealtimePayload<'notificaciones'>(payload), setNotifications, dbToNotification);
        break;
    }
  };

  // ---------- Auth ----------
  const signIn = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    const result = await AuthService.signInWithPassword(email, password);
    if (!result.success) { setAuthError(result.error ?? 'Error de autenticación'); return false; }
    return true;
  }, []);

  const signUp = useCallback(async (email: string, password: string, nombre: string) => {
    setAuthError(null);
    const result = await AuthService.signUpWithEmail(email, password, nombre);
    if (!result.success) { setAuthError(result.error ?? 'Error de registro'); return false; }
    return true;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const result = await AuthService.signInWithGoogle();
    if (!result.success) {
      toast.error(result.error ?? 'Error al iniciar sesión con Google');
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    setAuthError(null);
    const result = await AuthService.resetPassword(email);
    if (!result.success) { setAuthError(result.error ?? 'Error al restablecer la contraseña'); return false; }
    return true;
  }, []);

  const signOut = useCallback(async () => {
    if (session?.user.id) {
      clearUserCache(session.user.id);
      clearPendingMutations(session.user.id);
    }
    const result = await AuthService.signOut();
    if (!result.success) {
      toast.error('Error al cerrar sesión');
    }
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

  // ---------- deleteProyecto ----------
  const deleteProyecto = async (id: string) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    const userId = session.user.id;
    if (!isOnline) {
      addPendingMutation({ table: 'proyectos', action: 'DELETE', data: {}, filters: { id, user_id: userId }, userId });
      setProyectos(prev => { const filtered = prev.filter(x => x.id !== id); saveCachedData('proyectos', userId, filtered); return filtered; });
      setPendingCount(getPendingCount(userId));
      toast.success('Eliminado localmente (sin conexión)');
      return;
    }
    try {
      await ProyectosService.deleteProyecto(id, userId);
      setProyectos(prev => { const filtered = prev.filter(x => x.id !== id); saveCachedData('proyectos', userId, filtered); return filtered; });
      toast.success('Proyecto eliminado');
    } catch (error) {
      toast.error('Error al eliminar proyecto');
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
      
      const data = await FinancieroService.registrarTransaccion(dbRecord as CreateTransaccion, userId);
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

  // ---------- updateTransaccion ----------
  const updateTransaccion = async (id: string, t: UpdateTransaccion) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    const userId = session.user.id;
    try {
      if (!isOnline) {
        const dbRecord: Record<string, unknown> = {};
        if (t.tipo !== undefined) dbRecord.tipo = t.tipo;
        if (t.descripcion !== undefined) dbRecord.descripcion = t.descripcion;
        if (t.cantidad !== undefined) dbRecord.cantidad = t.cantidad;
        if (t.costoUnitario !== undefined) dbRecord.costo_unitario = t.costoUnitario;
        if (t.costoTotal !== undefined) dbRecord.costo_total = t.costoTotal;
        if (t.fecha !== undefined) dbRecord.fecha = t.fecha;
        if (t.categoria !== undefined) dbRecord.categoria = t.categoria;
        addPendingMutation({ table: 'transacciones', action: 'UPDATE', data: dbRecord, filters: { id, user_id: userId }, userId });
        setTransacciones(p => { const updated = p.map(x => x.id === id ? { ...x, ...t } : x); saveCachedData('transacciones', userId, updated); return updated; });
        setPendingCount(getPendingCount(userId));
        toast.success('Actualizado localmente (sin conexión)');
        return;
      }
      const data = await FinancieroService.updateTransaccion(id, t, userId);
      setTransacciones(p => { const updated = p.map(x => x.id === id ? dbToTransaccion(data) : x); saveCachedData('transacciones', userId, updated); return updated; });
      toast.success('Transacción actualizada');
    } catch (error) {
      toast.error('Error al actualizar transacción');
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

  // ---------- updateActividad ----------
  const updateActividad = async (id: string, a: UpdateActividad) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    const userId = session.user.id;
    try {
      if (!isOnline) {
        addPendingMutation({ table: 'actividades', action: 'UPDATE', data: actividadToDb(a), filters: { id, user_id: userId }, userId });
        setActividades(p => { const updated = p.map(x => x.id === id ? { ...x, ...a } : x); saveCachedData('actividades', userId, updated); return updated; });
        setPendingCount(getPendingCount(userId));
        toast.success('Actualizado localmente (sin conexión)');
        return;
      }
      const updated = await ActividadesService.updateActividad(id, a, userId);
      setActividades(p => { const next = p.map(x => x.id === id ? updated : x); saveCachedData('actividades', userId, next); return next; });
      toast.success('Actividad actualizada');
    } catch (error) {
      toast.error('Error al actualizar actividad');
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

  const addProveedor = async (p: CreateProveedor) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    const userId = session.user.id;
    try {
      const dbRecord = proveedorToDb(p);
      if (!isOnline) {
        addPendingMutation({ table: 'proveedores', action: 'INSERT', data: { ...dbRecord, user_id: userId }, userId });
        const optimistic = dbToProveedor({ ...dbRecord, id: crypto.randomUUID(), user_id: userId, created_at: new Date().toISOString() });
        setProveedores(prev => [optimistic, ...prev]);
        saveCachedData('proveedores', userId, [optimistic, ...proveedores]);
        setPendingCount(getPendingCount(userId));
        toast.success('Proveedor guardado localmente (sin conexión)');
        return;
      }
      const created = await ProveedoresService.crear(p, userId);
      setProveedores(prev => [created, ...prev]);
      saveCachedData('proveedores', userId, [created, ...proveedores]);
      toast.success('Proveedor guardado');
    } catch (error) {
      console.error('Error al agregar proveedor:', error);
      toast.error('Error al guardar proveedor');
      throw error;
    }
  };

  const updateProveedor = async (id: string, p: UpdateProveedor) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    const userId = session.user.id;
    try {
      const dbRecord = proveedorToDb(p);
      if (!isOnline) {
        addPendingMutation({ table: 'proveedores', action: 'UPDATE', data: dbRecord, filters: { id, user_id: userId }, userId });
        setProveedores(prev => { const updated = prev.map(x => x.id === id ? { ...x, ...p } : x); saveCachedData('proveedores', userId, updated); return updated; });
        setPendingCount(getPendingCount(userId));
        toast.success('Proveedor actualizado localmente (sin conexión)');
        return;
      }
      const updated = await ProveedoresService.actualizar(id, p);
      setProveedores(prev => { const next = prev.map(x => x.id === id ? updated : x); saveCachedData('proveedores', userId, next); return next; });
      toast.success('Proveedor actualizado');
    } catch (error) {
      console.error('Error al actualizar proveedor:', error);
      toast.error('Error al actualizar proveedor');
      throw error;
    }
  };

  const deleteProveedor = async (id: string) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    const userId = session.user.id;
    if (!isOnline) {
      addPendingMutation({ table: 'proveedores', action: 'DELETE', data: {}, filters: { id, user_id: userId }, userId });
      setProveedores(prev => { const filtered = prev.filter(x => x.id !== id); saveCachedData('proveedores', userId, filtered); return filtered; });
      setPendingCount(getPendingCount(userId));
      toast.success('Proveedor eliminado localmente (sin conexión)');
      return;
    }
    try {
      await ProveedoresService.eliminar(id);
      setProveedores(prev => { const filtered = prev.filter(x => x.id !== id); saveCachedData('proveedores', userId, filtered); return filtered; });
      toast.success('Proveedor eliminado');
    } catch {
      toast.error('Error al eliminar proveedor');
      throw new Error('Error al eliminar proveedor');
    }
  };

  const updateOrdenCompra = async (id: string, datos: UpdateOrdenCompra) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    const userId = session.user.id;
    try {
      if (!isOnline) {
        addPendingMutation({ table: 'ordenes_compra', action: 'UPDATE', data: ordenCompraToDb(datos), filters: { id, user_id: userId }, userId });
        setOrdenesCompra(prev => { const updated = prev.map(x => x.id === id ? { ...x, ...datos } : x); saveCachedData('ordenes_compra', userId, updated); return updated; });
        setPendingCount(getPendingCount(userId));
        toast.success('OC actualizada localmente (sin conexión)');
        return;
      }
      const updated = await OrdenesCompraService.actualizar(id, datos);
      setOrdenesCompra(prev => { const next = prev.map(x => x.id === id ? updated : x); saveCachedData('ordenes_compra', userId, next); return next; });
      toast.success('Orden de compra actualizada');
    } catch (error) {
      toast.error('Error al actualizar orden de compra');
      throw error;
    }
  };

  const deleteOrdenCompra = async (id: string) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    const userId = session.user.id;
    if (!isOnline) {
      addPendingMutation({ table: 'ordenes_compra', action: 'DELETE', data: {}, filters: { id, user_id: userId }, userId });
      setOrdenesCompra(prev => { const filtered = prev.filter(x => x.id !== id); saveCachedData('ordenes_compra', userId, filtered); return filtered; });
      setPendingCount(getPendingCount(userId));
      toast.success('OC eliminada localmente (sin conexión)');
      return;
    }
    try {
      await OrdenesCompraService.eliminar(id);
      setOrdenesCompra(prev => { const filtered = prev.filter(x => x.id !== id); saveCachedData('ordenes_compra', userId, filtered); return filtered; });
      toast.success('Orden de compra eliminada');
    } catch {
      toast.error('Error al eliminar orden de compra');
    }
  };

  // ---------- addOrdenCompra ----------
  const addOrdenCompra = async (oc: CreateOrdenCompra): Promise<OrdenCompra | null> => {
    if (!session) { toast.error('Sesión no encontrada'); return null; }
    const userId = session.user.id;
    try {
      if (!isOnline) {
        addPendingMutation({ table: 'ordenes_compra', action: 'INSERT', data: ordenCompraToDb(oc), userId });
        const optimistic: OrdenCompra = {
          ...oc,
          id: crypto.randomUUID(),
          userId,
          estatus: oc.estatus || 'pendiente',
          created_at: new Date().toISOString(),
        };
        setOrdenesCompra(prev => [optimistic, ...prev]);
        setPendingCount(getPendingCount(userId));
        toast.success('OC guardada localmente (sin conexión)');
        return optimistic;
      }
      const creada = await OrdenesCompraService.crear(oc, userId);
      setOrdenesCompra(prev => [creada, ...prev]);
      saveCachedData('ordenes_compra', userId, [creada, ...ordenesCompra]);
      toast.success('Orden de compra creada');
      return creada;
    } catch (error) {
      toast.error('Error al crear orden de compra');
      throw error;
    }
  };

  const refreshOrdenesCompra = async () => {
    if (!session) return;
    try {
      const data = await OrdenesCompraService.listar(session.user.id);
      setOrdenesCompra(data);
      saveCachedData('ordenes_compra', session.user.id, data);
    } catch (error) {
      console.error('Error al recargar órdenes de compra:', error);
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
    } catch (error: unknown) {
      console.error('Error al agregar presupuesto:', error);
      const errObj = error as Record<string, unknown>;
      const msg = (errObj?.message as string) || (errObj?.description as string) || 'Error desconocido';
      const code = errObj?.code ? ` (${errObj.code})` : '';
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
    } catch (error: unknown) {
      console.error('Error al actualizar presupuesto:', error);
      const errObj = error as Record<string, unknown>;
      const msg = (errObj?.message as string) || (errObj?.description as string) || 'Error desconocido';
      const code = errObj?.code ? ` (${errObj.code})` : '';
      toast.error('Error al actualizar presupuesto', { description: `${msg}${code}` });
      throw error;
    }
  };

  const transicionFase = async (id: string, nuevaFase: Presupuesto['fase']) => {
    if (!session) return;
    const userId = session.user.id;
    const original = presupuestos.find(p => p.id === id)?.fase;
    // Solo enviar materiales a bodega si se está cambiando a ejecución (no desde ejecución)
    const enviarABodega = nuevaFase === 'ejecución' && original !== 'ejecución';
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

      // 🔗 Enviar materiales del presupuesto a Bodega automáticamente al pasar a ejecución
      if (enviarABodega) {
        try {
          const materiales = await MaterialesService.persistDesglosados(id);
          if (materiales.length > 0) {
            crearNotificacion(userId, 'exito', 'Materiales enviados a bodega', 
              `${materiales.length} materiales del proyecto desglosados y almacenados en inventario`);
          }
        } catch (e) {
          console.error('Error al persistir materiales en bodega:', e);
          toast.warning('El proyecto pasó a ejecución, pero hubo un error al enviar materiales a bodega');
        }
      }

      const nombreProyecto = presupuestos.find(p => p.id === id)?.proyecto || 'Proyecto';
      crearNotificacion(userId, 'info', `Fase cambiada: ${nuevaFase}`, `"${nombreProyecto}" movido a ${nuevaFase}`);
      toast.success(`Proyecto movido a fase: ${nuevaFase}`);
    } catch (error: unknown) {
      console.error('Error en transicionFase:', error);
      if (original) setPresupuestos(prev => prev.map(p => p.id === id ? { ...p, fase: original } : p));
      toast.error('Error al cambiar de fase');
      throw error;
    }
  };

  // ---------- CRUD Equipos ----------
  const addEquipo = async (e: CreateEquipo) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    const userId = session.user.id;
    try {
      const validated = validateEquipo({
        nombre: e.nombre,
        user_id: e.userId || userId,
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
    const userId = session.user.id;
    try {
      const validated = validateEquipoMiembro({
        equipo_id: em.equipoId,
        user_id: em.userId || userId,
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
    if (!session) return;
    const userId = session.user.id;
    try {
      if (!isOnline) {
        addPendingMutation({ table: 'notificaciones', action: 'UPDATE', data: { leido: true }, filters: { id, user_id: userId }, userId });
        setNotifications(prev => prev.map(notification => notification.id === id ? { ...notification, leido: true } : notification));
        setPendingCount(getPendingCount(userId));
        toast.success('Notificación marcada localmente (sin conexión)');
        return;
      }
      await NotificacionesService.marcarLeida(id);
      setNotifications(prev => prev.map(notification => notification.id === id ? { ...notification, leido: true } : notification));
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      toast.error('No se pudo marcar la notificación como leída');
    }
  }, [session?.user.id, isOnline]);

  const deleteNotification = useCallback(async (id: string) => {
    if (!session) return;
    const userId = session.user.id;
    try {
      if (!isOnline) {
        addPendingMutation({ table: 'notificaciones', action: 'DELETE', data: {}, filters: { id, user_id: userId }, userId });
        setNotifications(prev => prev.filter(notification => notification.id !== id));
        setPendingCount(getPendingCount(userId));
        toast.success('Notificación eliminada localmente (sin conexión)');
        return;
      }
      await NotificacionesService.eliminar(id);
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      toast.error('No se pudo eliminar la notificación');
    }
  }, [session?.user.id, isOnline]);

  // ===== AUTH CONTEXT VALUE (ESTABLE) =====
  // Solo cambia cuando view, session o loading cambian
  // NO incluye los arrays de datos CRUD
   
  const authContextValue = useMemo(() => ({
    view, setView, session, loading, authError, signIn, signUp, signInWithGoogle, signOut, resetPassword, user,
    sidebarOpen, toggleSidebar,
    darkMode, toggleDarkMode,
    isOnline, pendingCount,
  }), [
    view, session, loading, authError, user,
    sidebarOpen, toggleSidebar, darkMode, toggleDarkMode, isOnline, pendingCount,
    signIn, signUp, signInWithGoogle, signOut, resetPassword,
  ]);

  // ===== DATA CONTEXT VALUE (DINÁMICO) =====
  // Las funciones CRUD dependen de session/isOnline del closure y no están
  // envueltas en useCallback. Excluirlas de deps es intencional porque:
  // 1. Se recrean en cada render (cambian siempre)
  // 2. Incluirlas forzaría re-render en cada keystroke
  // 3. Los arrays de datos (clientes, etc.) ya capturan el estado actual
   
  const dataContextValue = useMemo(() => ({
    clientes, addCliente, updateCliente, deleteCliente,
    proyectos, addProyecto, updateProyecto, deleteProyecto,
    transacciones, addTransaccion, updateTransaccion, deleteTransaccion,
    actividades, addActividad, updateActividad, deleteActividad,
    presupuestos, addPresupuesto, updatePresupuesto, deletePresupuesto, transicionFase,
    equipos, addEquipo, updateEquipo, deleteEquipo,
    equipoMiembros, addEquipoMiembro, updateEquipoMiembro, deleteEquipoMiembro,
    proveedores, addProveedor, updateProveedor, deleteProveedor,
    ordenesCompra, addOrdenCompra, refreshOrdenesCompra, updateOrdenCompra, deleteOrdenCompra,
    notifications, markNotificationAsRead, deleteNotification,
     
   
  }), [
    clientes, proyectos, transacciones, actividades, presupuestos,
    equipos, equipoMiembros, proveedores, ordenesCompra, notifications,
    addCliente, updateCliente, deleteCliente,
    addProyecto, updateProyecto, deleteProyecto,
    addTransaccion, updateTransaccion, deleteTransaccion,
    addActividad, updateActividad, deleteActividad,
    addPresupuesto, updatePresupuesto, deletePresupuesto, transicionFase,
    addEquipo, updateEquipo, deleteEquipo,
    addEquipoMiembro, updateEquipoMiembro, deleteEquipoMiembro,
    addProveedor, updateProveedor, deleteProveedor,
    addOrdenCompra, refreshOrdenesCompra, updateOrdenCompra, deleteOrdenCompra,
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

