import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { 
  Cliente, Proyecto, Transaccion, Actividad, Presupuesto, Equipo, EquipoMiembro,
  CreateCliente, CreateProyecto, CreateTransaccion, CreateActividad, CreatePresupuesto, CreateEquipo, CreateEquipoMiembro,
  UpdateCliente, UpdateProyecto, UpdatePresupuesto, UpdateEquipo, UpdateEquipoMiembro,
  CreatePresupuestoInput,
  validateCliente, validateProyecto, validateTransaccion, validateActividad, validateEquipo, validateEquipoMiembro,
  dbToCliente, clienteToDb, dbToProyecto, proyectoToDb,
  dbToTransaccion, transaccionToDb, dbToActividad, actividadToDb, dbToPresupuesto, presupuestoToDb,
  dbToEquipo, equipoToDb, dbToEquipoMiembro, equipoMiembroToDb
} from '@/types/supabase';

export type ViewType = 'login' | 'dashboard' | 'clientes' | 'presupuesto' | 'seguimiento' | 'financiero' | 'proyectos' | 'equipos';

export interface User {
  nombre: string;
  empresa: string;
  avatar: string;
}

interface AppContextType {
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
  transicionFase: (id: string, nuevaFase: Presupuesto['fase']) => Promise<void>;

  equipos: Equipo[];
  addEquipo: (e: CreateEquipo) => Promise<void>;
  updateEquipo: (id: string, e: UpdateEquipo) => Promise<void>;
  deleteEquipo: (id: string) => Promise<void>;

  equipoMiembros: EquipoMiembro[];
  addEquipoMiembro: (em: CreateEquipoMiembro) => Promise<void>;
  updateEquipoMiembro: (id: string, em: UpdateEquipoMiembro) => Promise<void>;
  deleteEquipoMiembro: (id: string) => Promise<void>;

  sidebarOpen: boolean;
  toggleSidebar: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
   const [view, setView] = useState<ViewType>('login');
   const [session, setSession] = useState<Session | null>(null);
   const [loading, setLoading] = useState(true);
   const [authError, setAuthError] = useState<string | null>(null);
   const [sidebarOpen, setSidebarOpen] = useState(false);
   const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
   const loadingRef = useRef(false);

   useEffect(() => {
     document.documentElement.classList.toggle('dark', darkMode);
     localStorage.setItem('darkMode', String(darkMode));
   }, [darkMode]);

   const [clientes, setClientes] = useState<Cliente[]>([]);
   const [proyectos, setProyectos] = useState<Proyecto[]>([]);
   const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
   const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
   const [actividades, setActividades] = useState<Actividad[]>([]);
   const [equipos, setEquipos] = useState<Equipo[]>([]);
   const [equipoMiembros, setEquipoMiembros] = useState<EquipoMiembro[]>([]);
   const realtimeClientes = useRef<RealtimeChannel | null>(null);
   const realtimeProyectos = useRef<RealtimeChannel | null>(null);
   const realtimePresupuestos = useRef<RealtimeChannel | null>(null);
   const realtimeTransacciones = useRef<RealtimeChannel | null>(null);
   const realtimeActividades = useRef<RealtimeChannel | null>(null);
   const realtimeEquipos = useRef<RealtimeChannel | null>(null);
   const realtimeEquipoMiembros = useRef<RealtimeChannel | null>(null);
   const initDoneRef = useRef(false);
   const mountedRef = useRef(true);

   const user = {
     nombre: session?.user?.user_metadata?.nombre || session?.user?.email?.split('@')[0] || 'Usuario',
     empresa: 'CONSTRUCTORA WM/M&S',
     avatar: session?.user?.user_metadata?.avatar_url || session?.user?.user_metadata?.picture || '',
   };

