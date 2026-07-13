import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * OBTENER TODOS LOS CLIENTES
 * Se utiliza para listar en la tabla y para llenar el selector (Select) en Ingresos
 */
export async function GET() {
  try {
    const sql = `SELECT * FROM clientes ORDER BY nombre ASC`;
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

/**
 * REGISTRAR UN NUEVO CLIENTE
 */
export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Validación de campos obligatorios en el servidor
    if (!data.nombre || !data.rif) {
      return NextResponse.json(
        { error: 'La Razón Social (Nombre) y el RIF/Cédula son campos obligatorios.' }, 
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO clientes (nombre, rif, telefono, direccion) 
      VALUES (?, ?, ?, ?)
    `;
    const valores = [
      data.nombre, 
      data.rif, 
      data.telefono || null, 
      data.direccion || null
    ];

    const resultado: any = await query(sql, valores);

    return NextResponse.json({ 
      success: true, 
      mensaje: 'Cliente registrado correctamente en el sistema.',
      insertId: resultado.insertId 
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error creando cliente:", error);
    
    // Captura el error de MySQL si el RIF ya existe (llave única duplicada)
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