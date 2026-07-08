import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';

// GET: Obtener todos los productos con sus agregados (Fórmula)
export async function GET() {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    // 1. Obtener los productos básicos
    const productos: any = await query(`
      SELECT id, resistencia, pulgada, unidad 
      FROM productos 
      ORDER BY id DESC
    `);

    // 2. Para cada producto, buscar los agregados que componen su fórmula
    for (let i = 0; i < productos.length; i++) {
      const formula = await query(`
        SELECT 
          pf.agregado_id AS agregadoId,
          a.nombre,
          pf.cantidad,
          a.unidad_medida AS unidadMedida
        FROM producto_formulas pf
        INNER JOIN agregados a ON pf.agregado_id = a.id
        WHERE pf.producto_id = ?
      `, [productos[i].id]);
      
      productos[i].formula = formula;
    }

    return NextResponse.json(productos);
  } catch (error) {
    console.error('Error GET productos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST: Registrar un producto junto con su fórmula
export async function POST(request: Request) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { resistencia, pulgada, unidad, formula } = await request.json();

    if (!resistencia || !pulgada || !unidad) {
      return NextResponse.json({ error: 'Datos básicos obligatorios' }, { status: 400 });
    }

    // 1. Insertar el Producto
    const result: any = await query(`
      INSERT INTO productos (resistencia, pulgada, unidad) 
      VALUES (?, ?, ?)
    `, [resistencia, pulgada, unidad]);

    const productoId = result.insertId;

    // 2. Insertar los agregados de la fórmula si existen
    if (formula && formula.length > 0) {
      for (const item of formula) {
        await query(`
          INSERT INTO producto_formulas (producto_id, agregado_id, cantidad) 
          VALUES (?, ?, ?)
        `, [productoId, item.agregadoId, item.cantidad]);
      }
    }

    return NextResponse.json({ success: true, id: productoId });
  } catch (error) {
    console.error('Error POST productos:', error);
    return NextResponse.json({ error: 'Error registrando producto' }, { status: 500 });
  }
}

// PUT: Modificar un producto y reestructurar su fórmula
export async function PUT(request: Request) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id, resistencia, pulgada, unidad, formula } = await request.json();

    // 1. Actualizar datos básicos
    await query(`
      UPDATE productos 
      SET resistencia = ?, pulgada = ?, unidad = ?
      WHERE id = ?
    `, [resistencia, pulgada, unidad, id]);

    // 2. Limpiar la fórmula anterior para sobreescribirla de manera limpia
    await query('DELETE FROM producto_formulas WHERE producto_id = ?', [id]);

    // 3. Insertar la nueva composición de la fórmula
    if (formula && formula.length > 0) {
      for (const item of formula) {
        await query(`
          INSERT INTO producto_formulas (producto_id, agregado_id, cantidad) 
          VALUES (?, ?, ?)
        `, [id, item.agregadoId, item.cantidad]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error PUT productos:', error);
    return NextResponse.json({ error: 'Error actualizando producto' }, { status: 500 });
  }
}

// DELETE: Eliminar un producto (Por cascada borrará sus fórmulas asociadas)
export async function DELETE(request: Request) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    await query('DELETE FROM productos WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando producto:', error);
    return NextResponse.json({ error: 'Error eliminando producto' }, { status: 500 });
  }
}