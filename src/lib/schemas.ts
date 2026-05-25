import { z } from 'zod';

// ... (existentes en schemas.ts)

export const AvanceSchema = z.object({
  id: z.string().uuid().optional(),
  presupuesto_id: z.string().uuid(),
  user_id: z.string().uuid(),
  fecha: z.string(),
  avance_fisico: z.number().min(0).max(100),
  descripcion: z.string().min(1),
  created_at: z.string().optional(),
});

export type Avance = z.infer<typeof AvanceSchema>;