    const loadAll = useCallback(async (userId?: string) => {
      if (!userId) return;
      
      // Evitar múltiples ejecuciones simultáneas
      if (loadingRef.current) return;
      loadingRef.current = true;
      
       const PAGE_SIZE = 200;
       try {
         const [cR, pR, prR, tR, aR, eR, emR] = await Promise.all([
           supabase.from('clientes').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(PAGE_SIZE),
           supabase.from('proyectos').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(PAGE_SIZE),
           supabase.from('presupuestos').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(PAGE_SIZE),
           supabase.from('transacciones').select('*').eq('user_id', userId).order('fecha', { ascending: false }).limit(PAGE_SIZE),
           supabase.from('actividades').select('*').eq('user_id', userId).order('fecha', { ascending: false }).limit(PAGE_SIZE),
           supabase.from('equipos').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(PAGE_SIZE),
           supabase.from('equipo_miembros').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(PAGE_SIZE)
         ]);
         
         setClientes((cR.data || []).map(dbToCliente));
         setProyectos((pR.data || []).map(dbToProyecto));
         setPresupuestos((prR.data || []).map(dbToPresupuesto));
         setTransacciones((tR.data || []).map(dbToTransaccion));
         setActividades((aR.data || []).map(dbToActividad));
         setEquipos((eR.data || []).map(dbToEquipo));
         setEquipoMiembros((emR.data || []).map(dbToEquipoMiembro));
       } catch (e) {
         console.error('Error cargando datos:', e);
         toast.error('Error al cargar datos de la base.');
       } finally {
        loadingRef.current = false;
      }
    }, []);

