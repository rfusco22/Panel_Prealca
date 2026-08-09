import { query } from '@/lib/db';
import { emitSocketEvent } from '@/lib/socket-server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';

interface AuditLogParams {
  usuario_id?: number | null;
  usuario_nombre?: string | null;
  usuario_email?: string | null;
  usuario_rol?: string | null;
  accion: 'crear' | 'editar' | 'eliminar';
  modulo: string;
  entidad_id?: number | null;
  descripcion?: string | null;
  datos_anteriores?: Record<string, any> | null;
  datos_nuevos?: Record<string, any> | null;
  ip_address?: string | null;
}

export async function registrarLog(params: AuditLogParams): Promise<void> {
  try {
    const sql = `
      INSERT INTO auditoria_log
        (usuario_id, usuario_nombre, usuario_email, usuario_rol, accion, modulo, entidad_id, descripcion, datos_anteriores, datos_nuevos, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const valores = [
      params.usuario_id || null,
      params.usuario_nombre || null,
      params.usuario_email || null,
      params.usuario_rol || null,
      params.accion,
      params.modulo,
      params.entidad_id || null,
      params.descripcion || null,
      params.datos_anteriores ? JSON.stringify(params.datos_anteriores) : null,
      params.datos_nuevos ? JSON.stringify(params.datos_nuevos) : null,
      params.ip_address || null,
    ];
    await query(sql, valores);
    emitSocketEvent('audit-log:created');
  } catch (error) {
    console.error('Error registrando auditoría:', error);
  }
}

export async function getUsuarioFromRequest(): Promise<{ id: number | null; nombre: string | null; email: string | null; rol: string | null }> {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return { id: null, nombre: null, email: null, rol: null };
    const users: any = await query('SELECT id, nombre, email, role FROM users WHERE id = ?', [session.userId]);
    if (users.length === 0) return { id: null, nombre: null, email: null, rol: null };
    const user = users[0];
    return { id: user.id, nombre: user.nombre, email: user.email, rol: user.role };
  } catch {
    return { id: null, nombre: null, email: null, rol: null };
  }
}

export function getClientIp(req: Request): string | null {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || null;
}
