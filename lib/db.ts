// lib/db.ts
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: '66.45.253.54',
  user: 'prealcac_callidon',
  password: '19Ric19car2.',
  database: 'prealcac_panel',
});

// Función única para consultas
export async function query(sql: string, params?: any[]) {
  const [results] = await pool.execute(sql, params);
  return results;
}