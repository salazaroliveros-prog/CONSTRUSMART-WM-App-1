// Fuente única de verdad: re-exportar desde types/supabase.ts
// NO redefinir schemas aquí — evita contradicciones entre archivos
export {
  validateCliente,
  validateProyecto,
  validateTransaccion,
  validatePresupuesto,
  validateEquipo,
} from '@/types/supabase';

export type {
  DBCliente,
  DBProyecto,
  DBTransaccion,
  DBPresupuesto,
  DBEquipo,
} from '@/types/supabase';

// AvanceSchema — único schema propio de este archivo (no existe en types/supabase.ts)
import { z } from 'zod';
export const AvanceSchema = z.object({
  id: z.string().uuid().optional(),
  presupuesto_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  fecha: z.string(),
  avance: z.number().min(0).max(100),
  notas: z.string().min(1),
  created_at: z.string().optional(),
});
export type Avance = z.infer<typeof AvanceSchema>;
