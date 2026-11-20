-- Anular una guía de despacho en vez de borrarla.
--
-- El caso real que la pidió: el camión se accidentó en el camino, la guía ya
-- estaba impresa y había que rehacer el despacho con otro chofer y otra
-- unidad. Borrar la fila también devuelve el inventario -- el stock se calcula
-- sumando las guías contra las entradas de materia prima, no con un contador
-- aparte, así que al desaparecer la fila el material vuelve solo -- pero se
-- lleva puesto el papel: queda un número de guía emitido del que no hay
-- ningún rastro en el sistema, y nada explica por qué falta.
--
-- Anular deja la guía donde está, con su número, marcada y con el motivo, y la
-- saca de todas las sumas. Ese es el reverso que hacía falta.
--
--   anulada          TINYINT(1) NOT NULL DEFAULT 0
--   motivo_anulacion VARCHAR(255) -- obligatorio al anular, lo valida la API
--   anulada_at       DATETIME
--   anulada_por      INT          -- users.id, sin FK (igual que usuario_id)
--
-- Todo lo que suma guías pasa a filtrar COALESCE(gd.anulada, 0) = 0:
-- stock y fórmulas, validación de stock al crear, acumulado y estado de los
-- pedidos, alertas, reportes de M³/clientes/resistencia/viajes, histórico de
-- viajes y estado de cuenta del cliente. Las guías anteriores quedan con
-- anulada = 0, o sea vigentes, que es lo que ya eran.
--
-- El número de guía anulada NO se reusa y las demás no se renumeran: ese papel
-- existe y tiene ese número. La guía que se emite para rehacer el despacho
-- lleva el número que sigue, como cualquier otra.
--
-- Idempotente: se puede correr las veces que haga falta. La app también lo
-- aplica sola desde ensureColumns() en app/api/guia-despacho/route.ts.

DROP PROCEDURE IF EXISTS migrar_anular_guia;

DELIMITER $$

CREATE PROCEDURE migrar_anular_guia()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'guia_despacho'
                   AND COLUMN_NAME = 'anulada') THEN
    ALTER TABLE guia_despacho ADD COLUMN anulada TINYINT(1) NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'guia_despacho'
                   AND COLUMN_NAME = 'motivo_anulacion') THEN
    ALTER TABLE guia_despacho ADD COLUMN motivo_anulacion VARCHAR(255) NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'guia_despacho'
                   AND COLUMN_NAME = 'anulada_at') THEN
    ALTER TABLE guia_despacho ADD COLUMN anulada_at DATETIME NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'guia_despacho'
                   AND COLUMN_NAME = 'anulada_por') THEN
    ALTER TABLE guia_despacho ADD COLUMN anulada_por INT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'guia_despacho'
                   AND INDEX_NAME = 'idx_gd_anulada') THEN
    CREATE INDEX idx_gd_anulada ON guia_despacho (anulada);
  END IF;
END$$

DELIMITER ;

CALL migrar_anular_guia();

DROP PROCEDURE migrar_anular_guia;
