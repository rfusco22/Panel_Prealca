-- Sistema de Mantenimiento de Unidades
-- Tabla para registrar historial de mantenimiento por unidad

CREATE TABLE IF NOT EXISTS unidad_mantenimientos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  unidad_id INT NOT NULL,
  fecha DATE NOT NULL,
  tipo_mantenimiento ENUM('preventivo','correctivo','revision','reparacion','otro') DEFAULT 'preventivo',
  descripcion TEXT NOT NULL,
  km DECIMAL(10,2) NULL,
  costo DECIMAL(12,2) NULL,
  proximo_servicio_km DECIMAL(10,2) NULL,
  proximo_servicio_fecha DATE NULL,
  realizado_por VARCHAR(255) NULL,
  notas TEXT NULL,
  usuario_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_unidad (unidad_id),
  INDEX idx_fecha (fecha),
  FOREIGN KEY (unidad_id) REFERENCES unidades(id) ON DELETE CASCADE
);

-- Campos inteligentes en la tabla unidades
ALTER TABLE unidades ADD COLUMN km_actual DECIMAL(10,2) DEFAULT 0;
ALTER TABLE unidades ADD COLUMN ultimo_mantenimiento DATE NULL;
ALTER TABLE unidades ADD COLUMN proximo_mantenimiento DATE NULL;
ALTER TABLE unidades ADD COLUMN proximo_mantenimiento_km DECIMAL(10,2) NULL;

-- Doble moneda en mantenimientos (USD + Bs)
ALTER TABLE unidad_mantenimientos ADD COLUMN costo_usd DECIMAL(12,2) NULL;
ALTER TABLE unidad_mantenimientos ADD COLUMN tasa_bcv DECIMAL(10,4) NULL;
ALTER TABLE unidad_mantenimientos ADD COLUMN moneda ENUM('USD','BS') DEFAULT 'BS';