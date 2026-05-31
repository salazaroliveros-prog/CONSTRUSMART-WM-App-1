// =====================================================================
// TIPOS DE SUPABASE ALINEADOS CON EL ESQUEMA DE MIGRACIÓN REAL
// =====================================================================

import { z } from 'zod';
import { Session } from '@supabase/supabase-js';

// Database type for createClient generic (Supabase schema shape)
export interface Database {
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

// ====== Esquemas de validación y tipos DB ======

const ActividadSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  titulo: z.string(),
  fecha: z.string(),
  hora: z.string().nullable(),
  descripcion: z.string().nullable(),
  presupuesto_id: z.string().nullable(),
  created_at: z.string().nullable(),
});
export type DBActividad = z.infer<typeof ActividadSchema>;

const AuditLogSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  tabla: z.string(),
  registro_id: z.string(),
  accion: z.string(),
  valor_anterior: z.record(z.unknown()).nullable(),
  valor_nuevo: z.record(z.unknown()).nullable(),
  created_at: z.string().nullable(),
});
export type DBAuditLog = z.infer<typeof AuditLogSchema>;

const BitacoraAvanceSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  presupuesto_id: z.string(),
  fecha: z.string().nullable(),
  avance: z.number(),
  notas: z.string().nullable(),
  recursos_usados: z.record(z.unknown()).nullable(),
  created_at: z.string().nullable(),
});
export type DBBitacoraAvance = z.infer<typeof BitacoraAvanceSchema>;

const CajaProyectoSchema = z.object({
  id: z.string(),
  proyecto_id: z.string(),
  user_id: z.string(),
  saldo_inicial: z.number(),
  saldo_sistema_actual: z.number().nullable(),
  saldo_real_actual: z.number().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});
export type DBCajaProyecto = z.infer<typeof CajaProyectoSchema>;

const CambioPresupuestoSchema = z.object({
  id: z.string(),
  presupuesto_id: z.string().nullable(),
  version: z.number(),
  cambios: z.record(z.unknown()),
  motivo: z.string(),
  aprobado_por: z.string().nullable(),
  estado: z.string().nullable(),
  created_at: z.string().nullable(),
});
export type DBCambioPresupuesto = z.infer<typeof CambioPresupuestoSchema>;

const ChecklistItemSchema = z.object({
  id: z.string(),
  presupuesto_id: z.string().nullable(),
  fase: z.string(),
  item: z.string(),
  completado: z.boolean().nullable(),
  foto_url: z.string().nullable(),
  completado_por: z.string().nullable(),
  completado_en: z.string().nullable(),
  created_at: z.string().nullable(),
});
export type DBChecklistItem = z.infer<typeof ChecklistItemSchema>;

const ClienteSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  nombre: z.string(),
  telefono: z.string().nullable(),
  email: z.string().nullable(),
  direccion: z.string().nullable(),
  tipo_proyecto: z.string().nullable(),
  estado: z.string().nullable(),
  notas: z.string().nullable(),
  fecha: z.string().nullable(),
  created_at: z.string().nullable(),
});
export type DBCliente = z.infer<typeof ClienteSchema>;

const ConciliacionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  banco: z.string(),
  periodo: z.string(),
  saldo_libros: z.number().nullable(),
  saldo_banco: z.number().nullable(),
  diferencia: z.number().nullable(),
  conciliado: z.boolean().nullable(),
  notas: z.string().nullable(),
  proyecto_id: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});
export type DBConciliacion = z.infer<typeof ConciliacionSchema>;

const DeviceTokenSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  token: z.string(),
  created_at: z.string().nullable(),
});
export type DBDeviceToken = z.infer<typeof DeviceTokenSchema>;

const EmpleadoSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  nombre: z.string(),
  puesto: z.string(),
  telefono: z.string().nullable(),
  salario_diario: z.number().nullable(),
  activo: z.boolean().nullable(),
  created_at: z.string().nullable(),
});
export type DBEmpleado = z.infer<typeof EmpleadoSchema>;

const EquipoMiembroSchema = z.object({
  id: z.string(),
  equipo_id: z.string(),
  user_id: z.string(),
  rol: z.string().nullable(),
  created_at: z.string().nullable(),
});
export type DBEquipoMiembro = z.infer<typeof EquipoMiembroSchema>;

const EquipoSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  nombre: z.string(),
  descripcion: z.string().nullable(),
  estado: z.string().nullable(),
  created_at: z.string().nullable(),
});
export type DBEquipo = z.infer<typeof EquipoSchema>;

// App-level Equipo types
export type Equipo = DBEquipo;
export type CreateEquipo = Omit<DBEquipo, 'id' | 'created_at'>;
export type UpdateEquipo = Partial<CreateEquipo>;
export const dbToEquipo = (_db: DBEquipo): Equipo => _db;
export const equipoToDb = (app: CreateEquipo | UpdateEquipo): Partial<DBEquipo> => app;

// App-level EquipoMiembro types
export type EquipoMiembro = DBEquipoMiembro;
export type CreateEquipoMiembro = Omit<DBEquipoMiembro, 'id' | 'created_at'>;
export type UpdateEquipoMiembro = Partial<CreateEquipoMiembro>;
export const dbToEquipoMiembro = (_db: DBEquipoMiembro): EquipoMiembro => _db;
export const equipoMiembroToDb = (app: CreateEquipoMiembro | UpdateEquipoMiembro): Partial<DBEquipoMiembro> => app;

const MaterialProyectoSchema = z.object({
  id: z.string(),
  presupuesto_id: z.string().nullable(),
  nombre: z.string(),
  codigo: z.string().nullable(),
  unidad: z.string().nullable(),
  cantidad_estimada: z.number().nullable(),
  cantidad_utilizada: z.number().nullable(),
  costo_unitario: z.number().nullable(),
  proveedor: z.string().nullable(),
  created_at: z.string().nullable(),
});
export type DBMaterialProyecto = z.infer<typeof MaterialProyectoSchema>;

const MovimientoCajaSchema = z.object({
  id: z.string(),
  caja_id: z.string(),
  user_id: z.string(),
  fecha: z.string(),
  descripcion: z.string(),
  subtipo: z.string(),
  concepto: z.string().nullable(),
  monto: z.number(),
  saldo_sistema_antes: z.number(),
  saldo_sistema_despues: z.number(),
  saldo_real_confirmado: z.number().nullable(),
  diferencia: z.number().nullable(),
  conciliado_fecha: z.string().nullable(),
  motivo_diferencia: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});
export type DBMovimientoCaja = z.infer<typeof MovimientoCajaSchema>;

const MovimientoMaterialSchema = z.object({
  id: z.string(),
  material_id: z.string().nullable(),
  tipo: z.string(),
  cantidad: z.number(),
  ubicacion: z.string().nullable(),
  referencia: z.string().nullable(),
  user_id: z.string().nullable(),
  created_at: z.string().nullable(),
});
export type DBMovimientoMaterial = z.infer<typeof MovimientoMaterialSchema>;

const NotificacionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  tipo: z.string(),
  titulo: z.string(),
  mensaje: z.string().nullable(),
  leido: z.boolean().nullable(),
  created_at: z.string().nullable(),
});
export type DBNotificacion = z.infer<typeof NotificacionSchema>;

const OcrDocumentoSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  file_url: z.string(),
  ocr_data: z.record(z.unknown()).nullable(),
  status: z.string().nullable(),
  created_at: z.string().nullable(),
  proyecto_id: z.string().nullable(),
  proveedor: z.string().nullable(),
  monto: z.number().nullable(),
  fecha_factura: z.string().nullable(),
  notas: z.string().nullable(),
  estado: z.string().nullable(),
  revisado_por: z.string().nullable(),
});
export type DBOcrDocumento = z.infer<typeof OcrDocumentoSchema>;

const OrdenCompraItemSchema = z.object({
  id: z.string(),
  orden_compra_id: z.string(),
  descripcion: z.string(),
  cantidad: z.number(),
  unidad: z.string().nullable(),
  material_id: z.string().nullable(),
  precio_unitario: z.number().nullable(),
  importe: z.number().nullable(),
  cantidad_recibida: z.number().nullable(),
  created_at: z.string().nullable(),
});
export type DBOrdenCompraItem = z.infer<typeof OrdenCompraItemSchema>;

const OrdenCompraSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  folio: z.string(),
  proveedor_id: z.string().nullable(),
  proyecto_id: z.string().nullable(),
  fecha_emision: z.string().nullable(),
  fecha_entrega: z.string().nullable(),
  estatus: z.string().nullable(),
  subtotal: z.number().nullable(),
  iva: z.number().nullable(),
  total: z.number().nullable(),
  notas: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});
