// =====================================================================
// TIPOS DE SUPABASE BASADOS EN EL ESQUEMA DE BASE DE DATOS
// =====================================================================

import { z } from 'zod';

// Database type for createClient generic (Supabase schema shape)
export type Database = Record<string, unknown>;

// ====== Esquemas de validación Zod ======
const ClienteSchema = z.object({
  id: z.string().optional(),
  user_id: z.string().min(1, 'user_id requerido'),
  nombre: z.string().min(1, 'El nombre es requerido'),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  direccion: z.string().optional(),
  tipo_proyecto: z.string().default('Residencial'),
  estado: z.enum(['Potencial', 'Activo', 'Cerrado']).default('Potencial'),
  notas: z.string().optional(),
  fecha: z.string().default(new Date().toISOString().split('T')[0]),
  created_at: z.string().optional(),
});

const ProyectoSchema = z.object({
  id: z.string().optional(),
  user_id: z.string().min(1, 'user_id requerido'),
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
  fecha_inicio: z.string().optional().or(z.literal('')),
  fecha_fin: z.string().optional().or(z.literal('')),
  created_at: z.string().optional(),
});

const TransaccionSchema = z.object({
  id: z.string().optional(),
  user_id: z.string().min(1, 'user_id requerido'),
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
  user_id: z.string().min(1, 'user_id requerido'),
  titulo: z.string().min(1, 'El título es requerido'),
  fecha: z.string(),
  hora: z.string().optional(),
  descripcion: z.string().optional(),
  presupuesto_id: z.string().optional(),
  created_at: z.string().optional(),
});

const PresupuestoSchema = z.object({
  id: z.string().optional(),
  user_id: z.string().min(1, 'user_id requerido'),
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
  fecha_inicio: z.string().optional().or(z.literal('')),
  fecha_fin: z.string().optional().or(z.literal('')),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

const EquipoSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(1, 'El nombre es requerido'),
  user_id: z.string().min(1, 'user_id requerido'),
  estado: z.enum(['activo', 'inactivo']).default('activo'),
  descripcion: z.string().optional(),
  created_at: z.string().optional(),
});

const EquipoMiembroSchema = z.object({
  id: z.string().optional(),
  equipo_id: z.string().min(1, 'equipo_id requerido'),
  user_id: z.string().min(1, 'user_id requerido'),
  rol: z.enum(['admin', 'miembro', 'visor']).default('miembro'),
  created_at: z.string().optional(),
});

// ====== Tipos TypeScript inferidos de Zod ======
export type DBCliente = z.infer<typeof ClienteSchema>;
export type DBProyecto = z.infer<typeof ProyectoSchema>;
export type DBTransaccion = z.infer<typeof TransaccionSchema>;
export type DBActividad = z.infer<typeof ActividadSchema>;
export type DBPresupuesto = z.infer<typeof PresupuestoSchema>;
export type DBEquipo = z.infer<typeof EquipoSchema>;
export type DBEquipoMiembro = z.infer<typeof EquipoMiembroSchema>;

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
  costo_directo?: number;
  costo_material?: number;
  costo_mano_obra?: number;
  costo_herramienta?: number;
  factor_indirectos: number;
  factor_administrativos: number;
  factor_imprevistos: number;
  factor_utilidad: number;
  lineas: unknown[];
  avanceFisico?: number;
  avanceFinanciero?: number;
  ingresos?: number;
  gastos?: number;
  pendienteAportar?: number;
  total: number;
  fechaInicio: string;
  fechaFin: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * M6: CAMBIOS DE PRESUPUESTO (CHANGE ORDERS)
 */
export interface CambiosPresupuesto {
  id: string;
  presupuesto_id: string;
  version: number;
  cambios: Record<string, { anterior: number; nuevo: number; motivo: string }>;
  descripcion_cambios?: string;
  usuario_creador: string;
  aprobado_por?: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  impacto_presupuesto: number; // Diferencia total
  porcentaje_impacto: number; // % cambio
  created_at: string;
  approved_at?: string;
}

