import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  const auth = await requireAuth(['admin']);
  if (auth.response) return auth.response;

  try {
    await query("ALTER TABLE users MODIFY COLUMN role ENUM('admin','registro','dosificador','gerencia') NOT NULL DEFAULT 'registro'");
    return Response.json({ success: true, message: 'ENUM de role actualizado correctamente. Ya puedes crear usuarios con rol gerencia.' });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
