// =====================================================================
// TIPOS DE SUPABASE Y MODELOS DE DOMINIO DEL ERP CONSTRUSMART WM
// =====================================================================

import { z } from 'zod';
import type { Session } from '@supabase/supabase-js';

// ====== Tipos auxiliares enumerables ======
export const TRANSACCION_TIPO = ['ingreso', 'gasto'] as const;
export type TipoTransaccion = typeof TRANSACCION_TIPO[number];

export const TRANSACCION_CATEGORIA = [
  'materiales', 'mano-obra', 'herramienta', 'sub-contrato',
  'administrativo', 'personal', 'transporte', 'fijos',
  'hogar', 'aporte', 'trabajos-extra'
] as const;
export type CategoriaTransaccion = typeof TRANSACCION_CATEGORIA[number];

export const CAT_OPERATIVO = ['materiales', 'mano-obra', 'herramienta', 'sub-contrato', 'transporte'] as const;
export const CAT_ADMIN = ['administrativo', 'fijos'] as const;
export const CAT_PERSONAL = ['personal', 'hogar'] as const;

export function isOperativo(cat: unknown): cat is typeof CAT_OPERATIVO[number] {
  return typeof cat === 'string' && (CAT_OPERATIVO as readonly string[]).includes(cat);
}
export function isAdmin(cat: unknown): cat is typeof CAT_ADMIN[number] {
  return typeof cat === 'string' && (CAT_ADMIN as readonly string[]).includes(cat);
}
export function isPersonal(cat: unknown): cat is typeof CAT_PERSONAL[number] {
  return typeof cat === 'string' && (CAT_PERSONAL as readonly string[]).includes(cat);
}

// ====== Esquemas Zod y Tipos de Filas de Base de Datos (PostgreSQL snake_case) ======

export const ActividadSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  titulo: z.string(),
  fecha: z.string(),
  hora: z.string().nullable().optional(),
  descripcion: z.string().nullable().optional(),
  presupuesto_id: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
});
export type DBActividad = z.infer<typeof ActividadSchema>;

export const AuditLogSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  tabla: z.string(),
  registro_id: z.string(),
  accion: z.string(),
  valor_anterior: z.record(z.unknown()).nullable().optional(),
  valor_nuevo: z.record(z.unknown()).nullable().optional(),
  created_at: z.string().nullable().optional(),
});
export type DBAuditLog = z.infer<typeof AuditLogSchema>;

export const BitacoraAvanceSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  presupuesto_id: z.string(),
  fecha: z.string().nullable().optional(),
  avance: z.number(),
  notas: z.string().nullable().optional(),
  recursos_usados: z.record(z.unknown()).nullable().optional(),
  created_at: z.string().nullable().optional(),
});
export type DBBitacoraAvance = z.infer<typeof BitacoraAvanceSchema>;

export const CajaProyectoSchema = z.object({
  id: z.string(),
  proyecto_id: z.string(),
  user_id: z.string(),
  saldo_inicial: z.number(),
  saldo_sistema_actual: z.number().nullable().optional(),
  saldo_real_actual: z.number().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});
export type DBCajaProyecto = z.infer<typeof CajaProyectoSchema>;

export const CambioPresupuestoSchema = z.object({
  id: z.string(),
  presupuesto_id: z.string().nullable().optional(),
  version: z.number(),
  cambios: z.record(z.unknown()),
  motivo: z.string(),
  aprobado_por: z.string().nullable().optional(),
  estado: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
});
export type DBCambioPresupuesto = z.infer<typeof CambioPresupuestoSchema>;

export const ChecklistItemSchema = z.object({
  id: z.string(),
  presupuesto_id: z.string().nullable().optional(),
  fase: z.string(),
  item: z.string(),
  completado: z.boolean().nullable().optional(),
  foto_url: z.string().nullable().optional(),
  completado_por: z.string().nullable().optional(),
  completado_en: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
});
export type DBChecklistItem = z.infer<typeof ChecklistItemSchema>;

export const ClienteSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  nombre: z.string(),
  telefono: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  direccion: z.string().nullable().optional(),
  tipo_proyecto: z.string().nullable().optional(),
  estado: z.string().nullable().optional(),
  notas: z.string().nullable().optional(),
  fecha: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
});
export type DBCliente = z.infer<typeof ClienteSchema>;

export const ConciliacionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  proyecto_id: z.string().nullable().optional(),
  banco: z.string(),
  periodo: z.string(),
  saldo_libros: z.number(),
  saldo_banco: z.number(),
  diferencia: z.number().nullable().optional(),
  conciliado: z.boolean().nullable().optional(),
  notas: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});
export type DBConciliacion = z.infer<typeof ConciliacionSchema>;

export const DeviceTokenSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  token: z.string(),
  platform: z.string(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});
export type DBDeviceToken = z.infer<typeof DeviceTokenSchema>;

export const EmpleadoSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  nombre: z.string(),
  puesto: z.string(),
  telefono: z.string().nullable().optional(),
  salario_diario: z.number(),
  activo: z.boolean(),
  created_at: z.string().nullable().optional(),
});
export type DBEmpleado = z.infer<typeof EmpleadoSchema>;

export const EquipoMiembroSchema = z.object({
  id: z.string(),
  equipo_id: z.string(),
  user_id: z.string(),
  rol: z.string(),
  created_at: z.string().nullable().optional(),
});
export type DBEquipoMiembro = z.infer<typeof EquipoMiembroSchema>;

export const EquipoSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  nombre: z.string(),
  estado: z.string(),
  descripcion: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
});
export type DBEquipo = z.infer<typeof EquipoSchema>;

export const MaterialProyectoSchema = z.object({
  id: z.string(),
  presupuesto_id: z.string(),
  nombre: z.string(),
  codigo: z.string().nullable().optional(),
  unidad: z.string(),
  cantidad_estimada: z.number(),
  cantidad_utilizada: z.number(),
  costo_unitario: z.number(),
  proveedor: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
});
export type DBMaterialProyecto = z.infer<typeof MaterialProyectoSchema>;

export const MovimientoCajaSchema = z.object({
  id: z.string(),
  caja_id: z.string(),
  user_id: z.string(),
  fecha: z.string(),
  descripcion: z.string(),
  subtipo: z.string(),
  monto: z.number(),
  saldo_sistema_antes: z.number().nullable().optional(),
  saldo_sistema_despues: z.number().nullable().optional(),
  conciliado_fecha: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
});
export type DBMovimientoCaja = z.infer<typeof MovimientoCajaSchema>;

export const MovimientoMaterialSchema = z.object({
  id: z.string(),
  material_id: z.string(),
  tipo: z.string(),
  cantidad: z.number(),
  ubicacion: z.string().nullable().optional(),
  referencia: z.string().nullable().optional(),
  user_id: z.string().nullable().optional(),
  created_at: z.string(),
});
export type DBMovimientoMaterial = z.infer<typeof MovimientoMaterialSchema>;

export const NotificacionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  tipo: z.string(),
  titulo: z.string(),
  mensaje: z.string().nullable().optional(),
  leido: z.boolean().nullable().optional(),
  accion_url: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
});
export type DBNotificacion = z.infer<typeof NotificacionSchema>;

export const OcrDocumentoSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  file_url: z.string(),
  ocr_data: z.record(z.unknown()).nullable().optional(),
  status: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  proyecto_id: z.string().nullable().optional(),
  proveedor: z.string().nullable().optional(),
  monto: z.number().nullable().optional(),
  fecha_factura: z.string().nullable().optional(),
  notas: z.string().nullable().optional(),
  estado: z.string().nullable().optional(),
  revisado_por: z.string().nullable().optional(),
});
export type DBOcrDocumento = z.infer<typeof OcrDocumentoSchema>;

export const OrdenCompraItemSchema = z.object({
  id: z.string(),
  orden_compra_id: z.string(),
  descripcion: z.string(),
  cantidad: z.number(),
  unidad: z.string().nullable().optional(),
  material_id: z.string().nullable().optional(),
  precio_unitario: z.number().nullable().optional(),
  importe: z.number().nullable().optional(),
  cantidad_recibida: z.number().nullable().optional(),
  created_at: z.string().nullable().optional(),
});
export type DBOrdenCompraItem = z.infer<typeof OrdenCompraItemSchema>;

