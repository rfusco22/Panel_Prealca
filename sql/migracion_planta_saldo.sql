-- Tabla de plantas por proveedor (1 a muchos)
CREATE TABLE IF NOT EXISTS proveedor_plantas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  proveedor_id INT UNSIGNED NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  INDEX idx_plantas_proveedor (proveedor_id)
);

-- Tabla de agregados por proveedor (muchos a muchos)
CREATE TABLE IF NOT EXISTS proveedor_agregados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  proveedor_id INT UNSIGNED NOT NULL,
  agregado_id INT UNSIGNED NOT NULL,
  UNIQUE KEY uk_proveedor_agregado (proveedor_id, agregado_id),
  INDEX idx_pa_proveedor (proveedor_id),
  INDEX idx_pa_agregado (agregado_id)
);
