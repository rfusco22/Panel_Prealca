import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const logs = await query(`
      SELECT
        al.id,
        al.usuario_id AS usuarioId,
        al.usuario_nombre AS usuarioNombre,
        al.usuario_email AS usuarioEmail,
        al.usuario_rol AS usuarioRol,
        al.accion,
        al.modulo,
        al.entidad_id AS entidadId,
        al.descripcion,
        al.datos_anteriores AS datosAnteriores,
        al.datos_nuevos AS datosNuevos,
        al.ip_address AS ipAddress,
        al.created_at AS createdAt
      FROM auditoria_log al
      ORDER BY al.created_at DESC
      LIMIT 500
    `);
    return NextResponse.json({ success: true, logs }, { status: 200 });
  } catch (error) {
    console.error('Error obteniendo logs de auditoría:', error);
    return NextResponse.json({ error: 'Error al cargar logs de auditoría' }, { status: 500 });
  }
}