/**
 * M9: TRAZABILIDAD DE MATERIALES
 */
export interface ConsumoMateriales {
  id: string;
  presupuesto_id: string;
  renglon_codigo: string;
  descripcion_material?: string;
  unidad: string;
  cantidad_presupuestada: number;
  cantidad_comprada: number;
  cantidad_consumida: number;
  costo_unitario_presupuestado?: number;
  costo_total_presupuestado?: number;
  costo_total_comprado?: number;
  desperdicio_porcentaje: number; // (comprado - consumido) / presupuestado
  desperdicio_alerta: boolean; // true si desperdicio > 10%
  proveedor?: string;
  fecha_compra?: string;
  fecha_consumo?: string;
  notas?: string;
  created_at: string;
  updated_at: string;
}

export type CreateCliente = Omit<Cliente, 'id'>;
export type CreateProyecto = Omit<Proyecto, 'id'>;
export type CreateTransaccion = Omit<Transaccion, 'id'>;
export type CreateActividad = Omit<Actividad, 'id'>;
export type CreatePresupuesto = Omit<Presupuesto, 'id'>;
export type CreateEquipo = Omit<Equipo, 'id' | 'created_at'>;
export type CreateEquipoMiembro = Omit<EquipoMiembro, 'id' | 'created_at'>;

export type UpdateCliente = Partial<CreateCliente>;
export type UpdateProyecto = Partial<CreateProyecto>;
export type UpdateTransaccion = Partial<CreateTransaccion>;
export type UpdateActividad = Partial<CreateActividad>;
export type UpdatePresupuesto = Partial<CreatePresupuesto>;
export type UpdateEquipo = Partial<CreateEquipo>;
export type UpdateEquipoMiembro = Partial<CreateEquipoMiembro>;

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

export interface Equipo {
  id: string;
  nombre: string;
  userId: string;
  estado: 'activo' | 'inactivo';
  descripcion?: string;
  created_at?: string;
}

export interface EquipoMiembro {
  id: string;
  equipoId: string;
  userId: string;
  rol: 'admin' | 'miembro' | 'visor';
  created_at?: string;
}

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
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const validateCliente = (data: unknown): DBCliente => ClienteSchema.parse(data);
export const validateProyecto = (data: unknown): DBProyecto => ProyectoSchema.parse(data);
export const validateTransaccion = (data: unknown): DBTransaccion => TransaccionSchema.parse(data);
export const validateActividad = (data: unknown): DBActividad => ActividadSchema.parse(data);
export const validatePresupuesto = (data: unknown): DBPresupuesto => PresupuestoSchema.parse(data);

type DBRow = Record<string, unknown>;

// ====== Funciones de transformación DB <-> App ======
export const dbToCliente = (db: DBRow): Cliente => ({
  id: (db.id as string) || '',
  nombre: (db.nombre as string) ?? '',
  telefono: (db.telefono as string) ?? '',
  email: (db.email as string) ?? '',
  direccion: (db.direccion as string) ?? '',
  tipoProyecto: (db.tipo_proyecto as string) ?? 'Residencial',
  estado: (['Potencial', 'Activo', 'Cerrado'].includes(db.estado as string) ? db.estado : 'Potencial') as 'Potencial' | 'Activo' | 'Cerrado',
  notas: (db.notas as string) ?? '',
  fecha: (db.fecha as string) ?? new Date().toISOString().split('T')[0],
});

export const clienteToDb = (cliente: UpdateCliente): Partial<DBCliente> => {
  const out: DBRow = {};
  if (cliente.nombre !== undefined) out.nombre = cliente.nombre;
  if (cliente.telefono !== undefined) out.telefono = cliente.telefono;
  if (cliente.email !== undefined) out.email = cliente.email;
  if (cliente.direccion !== undefined) out.direccion = cliente.direccion;
  if (cliente.tipoProyecto !== undefined) out.tipo_proyecto = cliente.tipoProyecto;
  if (cliente.estado !== undefined) out.estado = cliente.estado;
  if (cliente.notas !== undefined) out.notas = cliente.notas;
  out.fecha = cliente.fecha || null;
  return out as Partial<DBCliente>;
};

