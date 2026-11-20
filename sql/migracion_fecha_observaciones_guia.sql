-- Guías de despacho: fecha del despacho elegida por el usuario y observaciones.
--
-- Hasta ahora la fecha de una guía era created_at, el instante en que se
-- insertó la fila. En la planta no siempre se carga la guía el mismo día que
-- salió el camión: se cargan las de días anteriores, y con created_at todas
-- quedaban fechadas el día de la carga, tanto en el papel impreso como en los
-- reportes de M³ y de viajes.
--
--   fecha         DATE  -> el día del despacho, el que se imprime en la guía.
--                          Lo elige quien la emite y no puede ser futuro
--                          (se valida en la API con validarFechaNoFutura).
--   observaciones TEXT  -> texto libre que sale impreso en la celda de
--                          Observaciones, debajo de la coletilla fija
--                          (COVENIN 633 / ADITIVO WRDA 79 / FRACTIL 10%).
--
-- created_at NO se toca ni se rellena desde acá: sigue siendo el dato de
-- auditoría (cuándo se cargó al sistema), y las dos fechas ahora pueden ser
-- distintas a propósito. Las guías anteriores a esta migración quedan con
-- fecha NULL, y todo lo que consulta usa COALESCE(gd.fecha, gd.created_at),
-- así que siguen mostrando y contando exactamente lo mismo que antes.
--
-- Esto NO cambia el número de guía: el correlativo lo sigue asignando
-- siguienteNumeroGuia() en orden de carga (ver sql/migracion_numero_guia.sql y
-- sql/migracion_numero_guia_duplicados.sql). Una guía cargada hoy con fecha de
-- ayer recibe el número que sigue, no uno intercalado: los números ya
-- impresos no se reusan ni se renumeran.
--
-- Idempotente: se puede correr las veces que haga falta. La app también lo
-- aplica sola desde ensureColumns() en app/api/guia-despacho/route.ts.

DROP PROCEDURE IF EXISTS migrar_fecha_observaciones_guia;

DELIMITER $$

CREATE PROCEDURE migrar_fecha_observaciones_guia()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'guia_despacho'
                   AND COLUMN_NAME = 'fecha') THEN
    ALTER TABLE guia_despacho ADD COLUMN fecha DATE NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'guia_despacho'
                   AND COLUMN_NAME = 'observaciones') THEN
    ALTER TABLE guia_despacho ADD COLUMN observaciones TEXT NULL;
  END IF;

  -- Los reportes filtran y agrupan por COALESCE(fecha, created_at).
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'guia_despacho'
                   AND INDEX_NAME = 'idx_gd_fecha') THEN
    CREATE INDEX idx_gd_fecha ON guia_despacho (fecha);
  END IF;
END$$

DELIMITER ;

CALL migrar_fecha_observaciones_guia();

DROP PROCEDURE migrar_fecha_observaciones_guia;
