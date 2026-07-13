import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyTransfer } from '@/lib/ApiBank/mercantil';

export async function GET() {
  try {
    // Consultamos todos los egresos ordenados por los más recientes
    const sql = `SELECT * FROM egresos ORDER BY id DESC`;
    const resultados = await query(sql);

    // Devolvemos los datos en formato JSON bajo la propiedad "egresos"
    return NextResponse.json({ success: true, egresos: resultados }, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo egresos:", error);
    return NextResponse.json({ error: 'Error interno al cargar los egresos.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // OPCIONAL: Verificar el egreso en el banco si es desde Mercantil
    if (data.banco === 'Mercantil' && data.verificarConBanco) {
        // En egresos, la cuenta "destino" es la del proveedor que recibe el dinero
        const bankResponse = await verifyTransfer(data.referencia, data.cuentaProveedor, data.montoBs);
        
        if (bankResponse.status !== 200) {
            return NextResponse.json({ 
              error: 'No se encontró la referencia del egreso en el banco.', 
              details: bankResponse.data 
            }, { status: 400 });
        }
    }

    // 1. Convertir los datos extra (camión, litros, precio unitario, etc.) a un string JSON 
    // para guardarlo en la columna JSON/Text de MySQL
    const detalleExtraJson = data.detalleExtra ? JSON.stringify(data.detalleExtra) : null;

    // 2. Preparar los valores para la consulta SQL
    const sql = `
      INSERT INTO egresos (
        banco, nombreProveedor, rif, clasificacionGasto, subCategoria, 
        detalleExtra, descripcion, montoBs, montoDivisa, tasaCambio, 
        referencia, fecha
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // 3. Manejar la fecha (si el frontend no envía, usamos la actual)
    const fechaEgreso = data.fecha ? new Date(data.fecha) : new Date();

    const valores = [
      data.banco,
      data.nombreProveedor,
      data.rif,
      data.clasificacionGasto,
      data.subCategoria,
      detalleExtraJson,
      data.descripcion || null,
      parseFloat(data.montoBs),
      parseFloat(data.montoDivisa),
      parseFloat(data.tasaCambio), // Tasa del momento del registro
      data.referencia,
      fechaEgreso
    ];

    // 4. Ejecutar inserción en MySQL
    const resultado: any = await query(sql, valores);

    return NextResponse.json({ 
      success: true, 
      mensaje: 'Egreso registrado correctamente.',
      insertId: resultado.insertId 
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error registrando egreso:", error);

    // Controlar errores de registros duplicados en MySQL (código 1062 = ER_DUP_ENTRY)
    if (error.code === 'ER_DUP_ENTRY') {
        return NextResponse.json({ error: 'La referencia de este egreso ya está registrada.' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}