export const dbToProyecto = (db: DBRow): Proyecto => ({
  id: (db.id as string) || '',
  nombre: (db.nombre as string) ?? '',
  cliente: (db.cliente as string) ?? '',
  tipo: (db.tipo as string) ?? '',
  estado: (['Planeación', 'Ejecución', 'Finalizado', 'Evaluación', 'Parado'].includes(db.estado as string) ? db.estado : 'Planeación') as 'Planeación' | 'Ejecución' | 'Finalizado' | 'Evaluación' | 'Parado',
  presupuestoTotal: typeof db.presupuesto_total === 'number' ? db.presupuesto_total : Number(db.presupuesto_total) || 0,
  avanceFisico: typeof db.avance_fisico === 'number' ? db.avance_fisico : Number(db.avance_fisico) || 0,
  avanceFinanciero: typeof db.avance_financiero === 'number' ? db.avance_financiero : Number(db.avance_financiero) || 0,
  ingresos: typeof db.ingresos === 'number' ? db.ingresos : Number(db.ingresos) || 0,
  gastos: typeof db.gastos === 'number' ? db.gastos : Number(db.gastos) || 0,
  pendienteAportar: typeof db.pendiente_aportar === 'number' ? db.pendiente_aportar : Number(db.pendiente_aportar) || 0,
  fechaInicio: (db.fecha_inicio as string) ?? '',
  fechaFin: (db.fecha_fin as string) ?? '',
});

export const proyectoToDb = (proyecto: UpdateProyecto): Partial<DBProyecto> => {
  const out: DBRow = {};
  if (proyecto.nombre !== undefined) out.nombre = proyecto.nombre;
  if (proyecto.cliente !== undefined) out.cliente = proyecto.cliente;
  if (proyecto.tipo !== undefined) out.tipo = proyecto.tipo;
  if (proyecto.estado !== undefined) out.estado = proyecto.estado;
  if (proyecto.presupuestoTotal !== undefined) out.presupuesto_total = proyecto.presupuestoTotal;
  if (proyecto.avanceFisico !== undefined) out.avance_fisico = proyecto.avanceFisico;
  if (proyecto.avanceFinanciero !== undefined) out.avance_financiero = proyecto.avanceFinanciero;
  if (proyecto.ingresos !== undefined) out.ingresos = proyecto.ingresos;
  if (proyecto.gastos !== undefined) out.gastos = proyecto.gastos;
  if (proyecto.pendienteAportar !== undefined) out.pendiente_aportar = proyecto.pendienteAportar;
  out.fecha_inicio = proyecto.fechaInicio || null;
  out.fecha_fin = proyecto.fechaFin || null;
  return out as Partial<DBProyecto>;
};

export const dbToTransaccion = (db: DBRow): Transaccion => ({
  id: (db.id as string) || '',
  tipo: (db.tipo as 'ingreso' | 'gasto') ?? 'gasto',
  descripcion: (db.descripcion as string) ?? '',
  cantidad: typeof db.cantidad === 'number' ? db.cantidad : Number(db.cantidad) || 0,
  unidad: (db.unidad as string) ?? '',
  categoria: (db.categoria as Transaccion['categoria']) ?? 'materiales',
  costoUnitario: typeof db.costo_unitario === 'number' ? db.costo_unitario : Number(db.costo_unitario) || 0,
  costoTotal: typeof db.costo_total === 'number' ? db.costo_total : Number(db.costo_total) || 0,
  fecha: (db.fecha as string) ?? new Date().toISOString().split('T')[0],
  proyectoId: (db.proyecto_id as string) ?? 'admin',
});

