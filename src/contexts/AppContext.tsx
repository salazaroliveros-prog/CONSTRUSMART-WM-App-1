import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

export type ViewType = 'login' | 'dashboard' | 'clientes' | 'presupuesto' | 'seguimiento' | 'financiero';

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  tipoProyecto: string;
  estado: 'Potencial' | 'Activo' | 'Cerrado';
  notas: string;
  fecha: string;
}

export interface Proyecto {
  id: string;
  nombre: string;
  cliente: string;
  tipo: string;
  estado: 'Ejecución' | 'Planeación';
  presupuestoTotal: number;
  avanceFisico: number;
  avanceFinanciero: number;
  ingresos: number;
  gastos: number;
  pendienteAportar: number;
  fechaInicio: string;
  fechaFin: string;
}

export type CategoriaTransaccion =
  | 'materiales' | 'mano-obra' | 'herramienta' | 'sub-contrato'
  | 'administrativo' | 'personal' | 'transporte' | 'fijos'
  | 'hogar' | 'aporte' | 'trabajos-extra';

export interface Transaccion {
  id: string;
  tipo: 'ingreso' | 'gasto';
  descripcion: string;
  cantidad: number;
  unidad: string;
  categoria: CategoriaTransaccion;
  costoUnitario: number;
  costoTotal: number;
  fecha: string;
  proyectoId: string;
}

export interface Actividad {
  id: string;
  titulo: string;
  fecha: string;
  hora: string;
  descripcion: string;
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
  user: { nombre: string; empresa: string; avatar: string };

  clientes: Cliente[];
  addCliente: (c: Omit<Cliente, 'id'>) => Promise<void>;
  updateCliente: (id: string, c: Partial<Cliente>) => Promise<void>;
  deleteCliente: (id: string) => Promise<void>;

  proyectos: Proyecto[];
  addProyecto: (p: Omit<Proyecto, 'id'>) => Promise<void>;
  updateProyecto: (id: string, p: Partial<Proyecto>) => Promise<void>;

  transacciones: Transaccion[];
  addTransaccion: (t: Omit<Transaccion, 'id'>) => Promise<void>;
  deleteTransaccion: (id: string) => Promise<void>;