export const OrdenCompraSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  folio: z.string(),
  proveedor_id: z.string().nullable().optional(),
  proyecto_id: z.string().nullable().optional(),
  fecha_emision: z.string().nullable().optional(),
  fecha_entrega: z.string().nullable().optional(),
  estatus: z.string().nullable().optional(),
  subtotal: z.number().nullable().optional(),
  iva: z.number().nullable().optional(),
  total: z.number().nullable().optional(),
  notas: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});
export type DBOrdenCompra = z.infer<typeof OrdenCompraSchema>;

export const PartidaConciliacionSchema = z.object({
  id: z.string(),
  conciliacion_id: z.string().nullable().optional(),
  tipo: z.string(),
  monto: z.number(),
  descripcion: z.string().nullable().optional(),
  fecha: z.string().nullable().optional(),
  aplicado: z.boolean().nullable().optional(),
  created_at: z.string().nullable().optional(),
});
export type DBPartidaConciliacion = z.infer<typeof PartidaConciliacionSchema>;

export const PresupuestoSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  proyecto: z.string(),
  cliente: z.string().nullable().optional(),
  ubicacion: z.string().nullable().optional(),
  tipologia: z.string().nullable().optional(),
  fase: z.string().nullable().optional(),
  proyecto_id: z.string().nullable().optional(),
  factor_indirectos: z.number().nullable().optional(),
  factor_administrativos: z.number().nullable().optional(),
  factor_imprevistos: z.number().nullable().optional(),
  factor_utilidad: z.number().nullable().optional(),
  lineas: z.any().nullable().optional(),
  avance_fisico: z.number().nullable().optional(),
  avance_financiero: z.number().nullable().optional(),
  ingresos: z.number().nullable().optional(),
  gastos: z.number().nullable().optional(),
  pendiente_aportar: z.number().nullable().optional(),
  total: z.number().nullable().optional(),
  costo_directo: z.number().nullable().optional(),
  fecha_inicio: z.string().nullable().optional(),
  fecha_fin: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  proyecto_id_uuid: z.string().nullable().optional(),
});
export type DBPresupuesto = z.infer<typeof PresupuestoSchema>;

export const ProveedorSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  nombre: z.string(),
  contacto: z.string().nullable().optional(),
  telefono: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  direccion: z.string().nullable().optional(),
  rfc: z.string().nullable().optional(),
  notas: z.string().nullable().optional(),
  activo: z.boolean().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});
export type DBProveedor = z.infer<typeof ProveedorSchema>;

export const ProyectoSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  nombre: z.string(),
  cliente: z.string().nullable().optional(),
  tipo: z.string().nullable().optional(),
  estado: z.string().nullable().optional(),
  presupuesto_total: z.number().nullable().optional(),
  avance_fisico: z.number().nullable().optional(),
  avance_financiero: z.number().nullable().optional(),
  ingresos: z.number().nullable().optional(),
  gastos: z.number().nullable().optional(),
  pendiente_aportar: z.number().nullable().optional(),
  fecha_inicio: z.string().nullable().optional(),
  fecha_fin: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  fase: z.string().nullable().optional(),
  total: z.number().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});
export type DBProyecto = z.infer<typeof ProyectoSchema>;

export const RecepcionOCSchema = z.object({
  id: z.string(),
  orden_compra_id: z.string(),
  user_id: z.string(),
  fecha_recepcion: z.string().nullable().optional(),
  observaciones: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
});
export type DBRecepcionOC = z.infer<typeof RecepcionOCSchema>;

export const RecepcionOCItemSchema = z.object({
  id: z.string(),
  recepcion_id: z.string(),
  orden_compra_item_id: z.string(),
  cantidad_recibida: z.number(),
  created_at: z.string().nullable().optional(),
});
export type DBRecepcionOCItem = z.infer<typeof RecepcionOCItemSchema>;

export const RenglonPrecioHistorialSchema = z.object({
  id: z.string(),
  renglon_id: z.string().nullable().optional(),
  fecha: z.string().nullable().optional(),
  costo: z.number(),
  variacion: z.number().nullable().optional(),
});
export type DBRenglonPrecioHistorial = z.infer<typeof RenglonPrecioHistorialSchema>;

export const RenglonUsageSchema = z.object({
  id: z.string(),
  renglon_id: z.string().nullable().optional(),
  presupuesto_id: z.string().nullable().optional(),
  user_id: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
});
export type DBRenglonUsage = z.infer<typeof RenglonUsageSchema>;

export const RenglonSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  codigo: z.string(),
  descripcion: z.string(),
  tipo_renglon: z.string().nullable().optional(),
  unidad: z.string().nullable().optional(),
  rendimiento: z.number().nullable().optional(),
  costo_material: z.number().nullable().optional(),
  costo_mano_obra: z.number().nullable().optional(),
  costo_herramienta: z.number().nullable().optional(),
  subrenglones: z.any().nullable().optional(),
  materiales: z.any().nullable().optional(),
  mano_obra: z.any().nullable().optional(),
  equipos: z.any().nullable().optional(),
  categoria: z.string().nullable().optional(),
  etiquetas: z.any().nullable().optional(),
  tipologia: z.string().nullable().optional(),
  estimacion_tiempo: z.number().nullable().optional(),
  dificultad: z.string().nullable().optional(),
  equipo_requerido: z.any().nullable().optional(),
  notas: z.string().nullable().optional(),
  favorito: z.boolean().nullable().optional(),
  frecuencia_uso: z.number().nullable().optional(),
  ultimo_uso: z.string().nullable().optional(),
  activo: z.boolean().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});
export type DBRenglon = z.infer<typeof RenglonSchema>;

export const SubrenglonEquipoSchema = z.object({
  id: z.string(),
  subrenglon_id: z.string(),
  descripcion: z.string(),
  cantidad: z.number().nullable().optional(),
  costo_hora: z.number().nullable().optional(),
  horas_uso: z.number().nullable().optional(),
  subtotal: z.number().nullable().optional(),
  created_at: z.string().nullable().optional(),
});
export type DBSubrenglonEquipo = z.infer<typeof SubrenglonEquipoSchema>;

export const SubrenglonManoObraSchema = z.object({
  id: z.string(),
  subrenglon_id: z.string(),
  descripcion: z.string(),
  cantidad_personas: z.number().nullable().optional(),
  jornal: z.number().nullable().optional(),
  rendimiento_especifico: z.number().nullable().optional(),
  costo_unidad: z.number().nullable().optional(),
  created_at: z.string().nullable().optional(),
});
export type DBSubrenglonManoObra = z.infer<typeof SubrenglonManoObraSchema>;

export const SubrenglonMaterialSchema = z.object({
  id: z.string(),
  subrenglon_id: z.string(),
  material_id: z.string().nullable().optional(),
  nombre: z.string(),
  unidad: z.string().nullable().optional(),
  cantidad: z.number().nullable().optional(),
  costo_unitario: z.number().nullable().optional(),
  desperdicio: z.number().nullable().optional(),
  subtotal: z.number().nullable().optional(),
  created_at: z.string().nullable().optional(),
});
export type DBSubrenglonMaterial = z.infer<typeof SubrenglonMaterialSchema>;

export const SubrenglonSchema = z.object({
  id: z.string(),
  presupuesto_id: z.string(),
  renglon_id: z.string().nullable().optional(),
  codigo: z.string().nullable().optional(),
  descripcion: z.string(),
  unidad: z.string().nullable().optional(),
  cantidad: z.number().nullable().optional(),
  rendimiento: z.number().nullable().optional(),
  costo_material_total: z.number().nullable().optional(),
  costo_mano_obra_total: z.number().nullable().optional(),
  costo_equipos_total: z.number().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});
export type DBSubrenglon = z.infer<typeof SubrenglonSchema>;

export const TransaccionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  tipo: z.string(),
  descripcion: z.string().nullable().optional(),
  cantidad: z.number().nullable().optional(),
  unidad: z.string().nullable().optional(),
  categoria: z.string().nullable().optional(),
  costo_unitario: z.number().nullable().optional(),
  costo_total: z.number().nullable().optional(),
  fecha: z.string().nullable().optional(),
  proyecto_id: z.string().nullable().optional(),
  empleado_id: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  presupuesto_id_uuid: z.string().nullable().optional(),
  proyecto_id_uuid: z.string().nullable().optional(),
  empleado_id_uuid: z.string().nullable().optional(),
});
export type DBTransaccion = z.infer<typeof TransaccionSchema>;

