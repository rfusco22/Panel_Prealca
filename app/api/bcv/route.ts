import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Error de conexión con API BCV: ${response.status}`);
    }

    const data = await response.json();
    const tasaBcv = data.promedio;

    return NextResponse.json({ success: true, tasa: tasaBcv });

  } catch (error) {
    console.error("Error obteniendo tasa BCV:", error);

    return NextResponse.json({
      success: true,
      tasa: 36.52,
      advertencia: 'API BCV caída, usando tasa manual'
    });
  }
}