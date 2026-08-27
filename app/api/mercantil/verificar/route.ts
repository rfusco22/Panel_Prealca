import { NextResponse } from 'next/server';
import { verifyTransfer, verifyMobilePayment } from '@/lib/ApiBank/mercantil';
import { requireAuth } from '@/lib/auth-guard';

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const { metodoPago, referencia, monto, cedula, telefono } = body;

    // 🚨 BYPASS PARA DESARROLLO 🚨
    // Si escribes "0000" como referencia en tu formulario, Next.js simulará 
    // que Mercantil respondió "200 OK". Así puedes probar tu base de datos MySQL.
    if (referencia === "0000") {
      return NextResponse.json({
        success: true,
        respuesta_mercantil: { status: 200, data: "Simulación exitosa para pruebas de BD" }
      });
    }

    let resultado;

    if (metodoPago === 'TRANSFERENCIA') {
      resultado = await verifyTransfer(referencia, "01050000000000000000", parseFloat(monto), cedula || "V12345678");
    } else {
      resultado = await verifyMobilePayment(referencia, telefono || "04141234567", parseFloat(monto), cedula || "V12345678");
    }

    return NextResponse.json({
      success: true,
      respuesta_mercantil: resultado
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}