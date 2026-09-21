-- Tabla comprobantes: los comprobantes de pago de ingresos y egresos.
--
-- Hasta ahora los formularios de ingreso y egreso obligaban a adjuntar un
-- comprobante, pero el servidor lo descartaba: no había dónde guardarlo. La
-- prueba del pago se perdía en cada alta.
--
-- Se guardan en la base (y no en disco) para que queden en el mismo respaldo
-- que el resto de los datos y protegidos por los mismos permisos por rol. Van
-- en una tabla aparte, no como columna de ingresos o egresos, para que los
-- listados no descarguen los archivos: se leen solo cuando alguien abre uno.
--
-- No lleva clave foránea porque un comprobante puede ser de un ingreso o de un
-- egreso (lo dice la columna tipo), y MySQL no permite una FK a dos tablas.
--
-- No hace falta correr este script: la app crea la tabla sola la primera vez
-- que se usa (ensureTablaComprobantes en lib/comprobantes.ts). Queda como
-- registro, o para crearla a mano. Es seguro correrlo más de una vez.
--
-- No usa information_schema: en el hosting el usuario de MySQL no tiene
-- permiso para leerla (error #1044).

CREATE TABLE IF NOT EXISTS comprobantes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo ENUM('ingreso','egreso') NOT NULL,
  registro_id INT NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  mime VARCHAR(100) NOT NULL,
  tamano INT NOT NULL,
  datos MEDIUMBLOB NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_comprobantes_registro (tipo, registro_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Verificación.
SHOW COLUMNS FROM comprobantes;
