-- Esquema de Base de Datos para RutaPay

-- 1. Tabla de Usuarios y Roles
CREATE TABLE public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('CHOFER', 'ADMIN')),
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
    destination TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE, -- Fecha específica del viaje
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- DATOS SEMILLA PARA PRUEBAS (Opcional)
-- =========================================================================

-- Crear Admin y Chofer de prueba
INSERT INTO public.users (id, email, name, role) 
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'admin@rutapay.com', 'Administrador General', 'ADMIN'),
  ('22222222-2222-2222-2222-222222222222', 'chofer1@rutapay.com', 'Chofer Prueba', 'CHOFER');

-- Configuración para Septiembre 2026 (Mes 9, Año 2026)
INSERT INTO public.monthly_configs (month, year, base_salary, viatics)
VALUES (9, 2026, 500000.00, 50000.00);

-- Crear algunos viajes para el chofer de prueba
INSERT INTO public.trips (driver_id, amount, destination, date)
VALUES
  ('22222222-2222-2222-2222-222222222222', 15000.00, 'Aeropuerto', '2026-09-01'),
  ('22222222-2222-2222-2222-222222222222', 25000.00, 'Centro', '2026-09-02');
