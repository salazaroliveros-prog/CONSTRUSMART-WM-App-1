import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { PostgresChangesPayload } from '@supabase/supabase-js';
import { seedDatabase } from '@/utils/seedDatabase';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { 
  Cliente, Proyecto, Transaccion, Actividad,
  CreateCliente, CreateProyecto, CreateTransaccion, CreateActividad,
  UpdateCliente, UpdateProyecto, UpdateTransaccion, UpdateActividad,
  validateCliente, validateProyecto, validateTransaccion, validateActividad,
  dbToCliente, clienteToDb, dbToProyecto, proyectoToDb,
  dbToTransaccion, transaccionToDb, dbToActividad, actividadToDb
} from '@/types/supabase';

export type ViewType = 'login' | 'dashboard' | 'clientes' | 'presupuesto' | 'seguimiento' | 'financiero';

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

  sidebarOpen: boolean;
  toggleSidebar: () => void;
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

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const realtimeClientes = useRef<ReturnType<ReturnType<typeof supabase.channel>> | null>(null);
  const realtimeProyectos = useRef<ReturnType<ReturnType<typeof supabase.channel>> | null>(null);
  const realtimeTransacciones = useRef<ReturnType<ReturnType<typeof supabase.channel>> | null>(null);
  const realtimeActividades = useRef<ReturnType<ReturnType<typeof supabase.channel>> | null>(null);

  const user = {
    nombre: session?.user?.user_metadata?.nombre || session?.user?.email?.split('@')[0] || 'Usuario',
    empresa: 'CONSTRUCTORA WM/M&S',
    avatar: 'https://d64gsuwffb70l.cloudfront.net/6a106c672819eb11ecba36f6_1779461651195_cb50cf4b.png',
  };

  const loadAll = useCallback(async (userId: string) => {
    const [cR, pR, tR, aR] = await Promise.all([
      supabase.from('clientes').select('*').order('created_at', { ascending: false }),
      supabase.from('proyectos').select('*').order('created_at', { ascending: false }),
      supabase.from('transacciones').select('*').order('fecha', { ascending: false }),
      supabase.from('actividades').select('*').order('fecha', { ascending: false }),
    ]);
    setClientes((cR.data || []).map(dbToCliente));
    setProyectos((pR.data || []).map(dbToProyecto));
    setTransacciones((tR.data || []).map(dbToTransaccion));
    setActividades((aR.data || []).map(dbToActividad));

    // Seed si está vacío
    if ((cR.data?.length || 0) === 0 && (pR.data?.length || 0) === 0) {
      await seedDatabase(userId);
      const [c2, p2, t2, a2] = await Promise.all([
        supabase.from('clientes').select('*'),
        supabase.from('proyectos').select('*'),
        supabase.from('transacciones').select('*'),
        supabase.from('actividades').select('*'),
      ]);
      setClientes((c2.data || []).map(dbToCliente));
      setProyectos((p2.data || []).map(dbToProyecto));
      setTransacciones((t2.data || []).map(dbToTransaccion));
      setActividades((a2.data || []).map(dbToActividad));
    }
  }, []);

  // Inicialización de sesión y realtime listeners
  useEffect(() => {
    // Cargar sesión inicial
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        loadAll(data.session.user.id).finally(() => setLoading(false));
        setView('dashboard');
        setupRealtimeListeners(data.session.user.id);
      } else {
        setLoading(false);
        setView('login');
      }
    });

    // Escuchar cambios de autenticación
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      if (s) {
        await loadAll(s.user.id);
        setupRealtimeListeners(s.user.id);
        if (view === 'login') setView('dashboard');
      } else {
        setClientes([]); setProyectos([]); setTransacciones([]); setActividades([]);
        setView('login');
      }
    });

    return () => {
      // Limpiar suscripciones
      sub.subscription.unsubscribe();
      // Limpiar listeners realtime
      if (realtimeClientes) realtimeClientes.unsubscribe();
      if (realtimeProyectos) realtimeProyectos.unsubscribe();
      if (realtimeTransacciones) realtimeTransacciones.unsubscribe();
      if (realtimeActividades) realtimeActividades.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Setup realtime listeners para todas las tablas
  const setupRealtimeListeners = (userId: string) => {
    // Clientes realtime
    if (realtimeClientes) realtimeClientes.unsubscribe();
    realtimeClientes = supabase
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
    if (realtimeProyectos) realtimeProyectos.unsubscribe();
    realtimeProyectos = supabase
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

    // Transacciones realtime
    if (realtimeTransacciones) realtimeTransacciones.unsubscribe();
    realtimeTransacciones = supabase
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
    if (realtimeActividades) realtimeActividades.unsubscribe();
    realtimeActividades = supabase
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
      const { data, error } = await supabase.from('clientes').insert(clienteToDb(validated)).select().single();
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
      const { data, error } = await supabase.from('proyectos').insert(proyectoToDb(validated)).select().single();
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
      const { data, error } = await supabase.from('transacciones').insert(transaccionToDb(validated)).select().single();
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
      const { data, error } = await supabase.from('actividades').insert(actividadToDb(validated)).select().single();
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

  return (
    <AppContext.Provider value={{
      view, setView, session, loading, authError, signIn, signUp, signOut, user,
      clientes, addCliente, updateCliente, deleteCliente,
      proyectos, addProyecto, updateProyecto,
      transacciones, addTransaccion, deleteTransaccion,
      actividades, addActividad, deleteActividad,
      sidebarOpen, toggleSidebar: () => setSidebarOpen(p => !p),
    }}>
      {children}
    </AppContext.Provider>
  );
};