// =====================================================================
// TIPOS DE SUPABASE BASADOS EN EL ESQUEMA DE BASE DE DATOS
// =====================================================================

import { z } from 'zod';

// ====== Esquemas de validación Zod ======
const ClienteSchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  nombre: z.string().min(1, 'El nombre es requerido'),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  direccion: z.string().optional(),
  tipo_proyecto: z.string().default('Residencial'),
  estado: z.enum(['Potencial', 'Activo', 'Cerrado']).default('Potencial'),
  notas: z.string().optional(),
  fecha: z.string().default(new Date().toISOString().split('T')[0]),
  created_at: z.string().optional(),
});

const ProyectoSchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  nombre: z.string().min(1, 'El nombre es requerido'),
  cliente: z.string().optional(),
  tipo: z.string().optional(),
  estado: z.enum(['Planeación', 'Ejecución', 'Finalizado', 'Evaluación', 'Parado']).default('Planeación'),
  presupuesto_total: z.number().default(0),
  avance_fisico: z.number().min(0).max(100).default(0),
  avance_financiero: z.number().min(0).max(100).default(0),
  ingresos: z.number().default(0),
  gastos: z.number().default(0),
  pendiente_aportar: z.number().default(0),
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional(),
  created_at: z.string().optional(),
});

const TransaccionSchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  tipo: z.enum(['ingreso', 'gasto']),
  descripcion: z.string().optional(),
  cantidad: z.number().min(0).default(1),
  unidad: z.string().optional(),
  categoria: z.enum([
    'materiales', 'mano-obra', 'herramienta', 'sub-contrato',
    'administrativo', 'personal', 'transporte', 'fijos',
    'hogar', 'aporte', 'trabajos-extra'
  ]),
  costo_unitario: z.number().min(0).default(0),
  costo_total: z.number().min(0).default(0),
  fecha: z.string().default(new Date().toISOString().split('T')[0]),
  proyecto_id: z.string().default('admin'),
  created_at: z.string().optional(),
});

const ActividadSchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  titulo: z.string().min(1, 'El título es requerido'),
  fecha: z.string(),
  hora: z.string().optional(),
  descripcion: z.string().optional(),
  presupuesto_id: z.string().optional(),
  created_at: z.string().optional(),
});

const PresupuestoSchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  proyecto: z.string().min(1, 'El nombre del proyecto es requerido'),
  cliente: z.string().optional(),
  ubicacion: z.string().optional(),
  tipologia: z.string().optional(),
  fase: z.enum(['planeación', 'ejecución', 'pausa', 'finalizado']).default('planeación'),
  proyecto_id: z.string().optional(),
  factor_indirectos: z.number().min(0).default(0),
  factor_administrativos: z.number().min(0).default(0),
  factor_imprevistos: z.number().min(0).default(0),
  factor_utilidad: z.number().min(0).default(0),
  lineas: z.array(z.any()).default([]),
  avance_fisico: z.number().min(0).max(100).default(0),
  avance_financiero: z.number().min(0).max(100).default(0),
  ingresos: z.number().default(0),
  gastos: z.number().default(0),
  pendiente_aportar: z.number().default(0),
  total: z.number().default(0),
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// ====== Tipos TypeScript inferidos de Zod ======
export type DBCliente = z.infer<typeof ClienteSchema>;
export type DBProyecto = z.infer<typeof ProyectoSchema>;
export type DBTransaccion = z.infer<typeof TransaccionSchema>;
export type DBActividad = z.infer<typeof ActividadSchema>;
export type DBPresupuesto = z.infer<typeof PresupuestoSchema>;

// ====== Tipos de interfaz para la aplicación (transformados) ======
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
  estado: 'Planeación' | 'Ejecución' | 'Finalizado' | 'Evaluación' | 'Parado';
  presupuestoTotal: number;
  avanceFisico: number;
  avanceFinanciero: number;
  ingresos: number;
  gastos: number;
  pendienteAportar: number;
  fechaInicio: string;
  fechaFin: string;
}

export interface Transaccion {
  id: string;
  tipo: 'ingreso' | 'gasto';
  descripcion: string;
  cantidad: number;
  unidad: string;
  categoria: 'materiales' | 'mano-obra' | 'herramienta' | 'sub-contrato' |
             'administrativo' | 'personal' | 'transporte' | 'fijos' |
             'hogar' | 'aporte' | 'trabajos-extra';
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
  presupuestoId?: string;
}

