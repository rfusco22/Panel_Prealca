-- Viajes de materia prima: un chofer sale con una unidad a buscar piedra,
-- arena, cemento, etc. Estados: en_ruta -> recibido | cancelado.
-- Al recibir un viaje se crea la entrada en materia_prima (materia_prima_id).
-- La app crea la tabla sola (app/api/viajes-materia-prima/route.ts); este
-- script es para crearla a mano.

CREATE TABLE IF NOT EXISTS viajes_materia_prima (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATE NOT NULL,
  chofer_id BIGINT UNSIGNED NULL,
  unidad_id INT NULL,
  agregado_id INT NOT NULL,
  proveedor_id INT NULL,
  planta_id INT NULL,
  cantidad DECIMAL(12,2) NULL,
  unidad VARCHAR(20) NOT NULL DEFAULT 'M3',
  nro_guia_proveedor VARCHAR(100) NULL,
  hora_salida DATETIME NULL,
  hora_llegada DATETIME NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'en_ruta',
  observaciones TEXT NULL,
  materia_prima_id INT NULL,
  usuario_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_vmp_fecha (fecha),
  INDEX idx_vmp_chofer (chofer_id),
  INDEX idx_vmp_estado (estado)
);
