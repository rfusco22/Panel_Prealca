import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { emitSocketEvent } from '@/lib/socket-server';

export async function GET() {
  try {
    const sql = `
      SELECT id, nombre, rif, direccion,
             clasificacion_gasto AS clasificacionGasto,
             es_contribuyente_especial AS esContribuyenteEspecial
      FROM proveedores
      ORDER BY nombre ASC
    `;
    const proveedores = await query(sql);

    return NextResponse.json({ success: true, proveedores }, { status: 200 });
  } catch (error) {
    console.error('Error obteniendo proveedores:', error);
    return NextResponse.json(
      { error: 'Error interno al cargar la lista de proveedores.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!data.nombre || !data.rif) {
      return NextResponse.json(
        { error: 'El Nombre y el RIF son campos obligatorios.' },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO proveedores (nombre, rif, direccion, clasificacion_gasto, es_contribuyente_especial)
      VALUES (?, ?, ?, ?, ?)
    `;
    const valores = [
      data.nombre,
      data.rif,
      data.direccion || null,
      data.clasificacionGasto || null,
      data.esContribuyenteEspecial ? 1 : 0,
    ];

    const resultado: any = await query(sql, valores);

    emitSocketEvent('proveedores:created');

    return NextResponse.json({
      success: true,
      mensaje: 'Proveedor registrado correctamente.',
      insertId: resultado.insertId,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creando proveedor:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Ya existe un proveedor registrado con este RIF.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor al procesar el registro.' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const { id } = data;

    if (!id) {
      return NextResponse.json(
        { error: 'ID es requerido.' },
        { status: 400 }
      );
    }

    const sql = `
      UPDATE proveedores
      SET nombre = ?, rif = ?, direccion = ?, clasificacion_gasto = ?, es_contribuyente_especial = ?
      WHERE id = ?
    `;
    const valores = [
      data.nombre,
      data.rif,
      data.direccion || null,
      data.clasificacionGasto || null,
      data.esContribuyenteEspecial ? 1 : 0,
      id,
    ];

    await query(sql, valores);

    emitSocketEvent('proveedores:updated');

    return NextResponse.json({
      success: true,
      mensaje: 'Proveedor actualizado correctamente.',
    });

  } catch (error: any) {
    console.error('Error actualizando proveedor:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Ya existe un proveedor registrado con este RIF.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor al actualizar el proveedor.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID es requerido.' },
        { status: 400 }
      );
    }

    await query('DELETE FROM proveedores WHERE id = ?', [id]);

    emitSocketEvent('proveedores:deleted');

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error eliminando proveedor:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al eliminar el proveedor.' },
      { status: 500 }
    );
  }
}