export const transaccionToDb = (transaccion: UpdateTransaccion): Partial<DBTransaccion> => {
  const out: DBRow = {};
  if (transaccion.tipo !== undefined) out.tipo = transaccion.tipo;
  if (transaccion.descripcion !== undefined) out.descripcion = transaccion.descripcion;
  if (transaccion.cantidad !== undefined) out.cantidad = transaccion.cantidad;
  if (transaccion.unidad !== undefined) out.unidad = transaccion.unidad;
  if (transaccion.categoria !== undefined) out.categoria = transaccion.categoria;
  if (transaccion.costoUnitario !== undefined) out.costo_unitario = transaccion.costoUnitario;
  if (transaccion.costoTotal !== undefined) out.costo_total = transaccion.costoTotal;
  if (transaccion.fecha !== undefined) out.fecha = transaccion.fecha;
  if (transaccion.proyectoId !== undefined) out.proyecto_id = transaccion.proyectoId;
  return out as Partial<DBTransaccion>;
};

export const dbToActividad = (db: DBRow): Actividad => ({
  id: (db.id as string) || '',
  titulo: (db.titulo as string) ?? '',
  fecha: (db.fecha as string) ?? new Date().toISOString().split('T')[0],
  hora: (db.hora as string) ?? '',
  descripcion: (db.descripcion as string) ?? '',
  presupuestoId: (db.presupuesto_id as string) ?? undefined,
});

export const actividadToDb = (actividad: UpdateActividad): Partial<DBActividad> => {
  const out: DBRow = {};
  if (actividad.titulo !== undefined) out.titulo = actividad.titulo;
  if (actividad.fecha !== undefined) out.fecha = actividad.fecha;
  if (actividad.hora !== undefined) out.hora = actividad.hora;
  if (actividad.descripcion !== undefined) out.descripcion = actividad.descripcion;
  out.presupuesto_id = actividad.presupuestoId || null;
  return out as Partial<DBActividad>;
};

export const dbToPresupuesto = (db: DBRow): Presupuesto => ({
  id: (db.id as string) || '',
  user_id: (db.user_id as string) ?? '',
  proyecto: (db.proyecto as string) ?? '',
  cliente: (db.cliente as string) ?? '',
  ubicacion: (db.ubicacion as string) ?? '',
  tipologia: (db.tipologia as string) ?? '',
  fase: (db.fase as 'planeación' | 'ejecución' | 'pausa' | 'finalizado') ?? 'planeación',
  proyectoId: (db.proyecto_id as string) ?? undefined,
  factor_indirectos: typeof db.factor_indirectos === 'number' ? db.factor_indirectos : Number(db.factor_indirectos) || 0,
  factor_administrativos: typeof db.factor_administrativos === 'number' ? db.factor_administrativos : Number(db.factor_administrativos) || 0,
  factor_imprevistos: typeof db.factor_imprevistos === 'number' ? db.factor_imprevistos : Number(db.factor_imprevistos) || 0,
  factor_utilidad: typeof db.factor_utilidad === 'number' ? db.factor_utilidad : Number(db.factor_utilidad) || 0,
  lineas: Array.isArray(db.lineas) ? db.lineas : [],
  avanceFisico: typeof db.avance_fisico === 'number' ? db.avance_fisico : Number(db.avance_fisico) || 0,
  avanceFinanciero: typeof db.avance_financiero === 'number' ? db.avance_financiero : Number(db.avance_financiero) || 0,
  ingresos: typeof db.ingresos === 'number' ? db.ingresos : Number(db.ingresos) || 0,
  gastos: typeof db.gastos === 'number' ? db.gastos : Number(db.gastos) || 0,
  pendienteAportar: typeof db.pendiente_aportar === 'number' ? db.pendiente_aportar : Number(db.pendiente_aportar) || 0,
  total: typeof db.total === 'number' ? db.total : Number(db.total) || 0,
  fechaInicio: (db.fecha_inicio as string) ?? '',
  fechaFin: (db.fecha_fin as string) ?? '',
  created_at: (db.created_at as string) ?? undefined,
  updated_at: (db.updated_at as string) ?? undefined,
});