  // Inicialización de sesión y realtime listeners
  useEffect(() => {
    mountedRef.current = true;

    const sessionTimeout = setTimeout(() => {
      if (mountedRef.current) {
        console.warn('Timeout de sesión. Forzando salida de carga.');
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
        console.error('Error al recuperar sesión:', err);
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

    // Escuchar cambios de autenticación (NO durante la inicialización)
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (!initDoneRef.current) return;
      setSession(s);
      if (s) {
        try { await loadAll(s.user.id); } catch (err) { console.error('Error en loadAll:', err); }
        if (!mountedRef.current) return;
        setupRealtimeListeners(s.user.id);
        if (view === 'login') setView('dashboard');
      } else {
        setClientes([]); setProyectos([]); setTransacciones([]); setActividades([]);
        setView('login');
      }
    });

   return () => {
       mountedRef.current = false;
       clearTimeout(sessionTimeout);
       if (sub?.subscription) sub.subscription.unsubscribe();
       if (realtimeClientes.current) realtimeClientes.current.unsubscribe();
       if (realtimeProyectos.current) realtimeProyectos.current.unsubscribe();
       if (realtimeTransacciones.current) realtimeTransacciones.current.unsubscribe();
        if (realtimeActividades.current) realtimeActividades.current.unsubscribe();
        if (realtimePresupuestos.current) realtimePresupuestos.current.unsubscribe();
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

 // Setup realtime listeners para todas las tablas
   const setupRealtimeListeners = (userId: string) => {
     // Clientes realtime
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

     // Proyectos realtime
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

      // Presupuestos realtime
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

      // Transacciones realtime
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

     // Actividades realtime
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

     // Equipos realtime
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

     // Equipo Miembros realtime
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setClientes(prev => prev.map(x => x.id === (realPayload.new as any).id ? dbToCliente(realPayload.new!) : x));
        } else if (realPayload.eventType === 'DELETE' && realPayload.old) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setClientes(prev => prev.filter(x => x.id !== (realPayload.old as any).id));
        }
        break;
      case 'proyectos':
        if (realPayload.eventType === 'INSERT' && realPayload.new) {
          setProyectos(prev => [dbToProyecto(realPayload.new!), ...prev]);
        } else if (realPayload.eventType === 'UPDATE' && realPayload.new) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setProyectos(prev => prev.map(x => x.id === (realPayload.new as any).id ? dbToProyecto(realPayload.new!) : x));
        } else if (realPayload.eventType === 'DELETE' && realPayload.old) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setProyectos(prev => prev.filter(x => x.id !== (realPayload.old as any).id));
        }
        break;
      case 'transacciones':
        if (realPayload.eventType === 'INSERT' && realPayload.new) {
          setTransacciones(prev => [dbToTransaccion(realPayload.new!), ...prev]);
        } else if (realPayload.eventType === 'UPDATE' && realPayload.new) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setTransacciones(prev => prev.map(x => x.id === (realPayload.new as any).id ? dbToTransaccion(realPayload.new!) : x));
        } else if (realPayload.eventType === 'DELETE' && realPayload.old) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setTransacciones(prev => prev.filter(x => x.id !== (realPayload.old as any).id));
        }
        break;
      case 'presupuestos':
        if (realPayload.eventType === 'INSERT' && realPayload.new) {
          setPresupuestos(prev => [dbToPresupuesto(realPayload.new!), ...prev]);
        } else if (realPayload.eventType === 'UPDATE' && realPayload.new) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setPresupuestos(prev => prev.map(x => x.id === (realPayload.new as any).id ? dbToPresupuesto(realPayload.new!) : x));
        } else if (realPayload.eventType === 'DELETE' && realPayload.old) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setPresupuestos(prev => prev.filter(x => x.id !== (realPayload.old as any).id));
        }
        break;
      case 'actividades':
        if (realPayload.eventType === 'INSERT' && realPayload.new) {
          setActividades(prev => [dbToActividad(realPayload.new!), ...prev]);
        } else if (realPayload.eventType === 'UPDATE' && realPayload.new) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setActividades(prev => prev.map(x => x.id === (realPayload.new as any).id ? dbToActividad(realPayload.new!) : x));
        } else if (realPayload.eventType === 'DELETE' && realPayload.old) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setActividades(prev => prev.filter(x => x.id !== (realPayload.old as any).id));
        }
        break;
      case 'equipos':
        if (realPayload.eventType === 'INSERT' && realPayload.new) {
          setEquipos(prev => [dbToEquipo(realPayload.new!), ...prev]);
        } else if (realPayload.eventType === 'UPDATE' && realPayload.new) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setEquipos(prev => prev.map(x => x.id === (realPayload.new as any).id ? dbToEquipo(realPayload.new!) : x));
        } else if (realPayload.eventType === 'DELETE' && realPayload.old) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setEquipos(prev => prev.filter(x => x.id !== (realPayload.old as any).id));
        }
        break;
      case 'equipo_miembros':
        if (realPayload.eventType === 'INSERT' && realPayload.new) {
          setEquipoMiembros(prev => [dbToEquipoMiembro(realPayload.new!), ...prev]);
        } else if (realPayload.eventType === 'UPDATE' && realPayload.new) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setEquipoMiembros(prev => prev.map(x => x.id === (realPayload.new as any).id ? dbToEquipoMiembro(realPayload.new!) : x));
        } else if (realPayload.eventType === 'DELETE' && realPayload.old) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setEquipoMiembros(prev => prev.filter(x => x.id !== (realPayload.old as any).id));
        }
        break;
    }
  };

  // ---------- Auth ----------
  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setAuthError(error.message); return false; }
    return true;
  };

  const signUp = async (email: string, password: string, nombre: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { nombre } },
    });
    if (error) { setAuthError(error.message); return false; }
    return true;
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setView('login');
  };

  // ---------- CRUD Clientes ----------
  const addCliente = async (c: CreateCliente) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    try {
      const validated = validateCliente({ ...c, user_id: session.user.id });
      const { data, error } = await supabase.from('clientes').insert({ ...clienteToDb(validated), user_id: session.user.id }).select().single();
      if (error) throw error;
      if (data) setClientes(p => [dbToCliente(data), ...p]);
      toast.success('Cliente guardado');
    } catch (error) {
      console.error('Error al agregar cliente:', error);
      toast.error('Error al guardar cliente', { description: error instanceof Error ? error.message : 'Error desconocido' });
      throw error;
    }
  };

  const updateCliente = async (id: string, c: UpdateCliente) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    try {
      const validated = validateCliente({ ...c, id, user_id: session.user.id });
      const { data, error } = await supabase.from('clientes').update(clienteToDb(validated)).eq('id', id).eq('user_id', session.user.id).select().single();
      if (error) throw error;
      if (data) setClientes(p => p.map(x => x.id === id ? dbToCliente(data) : x));
      toast.success('Cliente actualizado');
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      toast.error('Error al actualizar cliente', { description: error instanceof Error ? error.message : 'Error desconocido' });
      throw error;
    }
  };

  const deleteCliente = async (id: string) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    const { error } = await supabase.from('clientes').delete().eq('id', id).eq('user_id', session.user.id);
    if (error) { toast.error('Error al eliminar cliente'); throw error; }
    setClientes(p => p.filter(x => x.id !== id));
    toast.success('Cliente eliminado');
  };

  // ---------- CRUD Proyectos ----------
  const addProyecto = async (p: CreateProyecto) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    try {
      const validated = validateProyecto({ ...p, user_id: session.user.id });
      const { data, error } = await supabase.from('proyectos').insert({ ...proyectoToDb(validated), user_id: session.user.id }).select().single();
      if (error) throw error;
      if (data) setProyectos(prev => [dbToProyecto(data), ...prev]);
      toast.success('Proyecto guardado');
    } catch (error) {
      console.error('Error al agregar proyecto:', error);
      toast.error('Error al guardar proyecto', { description: error instanceof Error ? error.message : 'Error desconocido' });
      throw error;
    }
  };

  const updateProyecto = async (id: string, p: UpdateProyecto) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    try {
      const validated = validateProyecto({ ...p, id, user_id: session.user.id });
      const { data, error } = await supabase.from('proyectos').update(proyectoToDb(validated)).eq('id', id).eq('user_id', session.user.id).select().single();
      if (error) throw error;
      if (data) setProyectos(prev => prev.map(x => x.id === id ? dbToProyecto(data) : x));
      toast.success('Proyecto actualizado');
    } catch (error) {
      console.error('Error al actualizar proyecto:', error);
      toast.error('Error al actualizar proyecto', { description: error instanceof Error ? error.message : 'Error desconocido' });
      throw error;
    }
  };

  // ---------- CRUD Transacciones ----------
  const addTransaccion = async (t: CreateTransaccion) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    try {
      const validated = validateTransaccion({ ...t, user_id: session.user.id });
      const { data, error } = await supabase.from('transacciones').insert({ ...transaccionToDb(validated), user_id: session.user.id }).select().single();
      if (error) throw error;
      if (data) {
        setTransacciones(p => [dbToTransaccion(data), ...p]);
        toast.success('Transacción registrada');
      }
    } catch (error) {
      console.error('Error al agregar transacción:', error);
      toast.error('Error al registrar transacción', { description: error instanceof Error ? error.message : 'Error desconocido' });
      throw error;
    }
  };

  const deleteTransaccion = async (id: string) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    try {
      const { error } = await supabase.from('transacciones').delete().eq('id', id).eq('user_id', session.user.id);
      if (error) throw error;
      setTransacciones(p => p.filter(x => x.id !== id));
      toast.success('Transacción eliminada');
    } catch (error) {
      console.error('Error al eliminar transacción:', error);
      toast.error('Error al eliminar transacción');
    }
  };

  // ---------- CRUD Actividades ----------
  const addActividad = async (a: CreateActividad) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    try {
      const validated = validateActividad({ ...a, user_id: session.user.id });
      const { data, error } = await supabase.from('actividades').insert({ ...actividadToDb(validated), user_id: session.user.id }).select().single();
      if (error) throw error;
      if (data) {
        setActividades(p => [dbToActividad(data), ...p]);
        toast.success('Actividad guardada');
      }
    } catch (error) {
      console.error('Error al agregar actividad:', error);
      toast.error('Error al guardar actividad', { description: error instanceof Error ? error.message : 'Error desconocido' });
      throw error;
    }
  };

  const deleteActividad = async (id: string) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    try {
      const { error } = await supabase.from('actividades').delete().eq('id', id).eq('user_id', session.user.id);
      if (error) throw error;
      setActividades(p => p.filter(x => x.id !== id));
      toast.success('Actividad eliminada');
    } catch (error) {
      console.error('Error al eliminar actividad:', error);
      toast.error('Error al eliminar actividad');
    }
  };

  // ---------- CRUD Presupuestos (unificado con fase) ----------
  const addPresupuesto = async (p: CreatePresupuestoInput): Promise<string | null> => {
    if (!session) return null;
    try {
      const createPayload: CreatePresupuesto = {
        proyecto: p.proyecto,
        cliente: p.cliente || '',
        ubicacion: p.ubicacion || '',
        tipologia: p.tipologia || '',
        fase: p.fase || 'planeación',
        factor_indirectos: p.factor_indirectos ?? 12,
        factor_administrativos: p.factor_administrativos ?? 8,
        factor_imprevistos: p.factor_imprevistos ?? 5,
        factor_utilidad: p.factor_utilidad ?? 15,
        lineas: p.lineas || [],
        total: p.total || 0,
        user_id: session.user.id,
        avanceFisico: 0,
        avanceFinanciero: 0,
        ingresos: 0,
        gastos: 0,
        pendienteAportar: 0,
        fechaInicio: '',
        fechaFin: '',
        proyectoId: undefined,
      };
      const dbPayload = presupuestoToDb(createPayload);
      const { data, error } = await supabase.from('presupuestos')
        .insert({ ...dbPayload, user_id: session.user.id, created_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      if (data) {
        setPresupuestos(prev => [dbToPresupuesto(data), ...prev]);
        toast.success('Presupuesto guardado');
        return data.id;
      }
      return null;
    } catch (error) {
      console.error('Error al agregar presupuesto:', error);
      // Log detallado del error de Supabase
      if (typeof error === 'object' && error !== null && 'message' in error) {
        const err = error as { message: string; details?: string; hint?: string };
        console.error('Detalles Supabase:', err.message, err.details, err.hint);
      }
      toast.error('Error al guardar presupuesto', { description: error instanceof Error ? error.message : 'Error desconocido' });
      throw error;
    }
  };

  const updatePresupuesto = async (id: string, p: UpdatePresupuesto) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    try {
      const dbPayload = presupuestoToDb(p);
      const { data, error } = await supabase.from('presupuestos')
        .update({ ...dbPayload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', session.user.id)
        .select()
        .single();
      if (error) throw error;
      if (data) {
        setPresupuestos(prev => prev.map(x => x.id === id ? dbToPresupuesto(data) : x));
        toast.success('Presupuesto actualizado');
      }
    } catch (error) {
      console.error('Error al actualizar presupuesto:', error);
      toast.error('Error al actualizar presupuesto', { description: error instanceof Error ? error.message : 'Error desconocido' });
      throw error;
    }
  };

  const transicionFase = async (id: string, nuevaFase: Presupuesto['fase']) => {
    if (!session) return;
    const original = presupuestos.find(p => p.id === id)?.fase;
    try {
      setPresupuestos(prev => prev.map(p => p.id === id ? { ...p, fase: nuevaFase } : p));
      const { error } = await supabase.rpc('transicionar_fase', {
        p_presupuesto_id: id,
        p_nueva_fase: nuevaFase,
        p_user_id: session.user.id,
      });
      if (error) {
        console.error('Detalles del error en RPC transicionar_fase:', error);
        throw error;
      }
      const { data: refreshed } = await supabase.from('presupuestos').select('*').eq('id', id).single();
      if (refreshed) setPresupuestos(prev => prev.map(p => p.id === id ? dbToPresupuesto(refreshed) : p));
      const { data: projData } = await supabase.from('proyectos').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(1);
      if (projData && projData.length > 0) setProyectos(prev => {
        const exists = prev.find(x => x.id === projData[0].id);
        if (exists) return prev.map(x => x.id === projData[0].id ? dbToProyecto(projData[0]) : x);
        return [dbToProyecto(projData[0]), ...prev];
      });
      toast.success(`Proyecto movido a fase: ${nuevaFase}`);
    } catch (error) {
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
      const validated = validateEquipo({ ...e, user_id: session.user.id });
      const { data, error } = await supabase.from('equipos').insert({ ...equipoToDb(validated), user_id: session.user.id }).select().single();
      if (error) throw error;
      if (data) setEquipos(p => [dbToEquipo(data), ...p]);
      toast.success('Equipo guardado');
    } catch (error) {
      console.error('Error al agregar equipo:', error);
      toast.error('Error al guardar equipo', { description: error instanceof Error ? error.message : 'Error desconocido' });
      throw error;
    }
  };

  const updateEquipo = async (id: string, e: UpdateEquipo) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    try {
      const validated = validateEquipo({ ...e, id, user_id: session.user.id });
      const { data, error } = await supabase.from('equipos').update(equipoToDb(validated)).eq('id', id).eq('user_id', session.user.id).select().single();
      if (error) throw error;
      if (data) setEquipos(p => p.map(x => x.id === id ? dbToEquipo(data) : x));
      toast.success('Equipo actualizado');
    } catch (error) {
      console.error('Error al actualizar equipo:', error);
      toast.error('Error al actualizar equipo', { description: error instanceof Error ? error.message : 'Error desconocido' });
      throw error;
    }
  };

  const deleteEquipo = async (id: string) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    const { error } = await supabase.from('equipos').delete().eq('id', id).eq('user_id', session.user.id);
    if (error) { toast.error('Error al eliminar equipo'); throw error; }
    setEquipos(p => p.filter(x => x.id !== id));
    toast.success('Equipo eliminado');
  };

  // ---------- CRUD Equipo Miembros ----------
  const addEquipoMiembro = async (em: CreateEquipoMiembro) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    try {
      const validated = validateEquipoMiembro({ ...em, user_id: session.user.id });
      const { data, error } = await supabase.from('equipo_miembros').insert({ ...equipoMiembroToDb(validated), user_id: session.user.id }).select().single();
      if (error) throw error;
      if (data) setEquipoMiembros(p => [dbToEquipoMiembro(data), ...p]);
      toast.success('Miembro agregado al equipo');
    } catch (error) {
      console.error('Error al agregar miembro:', error);
      toast.error('Error al agregar miembro', { description: error instanceof Error ? error.message : 'Error desconocido' });
      throw error;
    }
  };

  const updateEquipoMiembro = async (id: string, em: UpdateEquipoMiembro) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    try {
      const validated = validateEquipoMiembro({ ...em, id, user_id: session.user.id });
      const { data, error } = await supabase.from('equipo_miembros').update(equipoMiembroToDb(validated)).eq('id', id).select().single();
      if (error) throw error;
      if (data) setEquipoMiembros(p => p.map(x => x.id === id ? dbToEquipoMiembro(data) : x));
      toast.success('Miembro actualizado');
    } catch (error) {
      console.error('Error al actualizar miembro:', error);
      toast.error('Error al actualizar miembro', { description: error instanceof Error ? error.message : 'Error desconocido' });
      throw error;
    }
  };

  const deleteEquipoMiembro = async (id: string) => {
    if (!session) { toast.error('Sesión no encontrada'); return; }
    const { error } = await supabase.from('equipo_miembros').delete().eq('id', id);
    if (error) { toast.error('Error al eliminar miembro'); throw error; }
    setEquipoMiembros(p => p.filter(x => x.id !== id));
    toast.success('Miembro removido del equipo');
  };

  return (
    <AppContext.Provider value={{
      view, setView, session, loading, authError, signIn, signUp, signInWithGoogle, signOut, user,
      clientes, addCliente, updateCliente, deleteCliente,
      proyectos, addProyecto, updateProyecto,
      transacciones, addTransaccion, deleteTransaccion,
      actividades, addActividad, deleteActividad,
      presupuestos, addPresupuesto, updatePresupuesto, transicionFase,
      equipos, addEquipo, updateEquipo, deleteEquipo,
      equipoMiembros, addEquipoMiembro, updateEquipoMiembro, deleteEquipoMiembro,
      sidebarOpen, toggleSidebar: () => setSidebarOpen(p => !p),
      darkMode, toggleDarkMode: () => setDarkMode(p => !p),
    }}>
      {children}
    </AppContext.Provider>
  );
};