import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || '66.45.253.54',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'prealcac_panel',
  password: process.env.DB_PASSWORD || 'GEhKYatVdCaVav+8',
  database: process.env.DB_NAME || 'prealcac_panel',
});

export async function query(sql: string, params?: any[]) {
  const [results] = await pool.execute(sql, params);
  return results;
}