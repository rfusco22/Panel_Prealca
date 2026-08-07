import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { emitSocketEvent } from '@/lib/socket-server';

export async function GET() {
  try {
    const sql = `SELECT id, nombre, rif, direccion, telefono, vendedor, es_contribuyente_especial AS esContribuyenteEspecial FROM clientes ORDER BY nombre ASC`;
    const resultados = await query(sql);
    return NextResponse.json({ success: true, clientes: resultados }, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo clientes:", error);
    return NextResponse.json(
      { error: 'Error interno al cargar la lista de clientes.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!data.nombre || !data.rif || !data.telefono || !data.direccion || !data.vendedor) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios.' },
        { status: 400 }
      );
    }
    const sql = `
      INSERT INTO clientes (nombre, rif, telefono, direccion, vendedor, es_contribuyente_especial)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const valores = [
      data.nombre,
      data.rif,
      data.telefono,
      data.direccion,
      data.vendedor,
      data.esContribuyenteEspecial ? 1 : 0,
    ];
    const resultado: any = await query(sql, valores);
    emitSocketEvent('clientes:created');
    return NextResponse.json({
      success: true,
      mensaje: 'Cliente registrado correctamente en el sistema.',
      insertId: resultado.insertId
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error creando cliente:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Ya existe una empresa o cliente registrado con este RIF/Cédula.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Error interno del servidor al procesar el registro.' },
      { status: 500 }
    );
  }
}
