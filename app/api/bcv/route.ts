import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Consultamos la API pública de PyDolarVenezuela (sin caché para probar)
    const response = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar?page=bcv', {
      cache: 'no-store' 
    });
    
    if (!response.ok) {
      throw new Error(`Error de conexión con API BCV: ${response.status}`);
    }

    const data = await response.json();
    const tasaBcv = data.monitors.bcv.price;

    return NextResponse.json({ success: true, tasa: tasaBcv });

  } catch (error) {
    console.error("Error obteniendo tasa BCV:", error);
    
    // TASA DE RESPALDO: Si la API pública se cae, usamos esta tasa por defecto 
    // para que el sistema siga funcionando y no muestre 0.
    return NextResponse.json({ 
      success: true, 
      tasa: 36.52, 
      advertencia: 'API BCV caída, usando tasa manual' 
    });
  }
}