export const presupuestoToDb = (presupuesto: UpdatePresupuesto): Partial<DBPresupuesto> => {
  const out: DBRow = {};
  if (presupuesto.proyecto !== undefined) out.proyecto = presupuesto.proyecto;
  if (presupuesto.cliente !== undefined) out.cliente = presupuesto.cliente;
  if (presupuesto.ubicacion !== undefined) out.ubicacion = presupuesto.ubicacion;
  if (presupuesto.tipologia !== undefined) out.tipologia = presupuesto.tipologia;
  if (presupuesto.fase !== undefined) out.fase = presupuesto.fase;
  out.proyecto_id = presupuesto.proyectoId || null;
  if (presupuesto.factor_indirectos !== undefined) out.factor_indirectos = presupuesto.factor_indirectos;
  if (presupuesto.factor_administrativos !== undefined) out.factor_administrativos = presupuesto.factor_administrativos;
  if (presupuesto.factor_imprevistos !== undefined) out.factor_imprevistos = presupuesto.factor_imprevistos;
  if (presupuesto.factor_utilidad !== undefined) out.factor_utilidad = presupuesto.factor_utilidad;
  if (presupuesto.lineas !== undefined) out.lineas = presupuesto.lineas;
  if (presupuesto.avanceFisico !== undefined) out.avance_fisico = presupuesto.avanceFisico;
  if (presupuesto.avanceFinanciero !== undefined) out.avance_financiero = presupuesto.avanceFinanciero;
  if (presupuesto.ingresos !== undefined) out.ingresos = presupuesto.ingresos;
  if (presupuesto.gastos !== undefined) out.gastos = presupuesto.gastos;
  if (presupuesto.pendienteAportar !== undefined) out.pendiente_aportar = presupuesto.pendienteAportar;
  if (presupuesto.total !== undefined) out.total = presupuesto.total;
  if (presupuesto.costo_directo !== undefined) out.costo_directo = presupuesto.costo_directo;
  out.fecha_inicio = presupuesto.fechaInicio || null;
  out.fecha_fin = presupuesto.fechaFin || null;
  return out as Partial<DBPresupuesto>;
};

// ====== Validadores para Equipos ======
export const validateEquipo = (data: unknown): DBEquipo => {
  return EquipoSchema.parse(data);
};

export const validateEquipoMiembro = (data: unknown): DBEquipoMiembro => {
  return EquipoMiembroSchema.parse(data);
};

// ====== Transformadores para Equipos ======
export const dbToEquipo = (db: DBRow): Equipo => ({
  id: (db.id as string) || '',
  nombre: (db.nombre as string) ?? '',
  userId: (db.user_id as string) ?? '',
  estado: (db.estado as 'activo' | 'inactivo') ?? 'activo',
  descripcion: (db.descripcion as string) ?? '',
  created_at: (db.created_at as string) ?? undefined,
});

export const equipoToDb = (equipo: UpdateEquipo): Partial<DBEquipo> => {
  const out: DBRow = {};
  if (equipo.nombre !== undefined) out.nombre = equipo.nombre;
  if (equipo.estado !== undefined) out.estado = equipo.estado;
  if (equipo.descripcion !== undefined) out.descripcion = equipo.descripcion;
  if (equipo.userId !== undefined) out.user_id = equipo.userId;
  return out as Partial<DBEquipo>;
};

export const dbToEquipoMiembro = (db: DBRow): EquipoMiembro => ({
  id: (db.id as string) || '',
  equipoId: (db.equipo_id as string) ?? '',
  userId: (db.user_id as string) ?? '',
  rol: (db.rol as 'admin' | 'miembro' | 'visor') ?? 'miembro',
  created_at: (db.created_at as string) ?? undefined,
});

export const equipoMiembroToDb = (miembro: UpdateEquipoMiembro): Partial<DBEquipoMiembro> => {
  const out: DBRow = {};
  if (miembro.rol !== undefined) out.rol = miembro.rol;
  if (miembro.equipoId !== undefined) out.equipo_id = miembro.equipoId;
  if (miembro.userId !== undefined) out.user_id = miembro.userId;
  return out as Partial<DBEquipoMiembro>;
};