export interface Presupuesto {
  id: string;
  user_id: string;
  proyecto: string;
  cliente?: string;
  ubicacion?: string;
  tipologia?: string;
  fase: 'planeación' | 'ejecución' | 'pausa' | 'finalizado';
  proyectoId?: string;
  factor_indirectos: number;
  factor_administrativos: number;
  factor_imprevistos: number;
  factor_utilidad: number;
  lineas: unknown[];
  avanceFisico: number;
  avanceFinanciero: number;
  ingresos: number;
  gastos: number;
  pendienteAportar: number;
  total: number;
  fechaInicio: string;
  fechaFin: string;
  created_at?: string;
  updated_at?: string;
}

// ====== Tipos de formulario (sin ID) ======

export type CreateCliente = Omit<Cliente, 'id'>;
export type CreateProyecto = Omit<Proyecto, 'id'>;
export type CreateTransaccion = Omit<Transaccion, 'id'>;
export type CreateActividad = Omit<Actividad, 'id'>;
export type CreatePresupuesto = Omit<Presupuesto, 'id'>;

export type UpdateCliente = Partial<CreateCliente>;
export type UpdateProyecto = Partial<CreateProyecto>;
export type UpdateTransaccion = Partial<CreateTransaccion>;
export type UpdateActividad = Partial<CreateActividad>;
export type UpdatePresupuesto = Partial<CreatePresupuesto>;

// Tipo de entrada para crear presupuesto desde el formulario (campos opcionales con defaults)
export interface CreatePresupuestoInput {
  proyecto: string;
  cliente?: string;
  ubicacion?: string;
  tipologia?: string;
  fase?: Presupuesto['fase'];
  factor_indirectos?: number;
  factor_administrativos?: number;
  factor_imprevistos?: number;
  factor_utilidad?: number;
  lineas?: unknown[];
  total?: number;
}

// ====== Tipos de Equipo (Mejora 14) ======
export interface Equipo {
  id: string;
  nombre: string;
  creador_id: string;
  created_at?: string;
}

export interface EquipoMiembro {
  id: string;
  equipo_id: string;
  user_id: string;
  rol: 'admin' | 'miembro' | 'visor';
  created_at?: string;
}

export type CreateEquipo = Omit<Equipo, 'id' | 'created_at'>;
export type CreateEquipoMiembro = Omit<EquipoMiembro, 'id' | 'created_at'>;

// ====== Tipos de vista y contexto ======
export type ViewType = 'login' | 'dashboard' | 'clientes' | 'presupuesto' | 'seguimiento' | 'financiero' | 'proyectos' | 'equipos';

export interface User {
  nombre: string;
  empresa: string;
  avatar: string;
}

import { Session } from '@supabase/supabase-js';

