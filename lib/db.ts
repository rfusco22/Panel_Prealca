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

const pool = mysql.createPool({
  host: requerido('DB_HOST'),
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: requerido('DB_USER'),
  password: requerido('DB_PASSWORD'),
  database: requerido('DB_NAME'),
  waitForConnections: true,
  connectionLimit: 10,
  idleTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export async function query(sql: string, params?: any[]) {
  const [results] = await pool.execute(sql, params);
  return results;
}
