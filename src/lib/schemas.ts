import { z } from 'zod';

export const PresupuestoSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  team_id: z.string().uuid().optional(),
  proyecto: z.string().min(3),
  total: z.number().nonnegative(),
  factor_indirectos: z.number().min(0).max(100),
  factor_administrativos: z.number().min(0).max(100),
  factor_imprevistos: z.number().min(0).max(100),
  factor_utilidad: z.number().min(0).max(100),
  avanceFisico: z.number().min(0).max(100).default(0),
  avanceFinanciero: z.number().min(0).max(100).default(0),
  fase: z.enum(['planeación', 'ejecución', 'finalizado', 'evaluación', 'parado']),
});

export const ClienteSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  team_id: z.string().uuid().optional(),
  nombre: z.string().min(2),
  email: z.string().email().optional(),
  telefono: z.string().optional(),
});

export const TransaccionSchema = z.object({
  id: z.string().uuid(),
  proyectoId: z.string().uuid(),
  fecha: z.string(),
  tipo: z.enum(['ingreso', 'gasto']),
  descripcion: z.string().optional(),
  categoria: z.string(),
  costoTotal: z.number().nonnegative(),
});

export const EquipoSchema = z.object({
  id: z.string().uuid().optional(),
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  creador_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
});

export const AvanceSchema = z.object({
  id: z.string().uuid().optional(),
  presupuesto_id: z.string().uuid(),
  user_id: z.string().uuid(),
  fecha: z.string(),
  avance_fisico: z.number().min(0).max(100),
  descripcion: z.string().min(1),
  created_at: z.string().optional(),
});

export type Presupuesto = z.infer<typeof PresupuestoSchema>;
export type Cliente = z.infer<typeof ClienteSchema>;
export type Transaccion = z.infer<typeof TransaccionSchema>;
export type EquipoInput = z.infer<typeof EquipoSchema>;
export type Avance = z.infer<typeof AvanceSchema>;
