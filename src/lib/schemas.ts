import { z } from 'zod';

export const PresupuestoSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  team_id: z.string().uuid(), // Nueva columna de seguridad
  proyecto: z.string().min(3),
  // ... resto de campos
  fase: z.enum(['planeación', 'ejecución', 'finalizado', 'evaluación', 'parado']),
});

export const ClienteSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  team_id: z.string().uuid(), // Nueva columna de seguridad
  nombre: z.string().min(2),
  email: z.string().email().optional(),
});

export const TransaccionSchema = z.object({
  id: z.string().uuid(),
  proyectoId: z.string().uuid(),
  fecha: z.string(), // O z.date() si se parsea antes
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

export type EquipoInput = z.infer<typeof EquipoSchema>;
