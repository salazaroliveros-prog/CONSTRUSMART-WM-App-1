import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { PostgresChangesPayload } from '@supabase/supabase-js';
import { seedDatabase } from '@/utils/seedDatabase';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { 
  Cliente, Proyecto, Transaccion, Actividad, Presupuesto, CategoriaTransaccion,
  CreateCliente, CreateProyecto, CreateTransaccion, CreateActividad, CreatePresupuesto,
  UpdateCliente, UpdateProyecto, UpdateTransaccion, UpdateActividad, UpdatePresupuesto,
  CreatePresupuestoInput,
  validateCliente, validateProyecto, validateTransaccion, validateActividad, validatePresupuesto,
  dbToCliente, clienteToDb, dbToProyecto, proyectoToDb,
  dbToTransaccion, transaccionToDb, dbToActividad, actividadToDb, dbToPresupuesto, presupuestoToDb
} from '@/types/supabase';

export type { CategoriaTransaccion };

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
   const realtimeClientes = useRef<ReturnType<ReturnType<typeof supabase.channel>> | null>(null);
   const realtimeProyectos = useRef<ReturnType<ReturnType<typeof supabase.channel>> | null>(null);
   const realtimePresupuestos = useRef<ReturnType<ReturnType<typeof supabase.channel>> | null>(null);
   const realtimeTransacciones = useRef<ReturnType<ReturnType<typeof supabase.channel>> | null>(null);
   const realtimeActividades = useRef<ReturnType<ReturnType<typeof supabase.channel>> | null>(null);
   const initDoneRef = useRef(false);
   const mountedRef = useRef(true);

   const user = {
     nombre: session?.user?.user_metadata?.nombre || session?.user?.email?.split('@')[0] || 'Usuario',
     empresa: 'CONSTRUCTORA WM/M&S',
     avatar: 'https://d64gsuwffb70l.cloudfront.net/6a106c672819eb11ecba36f6_1779461651195_cb50cf4b.png',
   };

   const loadAll = useCallback(async (userId?: string) => {
     if (!userId) return;
     
     // Evitar múltiples ejecuciones simultáneas
     if (loadingRef.current) return;
     loadingRef.current = true;
     
      const PAGE_SIZE = 200;
      try {
        let cR, pR, prR, tR, aR;
        try { [cR] = await Promise.all([supabase.from('clientes').select('*').order('created_at', { ascending: false }).limit(PAGE_SIZE)]); } catch (e) { console.error('Error cargando clientes:', e); }
        try { [pR] = await Promise.all([supabase.from('proyectos').select('*').order('created_at', { ascending: false }).limit(PAGE_SIZE)]); } catch (e) { console.error('Error cargando proyectos:', e); }
        try { [prR] = await Promise.all([supabase.from('presupuestos').select('*').order('created_at', { ascending: false }).limit(PAGE_SIZE)]); } catch (e) { console.error('Error cargando presupuestos:', e); }
        try { [tR] = await Promise.all([supabase.from('transacciones').select('*').order('fecha', { ascending: false }).limit(PAGE_SIZE)]); } catch (e) { console.error('Error cargando transacciones:', e); }
        try { [aR] = await Promise.all([supabase.from('actividades').select('*').order('fecha', { ascending: false }).limit(PAGE_SIZE)]); } catch (e) { console.error('Error cargando actividades:', e); }
        
        setClientes((cR?.data || []).map(dbToCliente));
        setProyectos((pR?.data || []).map(dbToProyecto));
        setPresupuestos((prR?.data || []).map(dbToPresupuesto));
        setTransacciones((tR?.data || []).map(dbToTransaccion));
        setActividades((aR?.data || []).map(dbToActividad));
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
        if (realPayload.eventType === 'INSERT') {
          setClientes(prev => [dbToCliente(realPayload.new), ...prev]);
        } else if (realPayload.eventType === 'UPDATE') {
          setClientes(prev => prev.map(x => x.id === realPayload.new.id ? dbToCliente(realPayload.new) : x));
        } else if (realPayload.eventType === 'DELETE') {
          setClientes(prev => prev.filter(x => x.id !== realPayload.old.id));
        }
        break;
      case 'proyectos':
        if (realPayload.eventType === 'INSERT') {
          setProyectos(prev => [dbToProyecto(realPayload.new), ...prev]);
        } else if (realPayload.eventType === 'UPDATE') {
          setProyectos(prev => prev.map(x => x.id === realPayload.new.id ? dbToProyecto(realPayload.new) : x));
        } else if (realPayload.eventType === 'DELETE') {
          setProyectos(prev => prev.filter(x => x.id !== realPayload.old.id));
        }
        break;
      case 'transacciones':
        if (realPayload.eventType === 'INSERT') {
          setTransacciones(prev => [dbToTransaccion(realPayload.new), ...prev]);
        } else if (realPayload.eventType === 'UPDATE') {
          setTransacciones(prev => prev.map(x => x.id === realPayload.new.id ? dbToTransaccion(realPayload.new) : x));
        } else if (realPayload.eventType === 'DELETE') {
          setTransacciones(prev => prev.filter(x => x.id !== realPayload.old.id));
        }
        break;
      case 'presupuestos':
        if (realPayload.eventType === 'INSERT') {
          setPresupuestos(prev => [dbToPresupuesto(realPayload.new), ...prev]);
        } else if (realPayload.eventType === 'UPDATE') {
          setPresupuestos(prev => prev.map(x => x.id === realPayload.new.id ? dbToPresupuesto(realPayload.new) : x));
        } else if (realPayload.eventType === 'DELETE') {
          setPresupuestos(prev => prev.filter(x => x.id !== realPayload.old.id));
        }
        break;
      case 'actividades':
        if (realPayload.eventType === 'INSERT') {
          setActividades(prev => [dbToActividad(realPayload.new), ...prev]);
        } else if (realPayload.eventType === 'UPDATE') {
          setActividades(prev => prev.map(x => x.id === realPayload.new.id ? dbToActividad(realPayload.new) : x));
        } else if (realPayload.eventType === 'DELETE') {
          setActividades(prev => prev.filter(x => x.id !== realPayload.old.id));
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

  const signOut = async () => {
    await supabase.auth.signOut();
    setView('login');
  };

  // ---------- CRUD Clientes ----------
  const addCliente = async (c: CreateCliente) => {
    if (!session) return;
    try {
      // Validar datos antes de enviar a Supabase
      const validated = validateCliente({ ...c, user_id: session.user.id });
      const { data, error } = await supabase.from('clientes').insert({ ...clienteToDb(validated), user_id: session.user.id }).select().single();
      if (!error && data) setClientes(p => [dbToCliente(data), ...p]);
    } catch (error) {
      console.error('Error al agregar cliente:', error);
      throw error;
    }
  };

  const updateCliente = async (id: string, c: UpdateCliente) => {
    try {
      // Validar datos antes de enviar a Supabase
      const validated = validateCliente({ ...c, id, user_id: session?.user.id });
      const { data, error } = await supabase.from('clientes').update(clienteToDb(validated)).eq('id', id).select().single();
      if (!error && data) setClientes(p => p.map(x => x.id === id ? dbToCliente(data) : x));
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      throw error;
    }
  };

  const deleteCliente = async (id: string) => {
    if (!session) return;
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (!error) setClientes(p => p.filter(x => x.id !== id));
  };

  // ---------- CRUD Proyectos ----------
  const addProyecto = async (p: CreateProyecto) => {
    if (!session) return;
    try {
      // Validar datos antes de enviar a Supabase
      const validated = validateProyecto({ ...p, user_id: session.user.id });
      const { data, error } = await supabase.from('proyectos').insert({ ...proyectoToDb(validated), user_id: session.user.id }).select().single();
      if (!error && data) setProyectos(prev => [dbToProyecto(data), ...prev]);
    } catch (error) {
      console.error('Error al agregar proyecto:', error);
      throw error;
    }
  };

  const updateProyecto = async (id: string, p: UpdateProyecto) => {
    try {
      // Validar datos antes de enviar a Supabase
      const validated = validateProyecto({ ...p, id, user_id: session?.user.id });
      const { data, error } = await supabase.from('proyectos').update(proyectoToDb(validated)).eq('id', id).select().single();
      if (!error && data) setProyectos(prev => prev.map(x => x.id === id ? dbToProyecto(data) : x));
    } catch (error) {
      console.error('Error al actualizar proyecto:', error);
      throw error;
    }
  };

  // ---------- CRUD Transacciones ----------
  const addTransaccion = async (t: CreateTransaccion) => {
    if (!session) return;
    try {
      // Validar datos antes de enviar a Supabase
      const validated = validateTransaccion({ ...t, user_id: session.user.id });
      const { data, error } = await supabase.from('transacciones').insert({ ...transaccionToDb(validated), user_id: session.user.id }).select().single();
      if (!error && data) setTransacciones(p => [dbToTransaccion(data), ...p]);
    } catch (error) {
      console.error('Error al agregar transacción:', error);
      throw error;
    }
  };

  const deleteTransaccion = async (id: string) => {
    if (!session) return;
    const { error } = await supabase.from('transacciones').delete().eq('id', id);
    if (!error) setTransacciones(p => p.filter(x => x.id !== id));
  };

  // ---------- CRUD Actividades ----------
  const addActividad = async (a: CreateActividad) => {
    if (!session) return;
    try {
      // Validar datos antes de enviar a Supabase
      const validated = validateActividad({ ...a, user_id: session.user.id });
      const { data, error } = await supabase.from('actividades').insert({ ...actividadToDb(validated), user_id: session.user.id }).select().single();
      if (!error && data) setActividades(p => [dbToActividad(data), ...p]);
    } catch (error) {
      console.error('Error al agregar actividad:', error);
      throw error;
    }
  };

  const deleteActividad = async (id: string) => {
    if (!session) return;
    const { error } = await supabase.from('actividades').delete().eq('id', id);
    if (!error) setActividades(p => p.filter(x => x.id !== id));
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
      toast.error('Error al guardar presupuesto', { description: error instanceof Error ? error.message : 'Error desconocido' });
      throw error;
    }
  };

  const updatePresupuesto = async (id: string, p: UpdatePresupuesto) => {
    try {
      const dbPayload = presupuestoToDb(p);
      const { data, error } = await supabase.from('presupuestos')
        .update({ ...dbPayload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
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
      const { data, error } = await supabase.rpc('transicionar_fase', {
        p_presupuesto_id: id,
        p_nueva_fase: nuevaFase,
        p_user_id: session.user.id,
      });
      if (error) throw error;
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

  return (
    <AppContext.Provider value={{
      view, setView, session, loading, authError, signIn, signUp, signOut, user,
      clientes, addCliente, updateCliente, deleteCliente,
      proyectos, addProyecto, updateProyecto,
      transacciones, addTransaccion, deleteTransaccion,
      actividades, addActividad, deleteActividad,
      presupuestos, addPresupuesto, updatePresupuesto, transicionFase,
      sidebarOpen, toggleSidebar: () => setSidebarOpen(p => !p),
      darkMode, toggleDarkMode: () => setDarkMode(p => !p),
    }}>
      {children}
    </AppContext.Provider>
  );
};