export type DBOrdenCompra = z.infer<typeof OrdenCompraSchema>;

const PartidaConciliacionSchema = z.object({
  id: z.string(),
  conciliacion_id: z.string().nullable(),
  tipo: z.string(),
  monto: z.number(),
  descripcion: z.string().nullable(),
  fecha: z.string().nullable(),
  aplicado: z.boolean().nullable(),
  created_at: z.string().nullable(),
});
export type DBPartidaConciliacion = z.infer<typeof PartidaConciliacionSchema>;

const PresupuestoSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  proyecto: z.string(),
  cliente: z.string().nullable(),
  ubicacion: z.string().nullable(),
  tipologia: z.string().nullable(),
  fase: z.string().nullable(),
  proyecto_id: z.string().nullable(),
  factor_indirectos: z.number().nullable(),
  factor_administrativos: z.number().nullable(),
  factor_imprevistos: z.number().nullable(),
  factor_utilidad: z.number().nullable(),
  lineas: z.record(z.unknown()).nullable(),
  avance_fisico: z.number().nullable(),
  avance_financiero: z.number().nullable(),
  ingresos: z.number().nullable(),
  gastos: z.number().nullable(),
  pendiente_aportar: z.number().nullable(),
  total: z.number().nullable(),
  costo_directo: z.number().nullable(),
  fecha_inicio: z.string().nullable(),
  fecha_fin: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  proyecto_id_uuid: z.string().nullable(),
});
export type DBPresupuesto = z.infer<typeof PresupuestoSchema>;

const ProveedorSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  nombre: z.string(),
  contacto: z.string().nullable(),
  telefono: z.string().nullable(),
  email: z.string().nullable(),
  direccion: z.string().nullable(),
  rfc: z.string().nullable(),
  notas: z.string().nullable(),
  activo: z.boolean().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});
export type DBProveedor = z.infer<typeof ProveedorSchema>;

const ProyectoSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  nombre: z.string(),
  cliente: z.string().nullable(),
  tipo: z.string().nullable(),
  estado: z.string().nullable(),
  presupuesto_total: z.number().nullable(),
  avance_fisico: z.number().nullable(),
  avance_financiero: z.number().nullable(),
  ingresos: z.number().nullable(),
  gastos: z.number().nullable(),
  pendiente_aportar: z.number().nullable(),
  fecha_inicio: z.string().nullable(),
  fecha_fin: z.string().nullable(),
  created_at: z.string().nullable(),
  fase: z.string().nullable(),
  total: z.number().nullable(),
  updated_at: z.string().nullable(),
});
export type DBProyecto = z.infer<typeof ProyectoSchema>;

const RecepcionOCSchema = z.object({
  id: z.string(),
  orden_compra_id: z.string(),
  user_id: z.string(),
  fecha_recepcion: z.string().nullable(),
  observaciones: z.string().nullable(),
  created_at: z.string().nullable(),
});
export type DBRecepcionOC = z.infer<typeof RecepcionOCSchema>;

const RecepcionOCItemSchema = z.object({
  id: z.string(),
  recepcion_id: z.string(),
  orden_compra_item_id: z.string(),
  cantidad_recibida: z.number(),
  created_at: z.string().nullable(),
});
export type DBRecepcionOCItem = z.infer<typeof RecepcionOCItemSchema>;

const RenglonPrecioHistorialSchema = z.object({
  id: z.string(),
  renglon_id: z.string().nullable(),
  fecha: z.string().nullable(),
  costo: z.number(),
  variacion: z.number().nullable(),
});
export type DBRenglonPrecioHistorial = z.infer<typeof RenglonPrecioHistorialSchema>;

const RenglonUsageSchema = z.object({
  id: z.string(),
  renglon_id: z.string().nullable(),
  presupuesto_id: z.string().nullable(),
  user_id: z.string().nullable(),
  created_at: z.string().nullable(),
});
export type DBRenglonUsage = z.infer<typeof RenglonUsageSchema>;

const RenglonSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  codigo: z.string(),
  descripcion: z.string(),
  tipo_renglon: z.string().nullable(),
  unidad: z.string().nullable(),
  rendimiento: z.number().nullable(),
  costo_material: z.number().nullable(),
  costo_mano_obra: z.number().nullable(),
  costo_herramienta: z.number().nullable(),
  subrenglones: z.record(z.unknown()).nullable(),
  materiales: z.record(z.unknown()).nullable(),
  mano_obra: z.record(z.unknown()).nullable(),
  equipos: z.record(z.unknown()).nullable(),
  categoria: z.string().nullable(),
  etiquetas: z.record(z.unknown()).nullable(),
  tipologia: z.string().nullable(),
  estimacion_tiempo: z.number().nullable(),
  dificultad: z.string().nullable(),
  equipo_requerido: z.record(z.unknown()).nullable(),
  notas: z.string().nullable(),
  favorito: z.boolean().nullable(),
  frecuencia_uso: z.number().nullable(),
  ultimo_uso: z.string().nullable(),
  activo: z.boolean().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});
export type DBRenglon = z.infer<typeof RenglonSchema>;

const SubrenglonEquipoSchema = z.object({
  id: z.string(),
  subrenglon_id: z.string(),
  descripcion: z.string(),
  cantidad: z.number().nullable(),
  costo_hora: z.number().nullable(),
  horas_uso: z.number().nullable(),
  subtotal: z.number().nullable(),
  created_at: z.string().nullable(),
});
export type DBSubrenglonEquipo = z.infer<typeof SubrenglonEquipoSchema>;

const SubrenglonManoObraSchema = z.object({
  id: z.string(),
  subrenglon_id: z.string(),
  descripcion: z.string(),
  cantidad_personas: z.number().nullable(),
  jornal: z.number().nullable(),
  rendimiento_especifico: z.number().nullable(),
  costo_unidad: z.number().nullable(),
  created_at: z.string().nullable(),
});
export type DBSubrenglonManoObra = z.infer<typeof SubrenglonManoObraSchema>;

const SubrenglonMaterialSchema = z.object({
  id: z.string(),
  subrenglon_id: z.string(),
  material_id: z.string().nullable(),
  nombre: z.string(),
  unidad: z.string().nullable(),
  cantidad: z.number().nullable(),
  costo_unitario: z.number().nullable(),
  desperdicio: z.number().nullable(),
  subtotal: z.number().nullable(),
  created_at: z.string().nullable(),
});
export type DBSubrenglonMaterial = z.infer<typeof SubrenglonMaterialSchema>;

const SubrenglonSchema = z.object({
  id: z.string(),
  presupuesto_id: z.string(),
  renglon_id: z.string().nullable(),
  codigo: z.string().nullable(),
  descripcion: z.string(),
  unidad: z.string().nullable(),
  cantidad: z.number().nullable(),
  rendimiento: z.number().nullable(),
  costo_material_total: z.number().nullable(),
  costo_mano_obra_total: z.number().nullable(),
  costo_equipos_total: z.number().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});
export type DBSubrenglon = z.infer<typeof SubrenglonSchema>;

const TransaccionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  tipo: z.string(),
  descripcion: z.string().nullable(),
  cantidad: z.number().nullable(),
  unidad: z.string().nullable(),
  categoria: z.string().nullable(),
  costo_unitario: z.number().nullable(),
  costo_total: z.number().nullable(),
  fecha: z.string().nullable(),
  proyecto_id: z.string().nullable(),
  empleado_id: z.string().nullable(),
  created_at: z.string().nullable(),
  presupuesto_id_uuid: z.string().nullable(),
  proyecto_id_uuid: z.string().nullable(),
  empleado_id_uuid: z.string().nullable(),
});
export type DBTransaccion = z.infer<typeof TransaccionSchema>;

const TransaccionRecurrenteSchema = z.object({
  id: z.string(),
  presupuesto_id: z.string(),
  user_id: z.string(),
  descripcion: z.string(),
  tipo: z.string(),
  monto: z.number(),
  frecuencia: z.string(),
  activa: z.boolean().nullable(),
  proxima_fecha: z.string().nullable(),
  ultima_fecha: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});
export type DBTransaccionRecurrente = z.infer<typeof TransaccionRecurrenteSchema>;

// ====== View Types y App Types ======

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

// ====== Mapper Functions ======
export const dbToCliente = (db: DBCliente): DBCliente => db;
export const clienteToDb = (input: Partial<DBCliente>): Partial<DBCliente> => input;
export type Cliente = DBCliente;
export type CreateCliente = Omit<DBCliente, 'id' | 'created_at'>;
export type UpdateCliente = Partial<CreateCliente>;