export interface AppContextType {
   view: ViewType;
   setView: (v: ViewType) => void;
   session: Session | null; // Session de Supabase
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

// ====== Tipos auxiliares ======
export type CategoriaTransaccion = 'materiales' | 'mano-obra' | 'herramienta' | 'sub-contrato' |
  'administrativo' | 'personal' | 'transporte' | 'fijos' |
  'hogar' | 'aporte' | 'trabajos-extra';

// ====== Funciones de validación ======
export const validateCliente = (data: unknown): DBCliente => {
  return ClienteSchema.parse(data);
};

export const validateProyecto = (data: unknown): DBProyecto => {
  return ProyectoSchema.parse(data);
};

export const validateTransaccion = (data: unknown): DBTransaccion => {
  return TransaccionSchema.parse(data);
};

export const validateActividad = (data: unknown): DBActividad => {
  return ActividadSchema.parse(data);
};

// ====== Funciones de transformación DB <-> App ======
export const dbToCliente = (db: DBCliente): Cliente => ({
  id: db.id || '',
  nombre: db.nombre || '',
  telefono: db.telefono || '',
  email: db.email || '',
  direccion: db.direccion || '',
  tipoProyecto: db.tipo_proyecto || 'Residencial',
  estado: db.estado || 'Potencial',
  notas: db.notas || '',
  fecha: db.fecha || '',
});

export const clienteToDb = (cliente: UpdateCliente): Partial<DBCliente> => ({
  nombre: cliente.nombre,
  telefono: cliente.telefono,
  email: cliente.email,
  direccion: cliente.direccion,
  tipo_proyecto: cliente.tipoProyecto,
  estado: cliente.estado,
  notas: cliente.notas,
  fecha: cliente.fecha || null,
});

export const dbToProyecto = (db: DBProyecto): Proyecto => ({
  id: db.id || '',
  nombre: db.nombre || '',
  cliente: db.cliente || '',
  tipo: db.tipo || '',
  estado: db.estado || 'Planeación',
  presupuestoTotal: Number(db.presupuesto_total) || 0,
  avanceFisico: Number(db.avance_fisico) || 0,
  avanceFinanciero: Number(db.avance_financiero) || 0,
  ingresos: Number(db.ingresos) || 0,
  gastos: Number(db.gastos) || 0,
  pendienteAportar: Number(db.pendiente_aportar) || 0,
  fechaInicio: db.fecha_inicio || '',
  fechaFin: db.fecha_fin || '',
});

export const proyectoToDb = (proyecto: UpdateProyecto): Partial<DBProyecto> => ({
  nombre: proyecto.nombre,
  cliente: proyecto.cliente,
  tipo: proyecto.tipo,
  estado: proyecto.estado,
  presupuesto_total: proyecto.presupuestoTotal,
  avance_fisico: proyecto.avanceFisico,
  avance_financiero: proyecto.avanceFinanciero,
  ingresos: proyecto.ingresos,
  gastos: proyecto.gastos,
  pendiente_aportar: proyecto.pendienteAportar,
  fecha_inicio: proyecto.fechaInicio || null,
  fecha_fin: proyecto.fechaFin || null,
});

export const dbToTransaccion = (db: DBTransaccion): Transaccion => ({
  id: db.id || '',
  tipo: db.tipo,
  descripcion: db.descripcion || '',
  cantidad: Number(db.cantidad) || 0,
  unidad: db.unidad || '',
  categoria: db.categoria,
  costoUnitario: Number(db.costo_unitario) || 0,
  costoTotal: Number(db.costo_total) || 0,
  fecha: db.fecha || '',
  proyectoId: db.proyecto_id || 'admin',
});

export const transaccionToDb = (transaccion: UpdateTransaccion): Partial<DBTransaccion> => ({
  tipo: transaccion.tipo,
  descripcion: transaccion.descripcion,
  cantidad: transaccion.cantidad,
  unidad: transaccion.unidad,
  categoria: transaccion.categoria,
  costo_unitario: transaccion.costoUnitario,
  costo_total: transaccion.costoTotal,
  fecha: transaccion.fecha,
  proyecto_id: transaccion.proyectoId,
});

export const dbToActividad = (db: DBActividad): Actividad => ({
  id: db.id || '',
  titulo: db.titulo,
  fecha: db.fecha,
  hora: db.hora || '',
  descripcion: db.descripcion || '',
  presupuestoId: db.presupuesto_id || '',
});

export const actividadToDb = (actividad: UpdateActividad): Partial<DBActividad> => ({
  titulo: actividad.titulo,
  fecha: actividad.fecha,
  hora: actividad.hora,
  descripcion: actividad.descripcion,
  presupuesto_id: actividad.presupuestoId || null,
});

export const validatePresupuesto = (data: unknown): DBPresupuesto => {
  return PresupuestoSchema.parse(data);
};

export const dbToPresupuesto = (db: DBPresupuesto): Presupuesto => ({
  id: db.id || '',
  user_id: db.user_id,
  proyecto: db.proyecto,
  cliente: db.cliente || '',
  ubicacion: db.ubicacion || '',
  tipologia: db.tipologia || '',
  fase: db.fase || 'planeación',
  proyectoId: db.proyecto_id || '',
  factor_indirectos: Number(db.factor_indirectos) || 0,
  factor_administrativos: Number(db.factor_administrativos) || 0,
  factor_imprevistos: Number(db.factor_imprevistos) || 0,
  factor_utilidad: Number(db.factor_utilidad) || 0,
  lineas: db.lineas || [],
  avanceFisico: Number(db.avance_fisico) || 0,
  avanceFinanciero: Number(db.avance_financiero) || 0,
  ingresos: Number(db.ingresos) || 0,
  gastos: Number(db.gastos) || 0,
  pendienteAportar: Number(db.pendiente_aportar) || 0,
  total: Number(db.total) || 0,
  fechaInicio: db.fecha_inicio || '',
  fechaFin: db.fecha_fin || '',
  created_at: db.created_at || '',
  updated_at: db.updated_at || '',
});

export const presupuestoToDb = (presupuesto: UpdatePresupuesto): Partial<DBPresupuesto> => ({
  proyecto: presupuesto.proyecto,
  cliente: presupuesto.cliente,
  ubicacion: presupuesto.ubicacion,
  tipologia: presupuesto.tipologia,
  fase: presupuesto.fase,
  proyecto_id: presupuesto.proyectoId || null,
  factor_indirectos: presupuesto.factor_indirectos,
  factor_administrativos: presupuesto.factor_administrativos,
  factor_imprevistos: presupuesto.factor_imprevistos,
  factor_utilidad: presupuesto.factor_utilidad,
  lineas: presupuesto.lineas,
  avance_fisico: presupuesto.avanceFisico,
  avance_financiero: presupuesto.avanceFinanciero,
  ingresos: presupuesto.ingresos,
  gastos: presupuesto.gastos,
  pendiente_aportar: presupuesto.pendienteAportar,
  total: presupuesto.total,
  fecha_inicio: presupuesto.fechaInicio || null,
  fecha_fin: presupuesto.fechaFin || null,
});
