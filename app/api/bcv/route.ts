import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';


// Restringido a admin, gerencia, registro: tasa de cambio oficial del BCV. Es informacion publica, pero igual
// se limita a los roles que la usan: el reporte de monedas y los formularios
// de ingreso, egreso y orden de compra.
//
// Antes era requireAuth() sin roles: cualquier usuario logueado lo podia
// leer escribiendo la URL. No expone montos -por eso quedo para el final-
// pero no hay motivo para dejarlo abierto a roles que no lo usan.
export async function GET() {
  const auth = await requireAuth(['admin', 'gerencia', 'registro']);
  if (auth.response) return auth.response;

  try {
    const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Error de conexión con API BCV: ${response.status}`);
    }

    const data = await response.json();
    const promedio = Number(data.promedio) || 0;

    return NextResponse.json({
      success: true,
      tasa: promedio,
      compra: Number(data.compra) || promedio,
      venta: Number(data.venta) || promedio,
      promedio,
      fechaActualizacion: data.fechaActualizacion || data.fecha_actualizacion,
    });

  } catch (error) {
    console.error("Error obteniendo tasa BCV:", error);

    return NextResponse.json({
      success: true,
      tasa: 36.52,
      compra: 36.52,
      venta: 36.52,
      promedio: 36.52,
      advertencia: 'API BCV caída, usando tasa manual'
    });
  }
}