import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

// POST, no GET: esto muta el esquema (ALTER TABLE). Un GET se dispara con una
// simple navegacion -- con sameSite:lax alcanza un link malicioso para que el
// navegador de un admin logueado lo ejecute sin que se de cuenta.
export async function POST() {
  const auth = await requireAuth(['admin']);
  if (auth.response) return auth.response;

  try {
    await query("ALTER TABLE users MODIFY COLUMN role ENUM('admin','registro','dosificador','gerencia','seguridad-vial') NOT NULL DEFAULT 'registro'");
    return Response.json({ success: true, message: 'ENUM de role actualizado correctamente. Ya puedes crear usuarios con rol seguridad-vial.' });
  } catch (error: any) {
    console.error('Error actualizando ENUM de role:', error);
    return Response.json({ success: false, error: 'Error al aplicar la migración.' }, { status: 500 });
  }
}
