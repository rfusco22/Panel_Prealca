import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '@/schema';

// Configurar la conexión a MySQL
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL no está configurada');
}

// Crear el pool de conexiones
const connection = mysql.createPool({
  connectionLimit: 10,
  uri: connectionString,
});

// Crear instancia de Drizzle ORM
export const db = drizzle(connection, { schema });

export default db;
