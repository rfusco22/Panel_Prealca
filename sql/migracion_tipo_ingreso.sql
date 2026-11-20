-- Ingresos: si el cobro es de concreto Premezclado o de Prealca.
--
-- Es la misma división que ya tienen las guías de despacho
-- (guia_despacho.tipo), pero los ingresos no están atados a una guía: se
-- cargan por banco y referencia bancaria, sin vínculo con el despacho. Por eso
-- el tipo lo elige quien registra el ingreso, y no se puede deducir solo.
--
--   tipo ENUM('PREMEZCLADO','PREALCA') NULL
--
-- Admite NULL a propósito: los ingresos cargados antes de esta columna no
-- tienen con qué completarse. Adivinarles un tipo sería meter plata en una
-- categoría que nadie eligió, así que quedan en NULL y en el reporte salen
-- como "—". Si hace falta clasificarlos, se hace a mano con un UPDATE por
-- referencia bancaria, sabiendo cuál es cuál:
--
--   UPDATE ingresos SET tipo = 'PREALCA' WHERE referencia IN ('...', '...');
--   UPDATE ingresos SET tipo = 'PREMEZCLADO' WHERE referencia IN ('...');
--
-- Para los ingresos NUEVOS el tipo es obligatorio: lo exige el formulario y
-- lo rechaza la API (400) si no viene. El NULL es solo para lo ya cargado.
--
-- El reporte de Ingresos muestra la columna Tipo y tiene pestañas
-- Todos / Premezclado / Prealca que filtran el detalle.
--
-- Idempotente: se puede correr las veces que haga falta. La app también lo
-- aplica sola desde ensureColumns() en app/api/ingresos/route.ts.

DROP PROCEDURE IF EXISTS migrar_tipo_ingreso;

DELIMITER $$

CREATE PROCEDURE migrar_tipo_ingreso()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'ingresos'
                   AND COLUMN_NAME = 'tipo') THEN
    ALTER TABLE ingresos ADD COLUMN tipo ENUM('PREMEZCLADO','PREALCA') NULL;
  END IF;
END$$

DELIMITER ;

CALL migrar_tipo_ingreso();

DROP PROCEDURE migrar_tipo_ingreso;
