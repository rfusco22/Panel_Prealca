import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// OBTENER TODOS LOS VENDEDORES (Para el Select)
export async function GET() {
  try {
    const sql = `SELECT * FROM vendedores ORDER BY nombre ASC`;
    const resultados = await query(sql);
    return NextResponse.json({ success: true, vendedores: resultados }, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo vendedores:", error);
    return NextResponse.json({ error: 'Error interno al cargar los vendedores.' }, { status: 500 });
  }
}

// CREAR NUEVO VENDEDOR
export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!data.nombre || !data.cedula || !data.telefono || !data.direccion) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios.' }, { status: 400 });
    }

    const sql = `
      INSERT INTO vendedores (nombre, cedula, telefono, direccion) 
      VALUES (?, ?, ?, ?)
    `;
    const valores = [data.nombre, data.cedula, data.telefono, data.direccion];

    const resultado: any = await query(sql, valores);

    return NextResponse.json({ 
      success: true, 
      mensaje: 'Vendedor registrado correctamente.',
      insertId: resultado.insertId 
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error creando vendedor:", error);
    if (error.code === 'ER_DUP_ENTRY') {
        return NextResponse.json({ error: 'Ya existe un vendedor con esta cédula.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}