export const dbToProveedor = (db: DBProveedor): DBProveedor => db;
export const proveedorToDb = (input: Partial<DBProveedor>): Partial<DBProveedor> => input;
export type Proveedor = DBProveedor;
export type CreateProveedor = Omit<DBProveedor, 'id' | 'created_at' | 'updated_at'>;
export type UpdateProveedor = Partial<CreateProveedor>;

export const dbToProyecto = (db: DBProyecto): DBProyecto => db;
export const proyectoToDb = (input: Partial<DBProyecto>): Partial<DBProyecto> => input;
export type Proyecto = DBProyecto;
export type CreateProyecto = Omit<DBProyecto, 'id' | 'created_at' | 'updated_at'>;
export type UpdateProyecto = Partial<CreateProyecto>;

export const dbToActividad = (db: DBActividad): DBActividad => db;
export const actividadToDb = (input: Partial<DBActividad>): Partial<DBActividad> => input;
export type CreateActividad = Omit<DBActividad, 'id' | 'created_at'>;
export type UpdateActividad = Partial<CreateActividad>;

export const dbToEmpleado = (db: DBEmpleado): DBEmpleado => db;
export type Empleado = DBEmpleado;
export type CreateEmpleado = Omit<DBEmpleado, 'id' | 'created_at'>;
export type UpdateEmpleado = Partial<CreateEmpleado>;

export const dbToSubrenglon = (db: DBSubrenglon): DBSubrenglon => db;
export const subrenglonToDb = (input: Partial<DBSubrenglon>): Partial<DBSubrenglon> => input;
export type Subrenglon = DBSubrenglon;
export type CreateSubrenglon = Omit<DBSubrenglon, 'id' | 'created_at' | 'updated_at'>;
export type UpdateSubrenglon = Partial<CreateSubrenglon>;

export const dbToSubrenglonMaterial = (db: DBSubrenglonMaterial): DBSubrenglonMaterial => db;
export const subrenglonMaterialToDb = (input: Partial<DBSubrenglonMaterial>): Partial<DBSubrenglonMaterial> => input;

export const dbToSubrenglonManoObra = (db: DBSubrenglonManoObra): DBSubrenglonManoObra => db;
export const subrenglonManoObraToDb = (input: Partial<DBSubrenglonManoObra>): Partial<DBSubrenglonManoObra> => input;

export const dbToSubrenglonEquipo = (db: DBSubrenglonEquipo): DBSubrenglonEquipo => db;
export const subrenglonEquipoToDb = (input: Partial<DBSubrenglonEquipo>): Partial<DBSubrenglonEquipo> => input;

export const dbToChecklistItem = (db: DBChecklistItem): DBChecklistItem => db;
export const checklistItemToDb = (input: Partial<DBChecklistItem>): Partial<DBChecklistItem> => input;
export type ChecklistItem = DBChecklistItem;
export type CreateChecklistItem = Omit<DBChecklistItem, 'id' | 'created_at' | 'completado' | 'completado_por' | 'completado_en'>;
export type UpdateChecklistItem = Partial<CreateChecklistItem>;

export const dbToCambioPresupuesto = (db: DBCambioPresupuesto): DBCambioPresupuesto => db;
export const cambioPresupuestoToDb = (input: Partial<DBCambioPresupuesto>): Partial<DBCambioPresupuesto> => input;
export type CambiosPresupuesto = DBCambioPresupuesto;

export const dbToBitacoraAvance = (db: DBBitacoraAvance): DBBitacoraAvance => db;
export const bitacoraAvanceToDb = (input: Partial<DBBitacoraAvance>): Partial<DBBitacoraAvance> => input;

export const dbToMaterial = (db: DBMaterialProyecto): DBMaterialProyecto => db;
export const materialToDb = (input: Partial<DBMaterialProyecto>): Partial<DBMaterialProyecto> => input;
export type Material = DBMaterialProyecto;
export type CreateMaterial = Omit<DBMaterialProyecto, 'id' | 'created_at'>;
export type UpdateMaterial = Partial<CreateMaterial>;

export const dbToOrdenCompra = (db: DBOrdenCompra): DBOrdenCompra => db;
export const ordenCompraToDb = (input: Partial<DBOrdenCompra>): Partial<DBOrdenCompra> => input;

