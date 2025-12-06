-- Script de migración para agregar campos de nombre y apellidos a la tabla users
-- Fecha: 2025-11-18
-- Descripción: Agrega los campos nombre, apellido_paterno y apellido_materno según el DFR
-- Base de datos: PostgreSQL

-- Agregar las columnas nuevas (primero sin restricción NOT NULL)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS nombre VARCHAR(100),
ADD COLUMN IF NOT EXISTS apellido_paterno VARCHAR(100),
ADD COLUMN IF NOT EXISTS apellido_materno VARCHAR(100),
ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS losses INTEGER DEFAULT 0 NOT NULL;

-- Actualizar los usuarios existentes con valores por defecto
UPDATE users
SET nombre = 'Usuario',
    apellido_paterno = 'Genérico',
    apellido_materno = NULL
WHERE nombre IS NULL OR apellido_paterno IS NULL;

-- Hacer que nombre y apellido_paterno sean NOT NULL (después de tener datos)
ALTER TABLE users
ALTER COLUMN nombre SET NOT NULL,
ALTER COLUMN apellido_paterno SET NOT NULL;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Migración completada exitosamente';
END $$;

