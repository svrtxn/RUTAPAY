-- 1. Agregamos la columna phone
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE;

-- 2. Si tienes un usuario Admin existente que usa admin@rutapay.cl, puedes asignarle un teléfono dummy temporalmente
-- UPDATE public.users SET phone = '+56900000000' WHERE email = 'admin@rutapay.cl';
