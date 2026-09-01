-- Numeración de guías de despacho independiente del id de la tabla.
--
-- guia_despacho.id sigue siendo el PK real, tal cual: las guías ya guardadas
-- conservan su número actual (GD-{id}) para no invalidar documentos que ya
-- se imprimieron y entregaron. numero_guia es una numeración nueva y
-- separada que arranca en 1 para las guías que se creen de acá en adelante;
-- las guías viejas quedan con numero_guia NULL.
--
-- El contador vive en su propia tabla con AUTO_INCREMENT en vez de un
-- SELECT MAX()+1 manual: AUTO_INCREMENT ya resuelve la concurrencia (dos
-- guías creadas al mismo tiempo no pueden terminar con el mismo número), el
-- mismo mecanismo que ya usa toda la app para asignar ids.
--
-- Idempotente: se puede correr las veces que haga falta. La app también
-- aplica esto sola desde ensureColumns() en app/api/guia-despacho/route.ts.

DROP PROCEDURE IF EXISTS migrar_numero_guia;

DELIMITER $$

CREATE PROCEDURE migrar_numero_guia()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'guia_numero_secuencia') THEN
    CREATE TABLE guia_numero_secuencia (
      numero INT AUTO_INCREMENT PRIMARY KEY
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'guia_despacho'
                   AND COLUMN_NAME = 'numero_guia') THEN
    ALTER TABLE guia_despacho ADD COLUMN numero_guia INT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'guia_despacho'
                   AND INDEX_NAME = 'idx_gd_numero_guia') THEN
    CREATE INDEX idx_gd_numero_guia ON guia_despacho (numero_guia);
  END IF;
END$$

DELIMITER ;

CALL migrar_numero_guia();

DROP PROCEDURE migrar_numero_guia;
