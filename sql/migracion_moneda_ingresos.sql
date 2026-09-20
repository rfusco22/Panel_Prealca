-- ingresos.moneda: en qué moneda entró realmente la plata.
--
-- El formulario de ingresos siempre tuvo un selector Bs / $ para el monto
-- (monedaEntrada), pero ese dato no se guardaba: se usaba solo para calcular
-- precioBs y precioDivisa, y después se descartaba. Como los dos montos se
-- guardan siempre (uno es la conversión del otro por la tasa), mirando la
-- tabla no había forma de saber en qué moneda se cobró.
--
-- Eso hacía imposible el reporte de comisiones de vendedores (issue #5): la
-- comisión se paga en la moneda del pago -si cobró en bolívares, se paga en
-- bolívares; si cobró en dólares, en dólares- y sin este dato no se puede
-- decidir en qué moneda expresarla, ni sumar comisiones sin mezclar monedas.
--
-- Se agrega ahora porque la tabla ingresos está vacía: no hay una sola fila
-- que migrar ni ningún valor histórico que adivinar. Más adelante habría que
-- inventar la moneda de los ingresos ya cargados.
--
-- Idempotente: se puede correr las veces que haga falta. La app también la
-- crea sola desde ensureColumns() en app/api/ingresos/route.ts.

SELECT IFNULL(DATABASE(), '(NINGUNA: entrá a la base antes de correr el script)') AS base_seleccionada;

SET @existe_columna = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ingresos'
    AND COLUMN_NAME = 'moneda'
);
SET @sql = IF(@existe_columna = 0,
  "ALTER TABLE ingresos ADD COLUMN moneda ENUM('BS','USD') NOT NULL DEFAULT 'BS'",
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Verificación: debería listar la columna con default 'BS'.
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ingresos' AND COLUMN_NAME = 'moneda';
