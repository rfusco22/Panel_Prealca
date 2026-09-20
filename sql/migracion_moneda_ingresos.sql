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
-- Este script es una sola sentencia a propósito, sin chequeos contra
-- information_schema: en el hosting el usuario de MySQL no tiene permiso para
-- leer esa base (error #1044). No hay relleno de datos que se pueda saltear,
-- así que si la columna ya existe alcanza con ignorar el error.
--
-- Si al correrlo sale "#1060 - Duplicate column name 'moneda'", ya está
-- aplicada y no hay nada que hacer. La app también la crea sola desde
-- ensureColumns() en app/api/ingresos/route.ts.

ALTER TABLE ingresos ADD COLUMN moneda ENUM('BS','USD') NOT NULL DEFAULT 'BS';

-- Verificación. SHOW COLUMNS no necesita permisos sobre information_schema.
SHOW COLUMNS FROM ingresos LIKE 'moneda';
