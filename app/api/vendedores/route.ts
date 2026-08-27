import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { emitSocketEvent } from '@/lib/socket-server';
import { registrarLog, getUsuarioFromRequest, getClientIp } from '@/lib/audit-log';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const sql = `SELECT * FROM vendedores ORDER BY nombre ASC`;
    const resultados = await query(sql);
    return NextResponse.json({ success: true, vendedores: resultados }, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo vendedores:", error);
    return NextResponse.json({ error: 'Error interno al cargar los vendedores.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const data = await req.json();
    if (!data.nombre || !data.cedula || !data.telefono || !data.direccion) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios.' }, { status: 400 });
    }
    const sql = `INSERT INTO vendedores (nombre, cedula, telefono, direccion) VALUES (?, ?, ?, ?)`;
    const valores = [data.nombre, data.cedula, data.telefono, data.direccion];
    const resultado: any = await query(sql, valores);
    emitSocketEvent('vendedores:created');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'crear', modulo: 'Vendedores', entidad_id: resultado.insertId,
      descripcion: `Creó el vendedor "${data.nombre}" (Cédula: ${data.cedula})`,
      datos_nuevos: { nombre: data.nombre, cedula: data.cedula, telefono: data.telefono },
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ success: true, mensaje: 'Vendedor registrado correctamente.', insertId: resultado.insertId }, { status: 201 });
  } catch (error: any) {
    console.error("Error creando vendedor:", error);
    if (error.code === 'ER_DUP_ENTRY') return NextResponse.json({ error: 'Ya existe un vendedor con esta cédula.' }, { status: 409 });
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
