import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { emitSocketEvent } from '@/lib/socket-server';
import { registrarLog, getUsuarioFromRequest, getClientIp } from '@/lib/audit-log';

export async function GET() {
  try {
    const sql = `
      SELECT mp.*, a.nombre AS agregado_nombre, a.unidad_medida,
             pv.nombre AS proveedor_nombre, pv.planta AS proveedor_planta
      FROM materia_prima mp
      JOIN agregados a ON mp.agregado_id = a.id
      LEFT JOIN proveedores pv ON mp.proveedor_id = pv.id
      ORDER BY mp.id DESC
    `;
    const resultados = await query(sql);
    return NextResponse.json({ success: true, materiaPrima: resultados }, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo materia prima:", error);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const sql = `INSERT INTO materia_prima (agregado_id, cantidad, unidad, fecha, proveedor_id, usuario_id) VALUES (?, ?, ?, ?, ?, ?)`;
    const valores = [data.agregado_id, parseFloat(data.cantidad), data.unidad || 'M3', data.fecha, data.proveedor_id, data.usuario_id || 1];
    const resultado: any = await query(sql, valores);
    emitSocketEvent('materia-prima:created');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'crear', modulo: 'Materia Prima', entidad_id: resultado.insertId,
      descripcion: `Registró materia prima: ${data.cantidad} ${data.unidad || 'M3'}`,
      datos_nuevos: { agregado_id: data.agregado_id, cantidad: data.cantidad, unidad: data.unidad, proveedor_id: data.proveedor_id },
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ success: true, mensaje: 'Materia prima registrada correctamente.', insertId: resultado.insertId }, { status: 201 });
  } catch (error: any) {
    console.error("Error registrando materia prima:", error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
