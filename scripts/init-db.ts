import { db } from '../lib/db';
import { users } from '../schema';
import * as bcrypt from 'bcryptjs';

async function initDatabase() {
  try {
    console.log('[v0] Iniciando BD...');

    // Crear usuarios de prueba
    const adminPassword = await bcrypt.hash('password123', 10);
    const registroPassword = await bcrypt.hash('password123', 10);
    const documentadorPassword = await bcrypt.hash('password123', 10);

    console.log('[v0] Creando usuarios de prueba...');

    // Admin
    await db.insert(users).values({
      email: 'admin@prealca.com',
      passwordHash: adminPassword,
      nombre: 'Lic. Roberto',
      role: 'admin',
      estado: 'activo',
    }).catch(() => console.log('[v0] Usuario admin ya existe'));

    // Registro
    await db.insert(users).values({
      email: 'cris@prealca.com',
      passwordHash: registroPassword,
      nombre: 'Cris',
      role: 'registro',
      estado: 'activo',
    }).catch(() => console.log('[v0] Usuario registro ya existe'));

    // Documentador
    await db.insert(users).values({
      email: 'andry@prealca.com',
      passwordHash: documentadorPassword,
      nombre: 'Ing. Andry',
      role: 'documentador',
      estado: 'activo',
    }).catch(() => console.log('[v0] Usuario documentador ya existe'));

    console.log('[v0] Base de datos inicializada correctamente');
    process.exit(0);
  } catch (error) {
    console.error('[v0] Error inicializando BD:', error);
    process.exit(1);
  }
}

initDatabase();