  actividades: Actividad[];
  addActividad: (a: Omit<Actividad, 'id'>) => Promise<void>;
  deleteActividad: (id: string) => Promise<void>;

  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

// ---------- Mapeo DB <-> TS ----------
const dbToCliente = (r: any): Cliente => ({
  id: r.id, nombre: r.nombre || '', telefono: r.telefono || '', email: r.email || '',
  direccion: r.direccion || '', tipoProyecto: r.tipo_proyecto || 'Residencial',
  estado: r.estado || 'Potencial', notas: r.notas || '', fecha: r.fecha || '',
});
const clienteToDb = (c: Partial<Cliente>) => ({
  nombre: c.nombre, telefono: c.telefono, email: c.email, direccion: c.direccion,
  tipo_proyecto: c.tipoProyecto, estado: c.estado, notas: c.notas, fecha: c.fecha,
});

const dbToProyecto = (r: any): Proyecto => ({
  id: r.id, nombre: r.nombre, cliente: r.cliente || '', tipo: r.tipo || '',
  estado: r.estado || 'Planeación',
  presupuestoTotal: Number(r.presupuesto_total) || 0,
  avanceFisico: Number(r.avance_fisico) || 0,
  avanceFinanciero: Number(r.avance_financiero) || 0,
  ingresos: Number(r.ingresos) || 0,
  gastos: Number(r.gastos) || 0,
  pendienteAportar: Number(r.pendiente_aportar) || 0,
  fechaInicio: r.fecha_inicio || '', fechaFin: r.fecha_fin || '',
});
const proyectoToDb = (p: Partial<Proyecto>) => ({
  nombre: p.nombre, cliente: p.cliente, tipo: p.tipo, estado: p.estado,
  presupuesto_total: p.presupuestoTotal, avance_fisico: p.avanceFisico,
  avance_financiero: p.avanceFinanciero, ingresos: p.ingresos, gastos: p.gastos,
  pendiente_aportar: p.pendienteAportar, fecha_inicio: p.fechaInicio, fecha_fin: p.fechaFin,
});

const dbToTransaccion = (r: any): Transaccion => ({
  id: r.id, tipo: r.tipo, descripcion: r.descripcion || '',
  cantidad: Number(r.cantidad) || 0, unidad: r.unidad || '',
  categoria: r.categoria, costoUnitario: Number(r.costo_unitario) || 0,
  costoTotal: Number(r.costo_total) || 0, fecha: r.fecha || '',
  proyectoId: r.proyecto_id || 'admin',
});
const transaccionToDb = (t: Partial<Transaccion>) => ({
  tipo: t.tipo, descripcion: t.descripcion, cantidad: t.cantidad,
  unidad: t.unidad, categoria: t.categoria, costo_unitario: t.costoUnitario,
  costo_total: t.costoTotal, fecha: t.fecha, proyecto_id: t.proyectoId,
});

const dbToActividad = (r: any): Actividad => ({
  id: r.id, titulo: r.titulo, fecha: r.fecha, hora: r.hora || '', descripcion: r.descripcion || '',
});
const actividadToDb = (a: Partial<Actividad>) => ({
  titulo: a.titulo, fecha: a.fecha, hora: a.hora, descripcion: a.descripcion,
});

// ---------- Seed inicial ----------
const seedDatabase = async (userId: string) => {
  const clientesSeed = [
    { user_id: userId, nombre: 'María Fernanda López', telefono: '5544-8821', email: 'mf.lopez@gmail.com', direccion: 'Zona 14, Ciudad de Guatemala', tipo_proyecto: 'Residencial', estado: 'Activo', notas: 'Casa de 2 niveles, 250m²', fecha: '2025-08-15' },
    { user_id: userId, nombre: 'Inversiones del Pacífico S.A.', telefono: '2245-1100', email: 'contacto@invpacifico.com', direccion: 'Zona 10, Edificio Géminis', tipo_proyecto: 'Comercial', estado: 'Activo', notas: 'Plaza comercial 800m²', fecha: '2025-07-22' },
    { user_id: userId, nombre: 'Carlos Estuardo Méndez', telefono: '4477-9912', email: 'cmendez@hotmail.com', direccion: 'Antigua Guatemala', tipo_proyecto: 'Residencial', estado: 'Potencial', notas: 'Remodelación de casa colonial', fecha: '2026-02-10' },
    { user_id: userId, nombre: 'Distribuidora Logística GT', telefono: '6655-3322', email: 'gerencia@distlog.gt', direccion: 'Mixco, Km 18.5', tipo_proyecto: 'Industrial', estado: 'Activo', notas: 'Bodega de 1200m²', fecha: '2025-09-05' },
  ];
  await supabase.from('clientes').insert(clientesSeed);

  const proyectosSeed = [
    { user_id: userId, nombre: 'Residencia López Z14', cliente: 'María Fernanda López', tipo: 'Residencial', estado: 'Ejecución', presupuesto_total: 950000, avance_fisico: 65, avance_financiero: 60, ingresos: 570000, gastos: 425000, pendiente_aportar: 380000, fecha_inicio: '2025-09-01', fecha_fin: '2026-06-30' },
    { user_id: userId, nombre: 'Plaza Comercial Géminis', cliente: 'Inversiones del Pacífico S.A.', tipo: 'Comercial', estado: 'Ejecución', presupuesto_total: 2800000, avance_fisico: 42, avance_financiero: 45, ingresos: 1260000, gastos: 980000, pendiente_aportar: 1540000, fecha_inicio: '2025-08-15', fecha_fin: '2026-10-15' },
    { user_id: userId, nombre: 'Bodega Industrial Mixco', cliente: 'Distribuidora Logística GT', tipo: 'Industrial', estado: 'Ejecución', presupuesto_total: 1850000, avance_fisico: 78, avance_financiero: 75, ingresos: 1387500, gastos: 1180000, pendiente_aportar: 462500, fecha_inicio: '2025-06-01', fecha_fin: '2026-05-30' },
    { user_id: userId, nombre: 'Remodelación Casa Antigua', cliente: 'Carlos Estuardo Méndez', tipo: 'Residencial', estado: 'Planeación', presupuesto_total: 680000, avance_fisico: 0, avance_financiero: 5, ingresos: 34000, gastos: 12000, pendiente_aportar: 646000, fecha_inicio: '2026-06-01', fecha_fin: '2027-02-28' },
  ];
  await supabase.from('proyectos').insert(proyectosSeed);

  const today = new Date().toISOString().split('T')[0];
  const transSeed = [
    { user_id: userId, tipo: 'gasto', descripcion: 'Compra cemento UGC 4000PSI', cantidad: 250, unidad: 'sacos', categoria: 'materiales', costo_unitario: 85, costo_total: 21250, fecha: '2025-09-15', proyecto_id: 'admin' },
    { user_id: userId, tipo: 'gasto', descripcion: 'Pago de planilla quincena', cantidad: 12, unidad: 'jornales', categoria: 'mano-obra', costo_unitario: 1850, costo_total: 22200, fecha: '2025-09-30', proyecto_id: 'admin' },
    { user_id: userId, tipo: 'gasto', descripcion: 'Alquiler oficina mensual', cantidad: 1, unidad: 'mes', categoria: 'fijos', costo_unitario: 4500, costo_total: 4500, fecha: today, proyecto_id: 'admin' },
  ];
  await supabase.from('transacciones').insert(transSeed);

  await supabase.from('actividades').insert([
    { user_id: userId, titulo: 'Visita obra Z14', fecha: today, hora: '09:00', descripcion: 'Revisión avance de losa' },
  ]);
};

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

