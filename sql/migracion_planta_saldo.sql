-- Migración: Agregar campo planta a proveedores + tabla saldo_inicial
-- Ejecutar en la base de datos

-- 1. Agregar campo 'planta' a la tabla proveedores
ALTER TABLE proveedores ADD COLUMN planta VARCHAR(255) NULL AFTER direccion;

-- 2. Crear tabla saldo_inicial (sin FOREIGN KEY para evitar incompatibilidad de tipos)
CREATE TABLE IF NOT EXISTS saldo_inicial (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agregado_id INT UNSIGNED NOT NULL,
  cantidad DECIMAL(15, 2) NOT NULL DEFAULT 0,
  fecha DATE NOT NULL,
  usuario_id INT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_saldo_agregado (agregado_id)
);
