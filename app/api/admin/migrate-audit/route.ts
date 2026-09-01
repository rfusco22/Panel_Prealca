import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

// POST, no GET: esto muta el esquema (CREATE TABLE). Un GET se dispara con
// una simple navegacion -- con sameSite:lax alcanza un link malicioso para
// que el navegador de un admin logueado lo ejecute sin que se de cuenta.
export async function POST() {
  const auth = await requireAuth(['admin']);
  if (auth.response) return auth.response;

  try {
    await query(`
      CREATE TABLE IF NOT EXISTS auditoria_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NULL,
        usuario_nombre VARCHAR(255) NULL,
        usuario_email VARCHAR(255) NULL,
        usuario_rol VARCHAR(50) NULL,
        accion ENUM('crear','editar','eliminar') NOT NULL,
        modulo VARCHAR(100) NOT NULL,
        entidad_id INT NULL,
        descripcion TEXT NULL,
        datos_anteriores JSON NULL,
        datos_nuevos JSON NULL,
        ip_address VARCHAR(45) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_modulo (modulo),
        INDEX idx_usuario (usuario_id),
        INDEX idx_accion (accion),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    return Response.json({ success: true, message: 'Tabla auditoria_log creada correctamente.' });
  } catch (error: any) {
    console.error('Error creando tabla auditoria_log:', error);
    return Response.json({ success: false, error: 'Error al aplicar la migración.' }, { status: 500 });
  }
}
