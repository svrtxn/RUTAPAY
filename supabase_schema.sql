-- Esquema de Base de Datos para RutaPay

-- 1. Tabla de Usuarios y Roles
CREATE TABLE public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('CHOFER', 'ADMIN')),
    password_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Configuración Mensual (Sueldos y Viáticos)
-- Permite al admin definir cuánto se paga de base y viático por mes
CREATE TABLE public.monthly_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    base_salary DECIMAL(10, 2) NOT NULL DEFAULT 0,
    viatics DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(month, year) -- Solo una configuración por mes/año
);

-- 3. Tabla de Viajes (Asociados a un chofer)
CREATE TABLE public.trips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    origin TEXT,
    destination TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- MIGRACIÓN: Si ya tenés las tablas creadas, ejecutá esto en vez de todo:
-- =========================================================================
-- ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT;
-- ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS origin TEXT;
