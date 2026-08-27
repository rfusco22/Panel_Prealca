-- Materia prima: registrar de qué planta del proveedor vino el material y con
-- qué chofer y unidad se despachó.
--
-- planta_id apunta a proveedor_plantas (creada en migracion_planta_saldo.sql),
-- que es la relación 1 a muchos real entre proveedor y sus plantas.
--
-- Las tres columnas son NULL: los registros anteriores no las tienen, y un
-- saldo inicial no involucra chofer ni unidad.
--
-- Es idempotente: se puede correr las veces que haga falta. Importa porque la
-- app también agrega estas columnas sola desde ensureColumns() en
-- app/api/materia-prima/route.ts, así que al correr esto a mano puede que las
-- columnas ya existan y falten solo los índices.

DROP PROCEDURE IF EXISTS migrar_materia_prima_planta_chofer_unidad;

DELIMITER $$

CREATE PROCEDURE migrar_materia_prima_planta_chofer_unidad()
BEGIN
  -- Columnas
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'materia_prima'
                   AND COLUMN_NAME = 'planta_id') THEN
    ALTER TABLE materia_prima ADD COLUMN planta_id INT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'materia_prima'
                   AND COLUMN_NAME = 'chofer_id') THEN
    ALTER TABLE materia_prima ADD COLUMN chofer_id INT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'materia_prima'
                   AND COLUMN_NAME = 'unidad_id') THEN
    ALTER TABLE materia_prima ADD COLUMN unidad_id INT NULL;
  END IF;

  -- Índices (los usa el JOIN del GET de /api/materia-prima)
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'materia_prima'
                   AND INDEX_NAME = 'idx_mp_planta') THEN
    CREATE INDEX idx_mp_planta ON materia_prima (planta_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'materia_prima'
                   AND INDEX_NAME = 'idx_mp_chofer') THEN
    CREATE INDEX idx_mp_chofer ON materia_prima (chofer_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'materia_prima'
                   AND INDEX_NAME = 'idx_mp_unidad') THEN
    CREATE INDEX idx_mp_unidad ON materia_prima (unidad_id);
  END IF;
END$$

DELIMITER ;

CALL migrar_materia_prima_planta_chofer_unidad();

DROP PROCEDURE migrar_materia_prima_planta_chofer_unidad;
