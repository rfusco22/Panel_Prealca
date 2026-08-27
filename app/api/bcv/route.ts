import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  const auth = await requireAuth();
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