export const dbToOrdenCompraItem = (db: DBOrdenCompraItem): DBOrdenCompraItem => db;
export const ordenCompraItemToDb = (input: Partial<DBOrdenCompraItem>): Partial<DBOrdenCompraItem> => input;

export const dbToRecepcionOC = (db: DBRecepcionOC): DBRecepcionOC => db;
export const recepcionOCToDb = (input: Partial<DBRecepcionOC>): Partial<DBRecepcionOC> => input;
export type RecepcionOC = DBRecepcionOC;
export type CreateRecepcionOC = Omit<DBRecepcionOC, 'id' | 'created_at'>;
export type UpdateRecepcionOC = Partial<CreateRecepcionOC>;

export const dbToRecepcionOCItem = (db: DBRecepcionOCItem): DBRecepcionOCItem => db;
export const recepcionOCItemToDb = (input: Partial<DBRecepcionOCItem>): Partial<DBRecepcionOCItem> => input;
export type RecepcionOCItem = DBRecepcionOCItem;
export type CreateRecepcionOCItem = Omit<DBRecepcionOCItem, 'id' | 'created_at'>;
export type UpdateRecepcionOCItem = Partial<CreateRecepcionOCItem>;

export type Presupuesto = DBPresupuesto;
export const dbToPresupuesto = (db: DBPresupuesto): DBPresupuesto => db;
export const presupuestoToDb = (input: Partial<DBPresupuesto>): Partial<DBPresupuesto> => input;
export type CreatePresupuesto = Omit<DBPresupuesto, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePresupuesto = Partial<CreatePresupuesto>;

export const dbToTransaccion = (db: DBTransaccion): DBTransaccion => db;
export const transaccionToDb = (input: Partial<DBTransaccion>): Partial<DBTransaccion> => input;
export type Transaccion = DBTransaccion;
export type CreateTransaccion = Omit<DBTransaccion, 'id' | 'created_at'>;
export type UpdateTransaccion = Partial<CreateTransaccion>;

export type TableName = keyof Database;

// Validation functions
export const validateEquipo = (input: Partial<DBEquipo>): input is DBEquipo => {
  return typeof input.nombre === 'string';
};
export const validateEquipoMiembro = (input: Partial<DBEquipoMiembro>): input is DBEquipoMiembro => {
  return typeof input.equipo_id === 'string' && typeof input.user_id === 'string';
};
export const validateTransaccion = (input: Partial<DBTransaccion>): input is DBTransaccion => {
  return typeof input.tipo === 'string' && typeof input.categoria === 'string';
};
export const validateCliente = (input: Partial<DBCliente>): input is DBCliente => {
  return typeof input.nombre === 'string';
};
export const validateProyecto = (input: Partial<DBProyecto>): input is DBProyecto => {
  return typeof input.nombre === 'string';
};
export const validatePresupuesto = (input: Partial<DBPresupuesto>): input is DBPresupuesto => {
  return typeof input.proyecto === 'string';
};

// Additional types
export type OrdenCompra = DBOrdenCompra;
export type CreateOrdenCompra = Omit<DBOrdenCompra, 'id' | 'created_at' | 'updated_at' | 'folio'>;
export type UpdateOrdenCompra = Partial<Omit<DBOrdenCompra, 'id' | 'created_at' | 'updated_at' | 'user_id'>>;

export type CreatePresupuestoInput = {
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
};

export type TipoNotificacion = 'info' | 'alerta' | 'exito' | 'warning';

// Category constants and helpers for transaction classification
export const CAT_OPERATIVO = ['materiales', 'mano-obra', 'herramienta', 'sub-contrato', 'transporte'] as const;
export const CAT_ADMIN = ['administrativo', 'fijos'] as const;
export const CAT_PERSONAL = ['personal', 'hogar'] as const;

export const isOperativo = (cat: unknown): cat is typeof CAT_OPERATIVO[number] => typeof cat === 'string' && (CAT_OPERATIVO as readonly string[]).includes(cat);
export const isAdmin = (cat: unknown): cat is typeof CAT_ADMIN[number] => typeof cat === 'string' && (CAT_ADMIN as readonly string[]).includes(cat);
export const isPersonal = (cat: unknown): cat is typeof CAT_PERSONAL[number] => typeof cat === 'string' && (CAT_PERSONAL as readonly string[]).includes(cat);
