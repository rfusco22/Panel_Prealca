-- Anulación de guías con aprobación de Gerencia.
--
-- Antes anular era un solo paso y lo hacía quien emitía la guía. Pasa a ser un
-- circuito de dos: en planta se SOLICITA la anulación con el motivo, y
-- Gerencia aprueba o rechaza. Gerencia también puede anular directo, que es la
-- misma decisión tomada por la misma persona.
--
-- Lo importante: una guía con anulación solicitada SIGUE VIGENTE. Sigue
-- contando en el inventario, en el acumulado del pedido y en los reportes.
-- Nada de la planta se mueve hasta que Gerencia aprueba; recién ahí se pone
-- anulada = 1 y la guía sale de todas las sumas (ver
-- sql/migracion_anular_guia.sql, que agregó esa columna y el motivo).
--
--   anulacion_estado         VARCHAR(20) -- 'solicitada' | 'anulada' | 'rechazada'; NULL = nunca se pidió
--   anulacion_solicitada_por INT         -- users.id de quien la pidió
--   anulacion_solicitada_at  DATETIME
--   anulacion_respuesta      VARCHAR(255)-- nota de Gerencia, sobre todo al rechazar
--   anulacion_respondida_por INT         -- users.id de quien decidió
--   anulacion_respondida_at  DATETIME
--
-- motivo_anulacion guarda el motivo de quien la solicitó (es el que cuenta qué
-- pasó con el camión); anulada_at / anulada_por quedan para el momento de la
-- anulación efectiva, o sea la aprobación.
--
-- Quién puede aprobar está en la app, no en la base: ROLES_QUE_ANULAN en
-- app/api/guia-despacho/route.ts, hoy solo 'gerencia'. A propósito no se usa
-- requireAuth(['gerencia']), que dejaría pasar también a admin por ser
-- superusuario.
--
-- Idempotente: se puede correr las veces que haga falta. La app también lo
-- aplica sola desde ensureColumns().

DROP PROCEDURE IF EXISTS migrar_anular_guia_aprobacion;

DELIMITER $$

CREATE PROCEDURE migrar_anular_guia_aprobacion()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'guia_despacho'
                   AND COLUMN_NAME = 'anulacion_estado') THEN
    ALTER TABLE guia_despacho ADD COLUMN anulacion_estado VARCHAR(20) NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'guia_despacho'
                   AND COLUMN_NAME = 'anulacion_solicitada_por') THEN
    ALTER TABLE guia_despacho ADD COLUMN anulacion_solicitada_por INT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'guia_despacho'
                   AND COLUMN_NAME = 'anulacion_solicitada_at') THEN
    ALTER TABLE guia_despacho ADD COLUMN anulacion_solicitada_at DATETIME NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'guia_despacho'
                   AND COLUMN_NAME = 'anulacion_respuesta') THEN
    ALTER TABLE guia_despacho ADD COLUMN anulacion_respuesta VARCHAR(255) NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'guia_despacho'
                   AND COLUMN_NAME = 'anulacion_respondida_por') THEN
    ALTER TABLE guia_despacho ADD COLUMN anulacion_respondida_por INT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'guia_despacho'
                   AND COLUMN_NAME = 'anulacion_respondida_at') THEN
    ALTER TABLE guia_despacho ADD COLUMN anulacion_respondida_at DATETIME NULL;
  END IF;

  -- Para listar rápido las que esperan aprobación.
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'guia_despacho'
                   AND INDEX_NAME = 'idx_gd_anulacion_estado') THEN
    CREATE INDEX idx_gd_anulacion_estado ON guia_despacho (anulacion_estado);
  END IF;

  -- Las guías anuladas con el esquema anterior (un solo paso) quedan con el
  -- estado que les corresponde en el nuevo.
  UPDATE guia_despacho SET anulacion_estado = 'anulada'
   WHERE COALESCE(anulada, 0) = 1 AND anulacion_estado IS NULL;
END$$

DELIMITER ;

CALL migrar_anular_guia_aprobacion();

DROP PROCEDURE migrar_anular_guia_aprobacion;
