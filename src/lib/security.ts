import { z } from 'zod';

// Esquema de seguridad para validación de entrada crítica
export const AuthActionSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(['create', 'update', 'delete', 'read']),
  resource: z.string(),
  timestamp: z.string().datetime(),
});

// Configuración de seguridad para el entorno de producción
export const SecurityConfig = {
  csp: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co;",
  strictTransportSecurity: "max-age=63072000; includeSubDomains; preload",
};