export const TransaccionRecurrenteSchema = z.object({
  id: z.string(),
  presupuesto_id: z.string(),
  user_id: z.string(),
  descripcion: z.string(),
  tipo: z.string(),
  monto: z.number(),
  frecuencia: z.string(),
  activa: z.boolean().nullable().optional(),
  proxima_fecha: z.string().nullable().optional(),
  ultima_fecha: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});
export type DBTransaccionRecurrente = z.infer<typeof TransaccionRecurrenteSchema>;

// ====== MAPA DE TABLAS DATABASE ======

export interface DatabaseTables {
  actividades: DBActividad;
  audit_log: DBAuditLog;
  bitacora_avance: DBBitacoraAvance;
  caja_proyecto: DBCajaProyecto;
  cambios_presupuesto: DBCambioPresupuesto;
  checklist_items: DBChecklistItem;
  clientes: DBCliente;
  conciliaciones: DBConciliacion;
  device_tokens: DBDeviceToken;
  empleados: DBEmpleado;
  equipo_miembros: DBEquipoMiembro;
  equipos: DBEquipo;
  materiales_proyecto: DBMaterialProyecto;
  movimientos_caja: DBMovimientoCaja;
  movimientos_materiales: DBMovimientoMaterial;
  notificaciones: DBNotificacion;
  ocr_documentos: DBOcrDocumento;
  orden_compra_items: DBOrdenCompraItem;
  ordenes_compra: DBOrdenCompra;
  partidas_conciliacion: DBPartidaConciliacion;
  presupuestos: DBPresupuesto;
  proveedores: DBProveedor;
  proyectos: DBProyecto;
  recepcion_oc: DBRecepcionOC;
  recepcion_oc_items: DBRecepcionOCItem;
  renglon_precios_historial: DBRenglonPrecioHistorial;
  renglon_usage: DBRenglonUsage;
  renglones: DBRenglon;
  subrenglon_equipos: DBSubrenglonEquipo;
  subrenglon_mano_obra: DBSubrenglonManoObra;
  subrenglon_materiales: DBSubrenglonMaterial;
  subrenglones: DBSubrenglon;
  transacciones: DBTransaccion;
  transacciones_recurrentes: DBTransaccionRecurrente;
}

export type TableName = keyof DatabaseTables;

