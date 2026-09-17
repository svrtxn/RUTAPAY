-- =========================================================================
-- MIGRACIÓN PARA EL PANEL DE ADMINISTRACIÓN (RutaPay)
-- =========================================================================
-- IMPORTANTE: Ejecuta esto en el editor SQL de Supabase (SQL Editor)

-- 1. Eliminar la tabla antigua que no tenía relación por chofer.
-- ATENCIÓN: Esto borrará la configuración mensual existente.
DROP TABLE IF EXISTS public.monthly_configs;

-- 2. Crear la nueva tabla con driver_id
CREATE TABLE public.monthly_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    base_salary DECIMAL(10, 2) NOT NULL DEFAULT 0,
    viatics DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Restricción única: Cada chofer solo puede tener una configuración por mes/año
    UNIQUE(driver_id, month, year)
);
