import AppDataService from '@/services/AppDataService';
import type {
  Database,
  Cliente,
  Proyecto,
  Presupuesto,
  Transaccion,
  Actividad,
  Equipo,
  EquipoMiembro,
  Proveedor,
  OrdenCompra,
  AppNotification,
} from '@/types/supabase';
import {
  dbToCliente,
  dbToProyecto,
  dbToPresupuesto,
  dbToTransaccion,
  dbToActividad,
  dbToEquipo,
  dbToEquipoMiembro,
  dbToProveedor,
  dbToOrdenCompra,
} from '@/types/supabase';
import { loadCachedData, saveCachedData } from '@/services/offline';

export type AppUserData = {
  clientes: Cliente[];
  proyectos: Proyecto[];
  presupuestos: Presupuesto[];
  transacciones: Transaccion[];
  actividades: Actividad[];
  equipos: Equipo[];
  equipoMiembros: EquipoMiembro[];
  proveedores: Proveedor[];
  ordenesCompra: OrdenCompra[];
  notificaciones: AppNotification[];
};

const tableMappers = {
  clientes: dbToCliente,
  proyectos: dbToProyecto,
  presupuestos: dbToPresupuesto,
  transacciones: dbToTransaccion,
  actividades: dbToActividad,
  equipos: dbToEquipo,
  equipo_miembros: dbToEquipoMiembro,
  proveedores: dbToProveedor,
  ordenes_compra: dbToOrdenCompra,
} as const;

const mapAndCache = <T extends keyof typeof tableMappers>(
  tableName: T,
  rows: Database[T][],
  userId: string,
) => {
  const mapper = tableMappers[tableName];
  const mapped = rows.map(mapper) as unknown as AppUserData[typeof tableName extends 'equipo_miembros' ? 'equipoMiembros' : typeof tableName extends 'ordenes_compra' ? 'ordenesCompra' : typeof tableName];
  if (rows.length > 0) saveCachedData(tableName, userId, mapped);
  return mapped;
};

const loadFromCache = <T extends keyof AppUserData>(key: T, userId: string): AppUserData[T] => {
  return loadCachedData<any>(key === 'equipoMiembros' ? 'equipo_miembros' : key === 'ordenesCompra' ? 'ordenes_compra' : key, userId) || [];
};

export const AppStateService = {
  async loadAllUserData(userId: string): Promise<AppUserData> {
    try {
      const data = await AppDataService.loadAll(userId);
      return {
        clientes: mapAndCache('clientes', data.clientes || [], userId),
        proyectos: mapAndCache('proyectos', data.proyectos || [], userId),
        presupuestos: mapAndCache('presupuestos', data.presupuestos || [], userId),
        transacciones: mapAndCache('transacciones', data.transacciones || [], userId),
        actividades: mapAndCache('actividades', data.actividades || [], userId),
        equipos: mapAndCache('equipos', data.equipos || [], userId),
        equipoMiembros: mapAndCache('equipo_miembros', data.equipo_miembros || [], userId),
        proveedores: mapAndCache('proveedores', data.proveedores || [], userId),
        ordenesCompra: mapAndCache('ordenes_compra', data.ordenes_compra || [], userId),
        notificaciones: data.notificaciones || [],
      };
    } catch {
      return {
        clientes: loadFromCache('clientes', userId),
        proyectos: loadFromCache('proyectos', userId),
        presupuestos: loadFromCache('presupuestos', userId),
        transacciones: loadFromCache('transacciones', userId),
        actividades: loadFromCache('actividades', userId),
        equipos: loadFromCache('equipos', userId),
        equipoMiembros: loadFromCache('equipoMiembros', userId),
        proveedores: loadFromCache('proveedores', userId),
        ordenesCompra: loadFromCache('ordenesCompra', userId),
        notificaciones: [],
      };
    }
  },
};
