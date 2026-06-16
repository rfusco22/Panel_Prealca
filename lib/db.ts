import mysql from 'mysql2/promise';

/**
 * Configuramos el pool de conexiones.
 * Al usar el objeto de configuración explícito, evitamos errores de 
 * acceso denegado por mala lectura de la URL de conexión.
 */
const pool = mysql.createPool({
  host: '66.45.253.54',
  user: 'prealcac_callidon',
  password: '19Ric19car2.',
  database: 'prealcac_panel',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/**
 * Función genérica para ejecutar consultas SQL.
 * @param sql - La sentencia SQL (ej: 'SELECT * FROM users WHERE id = ?')
 * @param params - Array de parámetros para evitar inyecciones SQL
 */
export async function query(sql: string, params?: any[]) {
  try {
    // Usamos execute para consultas preparadas (más seguro y rápido)
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Error al ejecutar consulta SQL:', error);
    throw error;
  }
}

// Exportamos el pool por si necesitas hacer transacciones complejas
export default pool;