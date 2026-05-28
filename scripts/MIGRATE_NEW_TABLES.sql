-- PASO 1: Agregar columnas sin FK (más seguro)
-- Ejecutar esto primero

ALTER TABLE public.ocr_documentos ADD COLUMN IF NOT EXISTS proyecto_id uuid;
ALTER TABLE public.ocr_documentos ADD COLUMN IF NOT EXISTS proveedor text;
ALTER TABLE public.ocr_documentos ADD COLUMN IF NOT EXISTS monto numeric(12,2);
ALTER TABLE public.ocr_documentos ADD COLUMN IF NOT EXISTS fecha_factura date;
ALTER TABLE public.ocr_documentos ADD COLUMN IF NOT EXISTS notas text;
ALTER TABLE public.ocr_documentos ADD COLUMN IF NOT EXISTS estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado'));

-- Si las columnas se agregaron exitosamente, ahora agrega las FK:
-- (ejecutar después de verificar que paso 1 funcionó)

-- ALTER TABLE public.ocr_documentos ADD CONSTRAINT IF NOT EXISTS fk_ocr_proyecto FOREIGN KEY (proyecto_id) REFERENCES public.presupuestos(id) ON DELETE SET NULL;

-- PASO 2: Crear tablas nuevas (seguro - no falla si existen)

CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.caja_proyecto (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id uuid UNIQUE NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  saldo_inicial numeric(12,2) DEFAULT 0,
  saldo_sistema_actual numeric(12,2) DEFAULT 0,
  saldo_real_actual numeric(12,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.movimientos_caja (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  caja_id uuid NOT NULL REFERENCES public.caja_proyecto(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  descripcion text NOT NULL,
  subtipo varchar NOT NULL,
  concepto varchar,
  monto numeric(12,2) NOT NULL,
  saldo_sistema_antes numeric(12,2) NOT NULL,
  saldo_sistema_despues numeric(12,2) NOT NULL,
  saldo_real_confirmado numeric(12,2),
  diferencia numeric(12,2),
  conciliado_fecha timestamptz,
  motivo_diferencia text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transacciones_recurrentes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  presupuesto_id uuid NOT NULL REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  descripcion text NOT NULL,
  tipo varchar NOT NULL,
  monto numeric(12,2) NOT NULL,
  frecuencia varchar NOT NULL,
  activa boolean DEFAULT true,
  proxima_fecha date,
  ultima_fecha date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.presupuestos ADD COLUMN IF NOT EXISTS area_construccion numeric DEFAULT 0;
ALTER TABLE public.presupuestos ADD COLUMN IF NOT EXISTS nivel_calidad text DEFAULT 'basico';