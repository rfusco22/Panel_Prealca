import mysql from 'mysql2/promise';

// Todas las credenciales se leen del entorno (ver .env.example).
// No se dejan valores por defecto a propósito: si falta una variable la app
// falla al arrancar en vez de conectarse silenciosamente a otra base.
function requerido(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombre}. Revisá tu archivo .env (ver .env.example).`);
  }
  return valor;
}

// El pool se crea en la primera consulta, no al importar el módulo. Igual que
// con el secreto de sesión: `next build` evalúa cada ruta para recolectar page
// data, y crear el pool al importar hacía que el build exigiera las credenciales
// de la base, que no tiene por qué conocer.
let pool: mysql.Pool | null = null;

function obtenerPool(): mysql.Pool {
  if (pool) return pool;
  pool = mysql.createPool({
    host: requerido('DB_HOST'),
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: requerido('DB_USER'),
    password: requerido('DB_PASSWORD'),
    database: requerido('DB_NAME'),
    // Las fechas se devuelven como texto tal cual están en la tabla, sin
    // convertirlas a Date. Es la causa de raíz del corrimiento de un día:
    // las columnas de negocio son DATE (un día del calendario, sin hora), y
    // mysql2 las convertía a Date usando la zona del proceso Node. En el
    // contenedor esa zona es UTC, así que un 2026-08-26 salía como
    // 2026-08-26T00:00:00.000Z y el navegador, en UTC-4, lo mostraba como 25.
    // Con esto un DATE llega como '2026-08-26' y un DATETIME como
    // '2026-08-26 14:30:00'. Para formatearlas usar lib/fecha.ts.
    dateStrings: true,
    waitForConnections: true,
    connectionLimit: 10,
    idleTimeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });
  return pool;
}

export async function query(sql: string, params?: any[]) {
  const [results] = await obtenerPool().execute(sql, params);
  return results;
}

/** Valida que estén las variables de la base. Se llama al arrancar el servidor. */
export function verificarConfigDb(): void {
  requerido('DB_HOST');
  requerido('DB_USER');
  requerido('DB_PASSWORD');
  requerido('DB_NAME');
}