export interface Database {
  public: {
    Tables: {
      [K in TableName]: {
        Row: DatabaseTables[K];
        Insert: Partial<DatabaseTables[K]>;
        Update: Partial<DatabaseTables[K]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
  // Compatibilidad hacia atrás directa
  actividades: DBActividad;
  audit_log: DBAuditLog;
  bitacora_avance: DBBitacoraAvance;
  caja_proyecto: DBCajaProyecto;
  cambios_presupuesto: DBCambioPresupuesto;
  checklist_items: DBChecklistItem;
  clientes: DBCliente;
  conciliaciones: DBConciliacion;
  device_tokens: DBDeviceToken;
  empleados: DBEmpleado;
  equipo_miembros: DBEquipoMiembro;
  equipos: DBEquipo;
  materiales_proyecto: DBMaterialProyecto;
  movimientos_caja: DBMovimientoCaja;
  movimientos_materiales: DBMovimientoMaterial;
  notificaciones: DBNotificacion;
  ocr_documentos: DBOcrDocumento;
  orden_compra_items: DBOrdenCompraItem;
  ordenes_compra: DBOrdenCompra;
  partidas_conciliacion: DBPartidaConciliacion;
  presupuestos: DBPresupuesto;
  proveedores: DBProveedor;
  proyectos: DBProyecto;
  recepcion_oc: DBRecepcionOC;
  recepcion_oc_items: DBRecepcionOCItem;
  renglon_precios_historial: DBRenglonPrecioHistorial;
  renglon_usage: DBRenglonUsage;
  renglones: DBRenglon;
  subrenglon_equipos: DBSubrenglonEquipo;
  subrenglon_mano_obra: DBSubrenglonManoObra;
  subrenglon_materiales: DBSubrenglonMaterial;
  subrenglones: DBSubrenglon;
  transacciones: DBTransaccion;
  transacciones_recurrentes: DBTransaccionRecurrente;
}

// ====== VIEW TYPES & APP TYPES ======

export type ViewType = 
  | 'login' | 'dashboard' | 'clientes' | 'presupuesto' | 'seguimiento' 
  | 'financiero' | 'proyectos' | 'bodega' | 'cotizacion' | 'compras' 
  | 'empleados' | 'aprobaciones'
  | 'conciliacion' | 'trazabilidad' | 'calidad' | 'apu_predictor' | 'reportes'
  | 'caja_chica' | 'transacciones_recurrentes' | 'ocr_documentos';

export interface User {
  nombre: string;
  empresa: string;
  avatar: string;
}

export type TipoNotificacion = 'info' | 'alerta' | 'exito' | 'warning';

export interface AppNotification {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: TipoNotificacion;
  leido: boolean;
  created_at: string;
  accion_url?: string;
}

// ====== MODELOS DE DOMINIO DEL ERP (CAMELCASE COMPLETO) ======

export interface Cliente {
  id: string;
  userId?: string;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  tipoProyecto: string;
  estado: string;
  notas?: string;
  fecha: string;
  createdAt?: string;
}
export type CreateCliente = Omit<Cliente, 'id' | 'createdAt'>;
export type UpdateCliente = Partial<CreateCliente>;

export interface Proveedor {
  id: string;
  userId?: string;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  rfc?: string;
  notas?: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}
export type CreateProveedor = Omit<Proveedor, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProveedor = Partial<CreateProveedor>;

export interface Proyecto {
  id: string;
  userId?: string;
  nombre: string;
  cliente?: string;
  tipo?: string;
  estado: string;
  presupuestoTotal: number;
  avanceFisico: number;
  avanceFinanciero: number;
  ingresos: number;
  gastos: number;
  pendienteAportar: number;
  fechaInicio?: string;
  fechaFin?: string;
  fase?: string;
  total?: number;
  createdAt?: string;
  updatedAt?: string;
}
export type CreateProyecto = Omit<Proyecto, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProyecto = Partial<CreateProyecto>;

export interface Transaccion {
  id: string;
  userId?: string;
  tipo: 'ingreso' | 'gasto';
  categoria: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  costoUnitario: number;
  costoTotal: number;
  fecha: string;
  proyectoId: string;
  empleadoId?: string;
  createdAt?: string;
}
export type CreateTransaccion = Omit<Transaccion, 'id' | 'createdAt'>;
export type UpdateTransaccion = Partial<CreateTransaccion>;

export interface Presupuesto {
  id: string;
  userId?: string;
  user_id?: string;
  proyecto: string;
  cliente?: string;
  ubicacion?: string;
  tipologia?: string;
  fase: 'planeación' | 'ejecución' | 'pausa' | 'finalizado' | string;
  proyectoId?: string;
  factor_indirectos?: number;
  factor_administrativos?: number;
  factor_imprevistos?: number;
  factor_utilidad?: number;
  lineas: any[];
  avanceFisico: number;
  avanceFinanciero: number;
  ingresos: number;
  gastos: number;
  pendienteAportar: number;
  total: number;
  costo_directo?: number;
  costoDirecto?: number;
  fechaInicio?: string;
  fechaFin?: string;
  areaConstruccion?: number;
  nivelCalidad?: string;
  createdAt?: string;
  updatedAt?: string;
}
export type CreatePresupuesto = Omit<Presupuesto, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePresupuesto = Partial<CreatePresupuesto>;

export interface CreatePresupuestoInput {
  proyecto?: string;
  cliente?: string;
  ubicacion?: string;
  tipologia?: string;
  fase?: string;
  proyectoId?: string;
  factor_indirectos?: number;
  factor_administrativos?: number;
  factor_imprevistos?: number;
  factor_utilidad?: number;
  lineas?: unknown[];
  total?: number;
  costo_directo?: number;
  fechaInicio?: string;
  fechaFin?: string;
  areaConstruccion?: number;
  nivelCalidad?: string;
}

export interface Equipo {
  id: string;
  nombre: string;
  userId?: string;
  estado: 'activo' | 'inactivo' | string;
  descripcion?: string;
  createdAt?: string;
}
export type CreateEquipo = Omit<Equipo, 'id' | 'createdAt'>;
export type UpdateEquipo = Partial<CreateEquipo>;

export interface EquipoMiembro {
  id: string;
  equipoId: string;
  userId: string;
  rol: 'admin' | 'miembro' | 'visor' | string;
  createdAt?: string;
}
export type CreateEquipoMiembro = Omit<EquipoMiembro, 'id' | 'createdAt'>;
export type UpdateEquipoMiembro = Partial<CreateEquipoMiembro>;

export interface Empleado {
  id: string;
  userId?: string;
  nombre: string;
  puesto: string;
  telefono?: string;
  salario_diario: number;
  activo: boolean;
  createdAt?: string;
}
export type CreateEmpleado = Omit<Empleado, 'id' | 'createdAt'>;
export type UpdateEmpleado = Partial<CreateEmpleado>;

export interface OrdenCompra {
  id: string;
  userId?: string;
  folio: string;
  proveedorId?: string;
  proyectoId?: string;
  fechaEmision: string;
  fechaEntrega?: string;
  estatus: 'pendiente' | 'aprobada' | 'recibida_parcial' | 'recibida' | 'cancelada' | string;
  subtotal: number;
  iva: number;
  total: number;
  notas?: string;
  createdAt?: string;
  updatedAt?: string;
}
export type CreateOrdenCompra = Omit<OrdenCompra, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateOrdenCompra = Partial<CreateOrdenCompra>;

export interface OrdenCompraItem {
  id: string;
  ordenCompraId: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  materialId?: string;
  precioUnitario: number;
  importe: number;
  cantidadRecibida: number;
  createdAt?: string;
}
export type CreateOrdenCompraItem = Omit<OrdenCompraItem, 'id' | 'createdAt'>;
export type UpdateOrdenCompraItem = Partial<CreateOrdenCompraItem>;

export interface RecepcionOC {
  id: string;
  ordenCompraId: string;
  userId: string;
  fechaRecepcion: string;
  observaciones?: string;
  createdAt?: string;
}
export type CreateRecepcionOC = Omit<RecepcionOC, 'id' | 'createdAt'>;
export type UpdateRecepcionOC = Partial<CreateRecepcionOC>;

export interface RecepcionOCItem {
  id: string;
  recepcionId: string;
  ordenCompraItemId: string;
  cantidadRecibida: number;
  createdAt?: string;
}
export type CreateRecepcionOCItem = Omit<RecepcionOCItem, 'id' | 'createdAt'>;
export type UpdateRecepcionOCItem = Partial<CreateRecepcionOCItem>;

export interface Material {
  id: string;
  presupuestoId: string;
  presupuesto_id?: string;
  nombre: string;
  codigo?: string | null;
  unidad: string;
  cantidadEstimada: number;
  cantidad_estimada?: number;
  cantidadUtilizada: number;
  cantidad_utilizada?: number;
  costoUnitario: number;
  costo_unitario?: number;
  proveedor?: string | null;
  createdAt?: string;
}
export type CreateMaterial = Omit<Material, 'id' | 'createdAt'>;
export type UpdateMaterial = Partial<CreateMaterial>;

export interface MovimientoMaterial {
  id: string;
  materialId: string;
  material_id?: string;
  tipo: 'entrada' | 'salida' | 'devolucion';
  cantidad: number;
  ubicacion?: string;
  referencia?: string;
  userId?: string;
  user_id?: string;
  createdAt: string;
  created_at?: string;
}

export interface Actividad {
  id: string;
  userId?: string;
  titulo: string;
  fecha: string;
  hora?: string;
  descripcion?: string;
  presupuestoId?: string;
  createdAt?: string;
}
export type CreateActividad = Omit<Actividad, 'id' | 'createdAt'>;
export type UpdateActividad = Partial<CreateActividad>;

export interface ChecklistItem {
  id: string;
  presupuestoId?: string;
  fase: string;
  item: string;
  completado: boolean;
  fotoUrl?: string;
  completadoPor?: string;
  completadoEn?: string;
  createdAt?: string;
}
export type CreateChecklistItem = Omit<ChecklistItem, 'id' | 'createdAt'>;
export type UpdateChecklistItem = Partial<CreateChecklistItem>;

export interface CambiosPresupuesto {
  id: string;
  presupuestoId?: string;
  version: number;
  cambios: Record<string, unknown>;
  motivo: string;
  aprobadoPor?: string;
  estado?: string;
  createdAt?: string;
}

export interface BitacoraAvance {
  id: string;
  presupuestoId: string;
  userId: string;
  avance: number;
  notas?: string;
  fecha: string;
  createdAt?: string;
}

// ====== MAPPERS BIDIRECCIONALES ROBUSTOS (DB <-> DOMAIN) ======

export const dbToCliente = (db: any): Cliente => ({
  id: String(db?.id ?? ''),
  userId: db?.user_id ?? db?.userId,
  nombre: db?.nombre ?? '',
  telefono: db?.telefono ?? '',
  email: db?.email ?? '',
  direccion: db?.direccion ?? '',
  tipoProyecto: db?.tipo_proyecto ?? db?.tipoProyecto ?? 'Residencial',
  estado: db?.estado ?? 'Potencial',
  notas: db?.notas ?? '',
  fecha: db?.fecha ?? new Date().toISOString().split('T')[0],
  createdAt: db?.created_at ?? db?.createdAt,
});

export const clienteToDb = (c: Partial<Cliente> | any): Partial<DBCliente> => {
  const out: Partial<DBCliente> = {};
  if (c.nombre !== undefined) out.nombre = c.nombre;
  if (c.telefono !== undefined) out.telefono = c.telefono;
  if (c.email !== undefined) out.email = c.email;
  if (c.direccion !== undefined) out.direccion = c.direccion;
  if (c.tipoProyecto !== undefined || c.tipo_proyecto !== undefined) {
    out.tipo_proyecto = c.tipoProyecto ?? c.tipo_proyecto;
  }
  if (c.estado !== undefined) out.estado = c.estado;
  if (c.notas !== undefined) out.notas = c.notas;
  if (c.fecha !== undefined) out.fecha = c.fecha;
  if (c.userId !== undefined || c.user_id !== undefined) {
    out.user_id = c.userId ?? c.user_id;
  }
  return out;
};

export const dbToProveedor = (db: any): Proveedor => ({
  id: String(db?.id ?? ''),
  userId: db?.user_id ?? db?.userId,
  nombre: db?.nombre ?? '',
  contacto: db?.contacto ?? undefined,
  telefono: db?.telefono ?? undefined,
  email: db?.email ?? undefined,
  direccion: db?.direccion ?? undefined,
  rfc: db?.rfc ?? undefined,
  notas: db?.notas ?? undefined,
  activo: db?.activo !== undefined ? Boolean(db.activo) : undefined as unknown as boolean,
  createdAt: db?.created_at ?? db?.createdAt,
  updatedAt: db?.updated_at ?? db?.updatedAt,
});

export const proveedorToDb = (p: Partial<Proveedor> | any): Partial<DBProveedor> => {
  const out: Partial<DBProveedor> = {};
  if (p.nombre !== undefined) out.nombre = p.nombre;
  if (p.contacto !== undefined) out.contacto = p.contacto;
  if (p.telefono !== undefined) out.telefono = p.telefono;
  if (p.email !== undefined) out.email = p.email;
  if (p.direccion !== undefined) out.direccion = p.direccion;
  if (p.rfc !== undefined) out.rfc = p.rfc;
  if (p.notas !== undefined) out.notas = p.notas;
  if (p.activo !== undefined) out.activo = p.activo;
  if (p.userId !== undefined || p.user_id !== undefined) {
    out.user_id = p.userId ?? p.user_id;
  }
  return out;
};

export const dbToProyecto = (db: any): Proyecto => ({
  id: String(db?.id ?? ''),
  userId: db?.user_id ?? db?.userId,
  nombre: db?.nombre ?? '',
  cliente: db?.cliente ?? '',
  tipo: db?.tipo ?? 'residencial',
  estado: db?.estado ?? 'Planeación',
  presupuestoTotal: typeof db?.presupuesto_total === 'number' ? db.presupuesto_total : (typeof db?.presupuestoTotal === 'number' ? db.presupuestoTotal : Number(db?.presupuesto_total ?? db?.presupuestoTotal) || 0),
  avanceFisico: typeof db?.avance_fisico === 'number' ? db.avance_fisico : (typeof db?.avanceFisico === 'number' ? db.avanceFisico : Number(db?.avance_fisico ?? db?.avanceFisico) || 0),
  avanceFinanciero: typeof db?.avance_financiero === 'number' ? db.avance_financiero : (typeof db?.avanceFinanciero === 'number' ? db.avanceFinanciero : Number(db?.avance_financiero ?? db?.avanceFinanciero) || 0),
  ingresos: typeof db?.ingresos === 'number' ? db.ingresos : Number(db?.ingresos) || 0,
  gastos: typeof db?.gastos === 'number' ? db.gastos : Number(db?.gastos) || 0,
  pendienteAportar: typeof db?.pendiente_aportar === 'number' ? db.pendiente_aportar : (typeof db?.pendienteAportar === 'number' ? db.pendienteAportar : Number(db?.pendiente_aportar ?? db?.pendienteAportar) || 0),
  fechaInicio: db?.fecha_inicio ?? db?.fechaInicio ?? '',
  fechaFin: db?.fecha_fin ?? db?.fechaFin ?? '',
  fase: db?.fase ?? 'planeación',
  total: typeof db?.total === 'number' ? db.total : Number(db?.total) || 0,
  createdAt: db?.created_at ?? db?.createdAt,
  updatedAt: db?.updated_at ?? db?.updatedAt,
});

export const proyectoToDb = (p: Partial<Proyecto> | any): Partial<DBProyecto> => {
  const out: Partial<DBProyecto> = {};
  if (p.nombre !== undefined) out.nombre = p.nombre;
  if (p.cliente !== undefined) out.cliente = p.cliente;
  if (p.tipo !== undefined) out.tipo = p.tipo;
  if (p.estado !== undefined) out.estado = p.estado;
  if (p.presupuestoTotal !== undefined || p.presupuesto_total !== undefined) {
    out.presupuesto_total = p.presupuestoTotal ?? p.presupuesto_total;
  }
  if (p.avanceFisico !== undefined || p.avance_fisico !== undefined) {
    out.avance_fisico = p.avanceFisico ?? p.avance_fisico;
  }
  if (p.avanceFinanciero !== undefined || p.avance_financiero !== undefined) {
    out.avance_financiero = p.avanceFinanciero ?? p.avance_financiero;
  }
  if (p.ingresos !== undefined) out.ingresos = p.ingresos;
  if (p.gastos !== undefined) out.gastos = p.gastos;
  if (p.pendienteAportar !== undefined || p.pendiente_aportar !== undefined) {
    out.pendiente_aportar = p.pendienteAportar ?? p.pendiente_aportar;
  }
  if (p.fechaInicio !== undefined || p.fecha_inicio !== undefined) {
    out.fecha_inicio = p.fechaInicio ?? p.fecha_inicio;
  }
  if (p.fechaFin !== undefined || p.fecha_fin !== undefined) {
    out.fecha_fin = p.fechaFin ?? p.fecha_fin;
  }
  if (p.fase !== undefined) out.fase = p.fase;
  if (p.total !== undefined) out.total = p.total;
  if (p.userId !== undefined || p.user_id !== undefined) {
    out.user_id = p.userId ?? p.user_id;
  }
  return out;
};

export const dbToTransaccion = (db: any): Transaccion => ({
  id: String(db?.id ?? ''),
  userId: db?.user_id ?? db?.userId,
  tipo: db?.tipo === 'ingreso' ? 'ingreso' : 'gasto',
  categoria: db?.categoria ?? 'materiales',
  descripcion: db?.descripcion ?? '',
  cantidad: typeof db?.cantidad === 'number' ? db.cantidad : Number(db?.cantidad) || 1,
  unidad: db?.unidad ?? 'u',
  costoUnitario: typeof db?.costo_unitario === 'number' ? db.costo_unitario : (typeof db?.costoUnitario === 'number' ? db.costoUnitario : Number(db?.costo_unitario ?? db?.costoUnitario) || 0),
  costoTotal: typeof db?.costo_total === 'number' ? db.costo_total : (typeof db?.costoTotal === 'number' ? db.costoTotal : Number(db?.costo_total ?? db?.costoTotal) || 0),
  fecha: db?.fecha ?? new Date().toISOString().split('T')[0],
  proyectoId: db?.proyecto_id ?? db?.proyectoId ?? 'admin',
  empleadoId: db?.empleado_id ?? db?.empleadoId,
  createdAt: db?.created_at ?? db?.createdAt,
});

export const transaccionToDb = (t: Partial<Transaccion> | any): Partial<DBTransaccion> => {
  const out: Partial<DBTransaccion> = {};
  if (t.tipo !== undefined) out.tipo = t.tipo;
  if (t.descripcion !== undefined) out.descripcion = t.descripcion;
  if (t.cantidad !== undefined) out.cantidad = t.cantidad;
  if (t.unidad !== undefined) out.unidad = t.unidad;
  if (t.categoria !== undefined) out.categoria = t.categoria;
  if (t.costoUnitario !== undefined || t.costo_unitario !== undefined) {
    out.costo_unitario = t.costoUnitario ?? t.costo_unitario;
  }
  if (t.costoTotal !== undefined || t.costo_total !== undefined) {
    out.costo_total = t.costoTotal ?? t.costo_total;
  }
  if (t.fecha !== undefined) out.fecha = t.fecha;
  if (t.proyectoId !== undefined || t.proyecto_id !== undefined) {
    out.proyecto_id = t.proyectoId ?? t.proyecto_id;
  }
  if (t.empleadoId !== undefined || t.empleado_id !== undefined) {
    out.empleado_id = t.empleadoId ?? t.empleado_id;
  }
  if (t.userId !== undefined || t.user_id !== undefined) {
    out.user_id = t.userId ?? t.user_id;
  }
  return out;
};

export const dbToPresupuesto = (db: any): Presupuesto => {
  const rawLineas = db?.lineas;
  const lineas = Array.isArray(rawLineas) ? rawLineas : (rawLineas && typeof rawLineas === 'object' ? Object.values(rawLineas) : []);
  return {
    id: String(db?.id ?? ''),
    userId: db?.user_id ?? db?.userId,
    user_id: db?.user_id ?? db?.userId,
    proyecto: db?.proyecto ?? '',
    cliente: db?.cliente ?? '',
    ubicacion: db?.ubicacion ?? '',
    tipologia: db?.tipologia ?? 'residencial',
    fase: db?.fase ?? 'planeación',
    proyectoId: db?.proyecto_id ?? db?.proyectoId ?? '',
    factor_indirectos: typeof db?.factor_indirectos === 'number' ? db.factor_indirectos : Number(db?.factor_indirectos) || 0,
    factor_administrativos: typeof db?.factor_administrativos === 'number' ? db.factor_administrativos : Number(db?.factor_administrativos) || 0,
    factor_imprevistos: typeof db?.factor_imprevistos === 'number' ? db.factor_imprevistos : Number(db?.factor_imprevistos) || 0,
    factor_utilidad: typeof db?.factor_utilidad === 'number' ? db.factor_utilidad : Number(db?.factor_utilidad) || 0,
    lineas,
    avanceFisico: typeof db?.avance_fisico === 'number' ? db.avance_fisico : (typeof db?.avanceFisico === 'number' ? db.avanceFisico : Number(db?.avance_fisico ?? db?.avanceFisico) || 0),
    avanceFinanciero: typeof db?.avance_financiero === 'number' ? db.avance_financiero : (typeof db?.avanceFinanciero === 'number' ? db.avanceFinanciero : Number(db?.avance_financiero ?? db?.avanceFinanciero) || 0),
    ingresos: typeof db?.ingresos === 'number' ? db.ingresos : Number(db?.ingresos) || 0,
    gastos: typeof db?.gastos === 'number' ? db.gastos : Number(db?.gastos) || 0,
    pendienteAportar: typeof db?.pendiente_aportar === 'number' ? db.pendiente_aportar : (typeof db?.pendienteAportar === 'number' ? db.pendienteAportar : Number(db?.pendiente_aportar ?? db?.pendienteAportar) || 0),
    total: typeof db?.total === 'number' ? db.total : Number(db?.total) || 0,
    costo_directo: typeof db?.costo_directo === 'number' ? db.costo_directo : Number(db?.costo_directo) || 0,
    costoDirecto: typeof db?.costo_directo === 'number' ? db.costo_directo : Number(db?.costo_directo) || 0,
    fechaInicio: db?.fecha_inicio ?? db?.fechaInicio ?? '',
    fechaFin: db?.fecha_fin ?? db?.fechaFin ?? '',
    areaConstruccion: typeof db?.area_construccion === 'number' ? db.area_construccion : (typeof db?.areaConstruccion === 'number' ? db.areaConstruccion : Number(db?.area_construccion ?? db?.areaConstruccion) || 0),
    nivelCalidad: db?.nivel_calidad ?? db?.nivelCalidad ?? 'basico',
    createdAt: db?.created_at ?? db?.createdAt,
    updatedAt: db?.updated_at ?? db?.updatedAt,
  };
};

export const presupuestoToDb = (p: Partial<Presupuesto> | any): Partial<DBPresupuesto> => {
  const out: Partial<DBPresupuesto> = {};
  if (p.proyecto !== undefined) out.proyecto = p.proyecto;
  if (p.cliente !== undefined) out.cliente = p.cliente;
  if (p.ubicacion !== undefined) out.ubicacion = p.ubicacion;
  if (p.tipologia !== undefined) out.tipologia = p.tipologia;
  if (p.fase !== undefined) out.fase = p.fase;
  if (p.proyectoId !== undefined || p.proyecto_id !== undefined) {
    out.proyecto_id = p.proyectoId ?? p.proyecto_id;
  }
  if (p.factor_indirectos !== undefined) out.factor_indirectos = p.factor_indirectos;
  if (p.factor_administrativos !== undefined) out.factor_administrativos = p.factor_administrativos;
  if (p.factor_imprevistos !== undefined) out.factor_imprevistos = p.factor_imprevistos;
  if (p.factor_utilidad !== undefined) out.factor_utilidad = p.factor_utilidad;
  if (p.lineas !== undefined) out.lineas = p.lineas;
  if (p.avanceFisico !== undefined || p.avance_fisico !== undefined) {
    out.avance_fisico = p.avanceFisico ?? p.avance_fisico;
  }
  if (p.avanceFinanciero !== undefined || p.avance_financiero !== undefined) {
    out.avance_financiero = p.avanceFinanciero ?? p.avance_financiero;
  }
  if (p.ingresos !== undefined) out.ingresos = p.ingresos;
  if (p.gastos !== undefined) out.gastos = p.gastos;
  if (p.pendienteAportar !== undefined || p.pendiente_aportar !== undefined) {
    out.pendiente_aportar = p.pendienteAportar ?? p.pendiente_aportar;
  }
  if (p.total !== undefined) out.total = p.total;
  if (p.costo_directo !== undefined || p.costoDirecto !== undefined) {
    out.costo_directo = p.costo_directo ?? p.costoDirecto;
  }
  if (p.fechaInicio !== undefined || p.fecha_inicio !== undefined) {
    out.fecha_inicio = p.fechaInicio ?? p.fecha_inicio;
  }
  if (p.fechaFin !== undefined || p.fecha_fin !== undefined) {
    out.fecha_fin = p.fechaFin ?? p.fecha_fin;
  }
  if (p.userId !== undefined || p.user_id !== undefined) {
    out.user_id = p.userId ?? p.user_id;
  }
  return out;
};

export const dbToEquipo = (db: any): Equipo => ({
  id: String(db?.id ?? ''),
  nombre: db?.nombre ?? '',
  userId: db?.user_id ?? db?.userId,
  estado: db?.estado ?? 'activo',
  descripcion: db?.descripcion ?? '',
  createdAt: db?.created_at ?? db?.createdAt,
});

export const equipoToDb = (e: Partial<Equipo> | any): Partial<DBEquipo> => {
  const out: Partial<DBEquipo> = {};
  if (e.nombre !== undefined) out.nombre = e.nombre;
  if (e.estado !== undefined) out.estado = e.estado;
  if (e.descripcion !== undefined) out.descripcion = e.descripcion;
  if (e.userId !== undefined || e.user_id !== undefined) {
    out.user_id = e.userId ?? e.user_id;
  }
  return out;
};

export const dbToEquipoMiembro = (db: any): EquipoMiembro => ({
  id: String(db?.id ?? ''),
  equipoId: db?.equipo_id ?? db?.equipoId ?? '',
  userId: db?.user_id ?? db?.userId ?? '',
  rol: db?.rol ?? 'miembro',
  createdAt: db?.created_at ?? db?.createdAt,
});

export const equipoMiembroToDb = (em: Partial<EquipoMiembro> | any): Partial<DBEquipoMiembro> => {
  const out: Partial<DBEquipoMiembro> = {};
  if (em.equipoId !== undefined || em.equipo_id !== undefined) {
    out.equipo_id = em.equipoId ?? em.equipo_id;
  }
  if (em.userId !== undefined || em.user_id !== undefined) {
    out.user_id = em.userId ?? em.user_id;
  }
  if (em.rol !== undefined) out.rol = em.rol;
  return out;
};

export const dbToEmpleado = (db: any): Empleado => ({
  id: String(db?.id ?? ''),
  userId: db?.user_id ?? db?.userId,
  nombre: db?.nombre ?? '',
  puesto: db?.puesto ?? 'Operario',
  telefono: db?.telefono ?? '',
  salario_diario: typeof db?.salario_diario === 'number' ? db.salario_diario : Number(db?.salario_diario) || 0,
  activo: db?.activo !== false,
  createdAt: db?.created_at ?? db?.createdAt,
});

export const empleadoToDb = (e: Partial<Empleado> | any): Partial<DBEmpleado> => {
  const out: Partial<DBEmpleado> = {};
  if (e.nombre !== undefined) out.nombre = e.nombre;
  if (e.puesto !== undefined) out.puesto = e.puesto;
  if (e.telefono !== undefined) out.telefono = e.telefono;
  if (e.salario_diario !== undefined) out.salario_diario = e.salario_diario;
  if (e.activo !== undefined) out.activo = e.activo;
  if (e.userId !== undefined || e.user_id !== undefined) {
    out.user_id = e.userId ?? e.user_id;
  }
  return out;
};

export const dbToOrdenCompra = (db: any): OrdenCompra => ({
  id: String(db?.id ?? ''),
  userId: db?.user_id ?? db?.userId,
  folio: db?.folio ?? '',
  proveedorId: db?.proveedor_id ?? db?.proveedorId,
  proyectoId: db?.proyecto_id ?? db?.proyectoId,
  fechaEmision: db?.fecha_emision ?? db?.fechaEmision ?? new Date().toISOString().split('T')[0],
  fechaEntrega: db?.fecha_entrega ?? db?.fechaEntrega,
  estatus: db?.estatus ?? 'pendiente',
  subtotal: typeof db?.subtotal === 'number' ? db.subtotal : Number(db?.subtotal) || 0,
  iva: typeof db?.iva === 'number' ? db.iva : Number(db?.iva) || 0,
  total: typeof db?.total === 'number' ? db.total : Number(db?.total) || 0,
  notas: db?.notas ?? '',
  createdAt: db?.created_at ?? db?.createdAt,
  updatedAt: db?.updated_at ?? db?.updatedAt,
});

export const ordenCompraToDb = (oc: Partial<OrdenCompra> | any): Partial<DBOrdenCompra> => {
  const out: Partial<DBOrdenCompra> = {};
  if (oc.folio !== undefined) out.folio = oc.folio;
  if (oc.proveedorId !== undefined || oc.proveedor_id !== undefined) {
    out.proveedor_id = oc.proveedorId ?? oc.proveedor_id;
  }
  if (oc.proyectoId !== undefined || oc.proyecto_id !== undefined) {
    out.proyecto_id = oc.proyectoId ?? oc.proyecto_id;
  }
  if (oc.fechaEmision !== undefined || oc.fecha_emision !== undefined) {
    out.fecha_emision = oc.fechaEmision ?? oc.fecha_emision;
  }
  if (oc.fechaEntrega !== undefined || oc.fecha_entrega !== undefined) {
    out.fecha_entrega = oc.fechaEntrega ?? oc.fecha_entrega;
  }
  if (oc.estatus !== undefined) out.estatus = oc.estatus;
  if (oc.subtotal !== undefined) out.subtotal = oc.subtotal;
  if (oc.iva !== undefined) out.iva = oc.iva;
  if (oc.total !== undefined) out.total = oc.total;
  if (oc.notas !== undefined) out.notas = oc.notas;
  if (oc.userId !== undefined || oc.user_id !== undefined) {
    out.user_id = oc.userId ?? oc.user_id;
  }
  return out;
};

export const dbToOrdenCompraItem = (db: any): OrdenCompraItem => ({
  id: String(db?.id ?? ''),
  ordenCompraId: db?.orden_compra_id ?? db?.ordenCompraId ?? '',
  materialId: db?.material_id ?? db?.materialId,
  descripcion: db?.descripcion ?? '',
  cantidad: typeof db?.cantidad === 'number' ? db.cantidad : Number(db?.cantidad) || 0,
  unidad: db?.unidad ?? 'pza',
  precioUnitario: typeof db?.precio_unitario === 'number' ? db.precio_unitario : (typeof db?.precioUnitario === 'number' ? db.precioUnitario : Number(db?.precio_unitario ?? db?.precioUnitario) || 0),
  importe: typeof db?.importe === 'number' ? db.importe : Number(db?.importe) || 0,
  cantidadRecibida: typeof db?.cantidad_recibida === 'number' ? db.cantidad_recibida : (typeof db?.cantidadRecibida === 'number' ? db.cantidadRecibida : Number(db?.cantidad_recibida ?? db?.cantidadRecibida) || 0),
  createdAt: db?.created_at ?? db?.createdAt,
});

export const ordenCompraItemToDb = (item: Partial<OrdenCompraItem> | any): Partial<DBOrdenCompraItem> => {
  const out: Partial<DBOrdenCompraItem> = {};
  if (item.ordenCompraId !== undefined || item.orden_compra_id !== undefined) {
    out.orden_compra_id = item.ordenCompraId ?? item.orden_compra_id;
  }
  if (item.materialId !== undefined || item.material_id !== undefined) {
    out.material_id = item.materialId ?? item.material_id;
  }
  if (item.descripcion !== undefined) out.descripcion = item.descripcion;
  if (item.cantidad !== undefined) out.cantidad = item.cantidad;
  if (item.unidad !== undefined) out.unidad = item.unidad;
  if (item.precioUnitario !== undefined || item.precio_unitario !== undefined) {
    out.precio_unitario = item.precioUnitario ?? item.precio_unitario;
  }
  if (item.importe !== undefined) out.importe = item.importe;
  if (item.cantidadRecibida !== undefined || item.cantidad_recibida !== undefined) {
    out.cantidad_recibida = item.cantidadRecibida ?? item.cantidad_recibida;
  }
  return out;
};

export const dbToRecepcionOC = (db: any): RecepcionOC => ({
  id: String(db?.id ?? ''),
  ordenCompraId: db?.orden_compra_id ?? db?.ordenCompraId ?? '',
  userId: db?.user_id ?? db?.userId ?? '',
  fechaRecepcion: db?.fecha_recepcion ?? db?.fechaRecepcion ?? new Date().toISOString().split('T')[0],
  observaciones: db?.observaciones ?? '',
  createdAt: db?.created_at ?? db?.createdAt,
});

export const recepcionOCToDb = (r: Partial<RecepcionOC> | any): Partial<DBRecepcionOC> => {
  const out: Partial<DBRecepcionOC> = {};
  if (r.ordenCompraId !== undefined || r.orden_compra_id !== undefined) {
    out.orden_compra_id = r.ordenCompraId ?? r.orden_compra_id;
  }
  if (r.userId !== undefined || r.user_id !== undefined) {
    out.user_id = r.userId ?? r.user_id;
  }
  if (r.fechaRecepcion !== undefined || r.fecha_recepcion !== undefined) {
    out.fecha_recepcion = r.fechaRecepcion ?? r.fecha_recepcion;
  }
  if (r.observaciones !== undefined) out.observaciones = r.observaciones;
  return out;
};

export const dbToRecepcionOCItem = (db: any): RecepcionOCItem => ({
  id: String(db?.id ?? ''),
  recepcionId: db?.recepcion_id ?? db?.recepcionId ?? '',
  ordenCompraItemId: db?.orden_compra_item_id ?? db?.ordenCompraItemId ?? '',
  cantidadRecibida: typeof db?.cantidad_recibida === 'number' ? db.cantidad_recibida : (typeof db?.cantidadRecibida === 'number' ? db.cantidadRecibida : Number(db?.cantidad_recibida ?? db?.cantidadRecibida) || 0),
  createdAt: db?.created_at ?? db?.createdAt,
});

export const recepcionOCItemToDb = (item: Partial<RecepcionOCItem> | any): Partial<DBRecepcionOCItem> => {
  const out: Partial<DBRecepcionOCItem> = {};
  if (item.recepcionId !== undefined || item.recepcion_id !== undefined) {
    out.recepcion_id = item.recepcionId ?? item.recepcion_id;
  }
  if (item.ordenCompraItemId !== undefined || item.orden_compra_item_id !== undefined) {
    out.orden_compra_item_id = item.ordenCompraItemId ?? item.orden_compra_item_id;
  }
  if (item.cantidadRecibida !== undefined || item.cantidad_recibida !== undefined) {
    out.cantidad_recibida = item.cantidadRecibida ?? item.cantidad_recibida;
  }
  return out;
};

export const dbToMaterial = (db: any): Material => ({
  id: String(db?.id ?? ''),
  presupuestoId: db?.presupuesto_id ?? db?.presupuestoId ?? '',
  presupuesto_id: db?.presupuesto_id ?? db?.presupuestoId ?? '',
  nombre: db?.nombre ?? '',
  codigo: db?.codigo ?? null,
  unidad: db?.unidad ?? 'u',
  cantidadEstimada: typeof db?.cantidad_estimada === 'number' ? db.cantidad_estimada : (typeof db?.cantidadEstimada === 'number' ? db.cantidadEstimada : Number(db?.cantidad_estimada ?? db?.cantidadEstimada) || 0),
  cantidad_estimada: typeof db?.cantidad_estimada === 'number' ? db.cantidad_estimada : (typeof db?.cantidadEstimada === 'number' ? db.cantidadEstimada : Number(db?.cantidad_estimada ?? db?.cantidadEstimada) || 0),
  cantidadUtilizada: typeof db?.cantidad_utilizada === 'number' ? db.cantidad_utilizada : (typeof db?.cantidadUtilizada === 'number' ? db.cantidadUtilizada : Number(db?.cantidad_utilizada ?? db?.cantidadUtilizada) || 0),
  cantidad_utilizada: typeof db?.cantidad_utilizada === 'number' ? db.cantidad_utilizada : (typeof db?.cantidadUtilizada === 'number' ? db.cantidadUtilizada : Number(db?.cantidad_utilizada ?? db?.cantidadUtilizada) || 0),
  costoUnitario: typeof db?.costo_unitario === 'number' ? db.costo_unitario : (typeof db?.costoUnitario === 'number' ? db.costoUnitario : Number(db?.costo_unitario ?? db?.costoUnitario) || 0),
  costo_unitario: typeof db?.costo_unitario === 'number' ? db.costo_unitario : (typeof db?.costoUnitario === 'number' ? db.costoUnitario : Number(db?.costo_unitario ?? db?.costoUnitario) || 0),
  proveedor: db?.proveedor ?? null,
  createdAt: db?.created_at ?? db?.createdAt,
});

export const materialToDb = (m: Partial<Material> | any): Partial<DBMaterialProyecto> => {
  const out: Partial<DBMaterialProyecto> = {};
  if (m.presupuestoId !== undefined || m.presupuesto_id !== undefined) {
    out.presupuesto_id = m.presupuestoId ?? m.presupuesto_id;
  }
  if (m.nombre !== undefined) out.nombre = m.nombre;
  if (m.codigo !== undefined) out.codigo = m.codigo;
  if (m.unidad !== undefined) out.unidad = m.unidad;
  if (m.cantidadEstimada !== undefined || m.cantidad_estimada !== undefined) {
    out.cantidad_estimada = m.cantidadEstimada ?? m.cantidad_estimada;
  }
  if (m.cantidadUtilizada !== undefined || m.cantidad_utilizada !== undefined) {
    out.cantidad_utilizada = m.cantidadUtilizada ?? m.cantidad_utilizada;
  }
  if (m.costoUnitario !== undefined || m.costo_unitario !== undefined) {
    out.costo_unitario = m.costoUnitario ?? m.costo_unitario;
  }
  if (m.proveedor !== undefined) out.proveedor = m.proveedor;
  return out;
};

export const dbToActividad = (db: any): Actividad => ({
  id: String(db?.id ?? ''),
  userId: db?.user_id ?? db?.userId,
  titulo: db?.titulo ?? '',
  fecha: db?.fecha ?? new Date().toISOString().split('T')[0],
  hora: db?.hora ?? '',
  descripcion: db?.descripcion ?? '',
  presupuestoId: db?.presupuesto_id ?? db?.presupuestoId,
  createdAt: db?.created_at ?? db?.createdAt,
});

export const actividadToDb = (a: Partial<Actividad> | any): Partial<DBActividad> => {
  const out: Partial<DBActividad> = {};
  if (a.titulo !== undefined) out.titulo = a.titulo;
  if (a.fecha !== undefined) out.fecha = a.fecha;
  if (a.hora !== undefined) out.hora = a.hora;
  if (a.descripcion !== undefined) out.descripcion = a.descripcion;
  if (a.presupuestoId !== undefined || a.presupuesto_id !== undefined) {
    out.presupuesto_id = a.presupuestoId ?? a.presupuesto_id;
  }
  if (a.userId !== undefined || a.user_id !== undefined) {
    out.user_id = a.userId ?? a.user_id;
  }
  return out;
};

export const dbToChecklistItem = (db: any): ChecklistItem => ({
  id: String(db?.id ?? ''),
  presupuestoId: db?.presupuesto_id ?? db?.presupuestoId,
  fase: db?.fase ?? 'planeación',
  item: db?.item ?? '',
  completado: Boolean(db?.completado),
  fotoUrl: db?.foto_url ?? db?.fotoUrl,
  completadoPor: db?.completado_por ?? db?.completadoPor,
  completadoEn: db?.completado_en ?? db?.completadoEn,
  createdAt: db?.created_at ?? db?.createdAt,
});

export const checklistItemToDb = (item: Partial<ChecklistItem> | any): Partial<DBChecklistItem> => {
  const out: Partial<DBChecklistItem> = {};
  if (item.presupuestoId !== undefined || item.presupuesto_id !== undefined) {
    out.presupuesto_id = item.presupuestoId ?? item.presupuesto_id;
  }
  if (item.fase !== undefined) out.fase = item.fase;
  if (item.item !== undefined) out.item = item.item;
  if (item.completado !== undefined) out.completado = item.completado;
  if (item.fotoUrl !== undefined || item.foto_url !== undefined) {
    out.foto_url = item.fotoUrl ?? item.foto_url;
  }
  if (item.completadoPor !== undefined || item.completado_por !== undefined) {
    out.completado_por = item.completadoPor ?? item.completado_por;
  }
  if (item.completadoEn !== undefined || item.completado_en !== undefined) {
    out.completado_en = item.completadoEn ?? item.completado_en;
  }
  return out;
};

export const dbToCambioPresupuesto = (db: any): CambiosPresupuesto => ({
  id: String(db?.id ?? ''),
  presupuestoId: db?.presupuesto_id ?? db?.presupuestoId,
  version: typeof db?.version === 'number' ? db.version : Number(db?.version) || 1,
  cambios: db?.cambios ?? {},
  motivo: db?.motivo ?? '',
  aprobadoPor: db?.aprobado_por ?? db?.aprobadoPor,
  estado: db?.estado ?? 'pendiente',
  createdAt: db?.created_at ?? db?.createdAt,
});

export const cambioPresupuestoToDb = (c: Partial<CambiosPresupuesto> | any): Partial<DBCambioPresupuesto> => {
  const out: Partial<DBCambioPresupuesto> = {};
  if (c.presupuestoId !== undefined || c.presupuesto_id !== undefined) {
    out.presupuesto_id = c.presupuestoId ?? c.presupuesto_id;
  }
  if (c.version !== undefined) out.version = c.version;
  if (c.cambios !== undefined) out.cambios = c.cambios;
  if (c.motivo !== undefined) out.motivo = c.motivo;
  if (c.aprobadoPor !== undefined || c.aprobado_por !== undefined) {
    out.aprobado_por = c.aprobadoPor ?? c.aprobado_por;
  }
  if (c.estado !== undefined) out.estado = c.estado;
  return out;
};

export const dbToBitacoraAvance = (db: any): BitacoraAvance => ({
  id: String(db?.id ?? ''),
  presupuestoId: db?.presupuesto_id ?? db?.presupuestoId ?? '',
  userId: db?.user_id ?? db?.userId ?? '',
  avance: typeof db?.avance === 'number' ? db.avance : Number(db?.avance) || 0,
  notas: db?.notas ?? '',
  fecha: db?.fecha ?? new Date().toISOString(),
  createdAt: db?.created_at ?? db?.createdAt,
});

export const bitacoraAvanceToDb = (b: Partial<BitacoraAvance> | any): Partial<DBBitacoraAvance> => {
  const out: Partial<DBBitacoraAvance> = {};
  if (b.presupuestoId !== undefined || b.presupuesto_id !== undefined) {
    out.presupuesto_id = b.presupuestoId ?? b.presupuesto_id;
  }
  if (b.userId !== undefined || b.user_id !== undefined) {
    out.user_id = b.userId ?? b.user_id;
  }
  if (b.avance !== undefined) out.avance = b.avance;
  if (b.notas !== undefined) out.notas = b.notas;
  if (b.fecha !== undefined) out.fecha = b.fecha;
  return out;
};

// Subrenglones mappers
export type Subrenglon = DBSubrenglon;
export type CreateSubrenglon = Omit<DBSubrenglon, 'id' | 'created_at' | 'updated_at'>;
export type UpdateSubrenglon = Partial<CreateSubrenglon>;
export const dbToSubrenglon = (db: DBSubrenglon): DBSubrenglon => db;
export const subrenglonToDb = (input: Partial<DBSubrenglon>): Partial<DBSubrenglon> => input;

export const dbToSubrenglonMaterial = (db: DBSubrenglonMaterial): DBSubrenglonMaterial => db;
export const subrenglonMaterialToDb = (input: Partial<DBSubrenglonMaterial>): Partial<DBSubrenglonMaterial> => input;

export const dbToSubrenglonManoObra = (db: DBSubrenglonManoObra): DBSubrenglonManoObra => db;
export const subrenglonManoObraToDb = (input: Partial<DBSubrenglonManoObra>): Partial<DBSubrenglonManoObra> => input;

export const dbToSubrenglonEquipo = (db: DBSubrenglonEquipo): DBSubrenglonEquipo => db;
export const subrenglonEquipoToDb = (input: Partial<DBSubrenglonEquipo>): Partial<DBSubrenglonEquipo> => input;

// Validaciones
export const validateEquipo = (input: any): input is Equipo => {
  return typeof input?.nombre === 'string' && input.nombre.trim().length > 0;
};
export const validateEquipoMiembro = (input: any): input is EquipoMiembro => {
  return typeof (input?.equipoId ?? input?.equipo_id) === 'string';
};
export const validateTransaccion = (input: any): input is Transaccion => {
  return typeof input?.tipo === 'string' && typeof input?.categoria === 'string';
};
export const validateCliente = (input: any): input is Cliente => {
  return typeof input?.nombre === 'string' && input.nombre.trim().length > 0;
};
export const validateProyecto = (input: any): input is Proyecto => {
  return typeof input?.nombre === 'string' && input.nombre.trim().length > 0;
};
export const validatePresupuesto = (input: any): input is Presupuesto => {
  return typeof input?.proyecto === 'string' && input.proyecto.trim().length > 0;
};