  // Inicialización de sesión
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        loadAll(data.session.user.id).finally(() => setLoading(false));
        setView('dashboard');
      } else {
        setLoading(false);
        setView('login');
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) {
        loadAll(s.user.id);
        if (view === 'login') setView('dashboard');
      } else {
        setClientes([]); setProyectos([]); setTransacciones([]); setActividades([]);
        setView('login');
      }
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const addCliente = async (c: Omit<Cliente, 'id'>) => {
    if (!session) return;
    const { data, error } = await supabase.from('clientes').insert({ ...clienteToDb(c), user_id: session.user.id }).select().single();
    if (!error && data) setClientes(p => [dbToCliente(data), ...p]);
  };
  const updateCliente = async (id: string, c: Partial<Cliente>) => {
    const { data, error } = await supabase.from('clientes').update(clienteToDb(c)).eq('id', id).select().single();
    if (!error && data) setClientes(p => p.map(x => x.id === id ? dbToCliente(data) : x));
  };
  const deleteCliente = async (id: string) => {
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (!error) setClientes(p => p.filter(x => x.id !== id));
  };

  // ---------- CRUD Proyectos ----------
  const addProyecto = async (p: Omit<Proyecto, 'id'>) => {
    if (!session) return;
    const { data, error } = await supabase.from('proyectos').insert({ ...proyectoToDb(p), user_id: session.user.id }).select().single();
    if (!error && data) setProyectos(prev => [dbToProyecto(data), ...prev]);
  };
  const updateProyecto = async (id: string, p: Partial<Proyecto>) => {
    const { data, error } = await supabase.from('proyectos').update(proyectoToDb(p)).eq('id', id).select().single();
    if (!error && data) setProyectos(prev => prev.map(x => x.id === id ? dbToProyecto(data) : x));
  };

  // ---------- CRUD Transacciones ----------
  const addTransaccion = async (t: Omit<Transaccion, 'id'>) => {
    if (!session) return;
    const { data, error } = await supabase.from('transacciones').insert({ ...transaccionToDb(t), user_id: session.user.id }).select().single();
    if (!error && data) setTransacciones(p => [dbToTransaccion(data), ...p]);
  };
  const deleteTransaccion = async (id: string) => {
    const { error } = await supabase.from('transacciones').delete().eq('id', id);
    if (!error) setTransacciones(p => p.filter(x => x.id !== id));
  };

  // ---------- CRUD Actividades ----------
  const addActividad = async (a: Omit<Actividad, 'id'>) => {
    if (!session) return;
    const { data, error } = await supabase.from('actividades').insert({ ...actividadToDb(a), user_id: session.user.id }).select().single();
    if (!error && data) setActividades(p => [dbToActividad(data), ...p]);
  };
  const deleteActividad = async (id: string) => {
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
