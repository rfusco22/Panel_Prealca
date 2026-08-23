-- Migración: Agregar campo planta a proveedores + tabla saldo_inicial
-- Ejecutar en la base de datos

-- 1. Agregar campo 'planta' a la tabla proveedores
ALTER TABLE proveedores ADD COLUMN planta VARCHAR(255) NULL AFTER direccion;

-- 2. Crear tabla saldo_inicial
CREATE TABLE IF NOT EXISTS saldo_inicial (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agregado_id INT NOT NULL,
  cantidad DECIMAL(15, 2) NOT NULL DEFAULT 0,
  fecha DATE NOT NULL,
  usuario_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agregado_id) REFERENCES agregados(id) ON DELETE CASCADE,
  INDEX idx_saldo_agregado (agregado_id)
);
