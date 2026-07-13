import { NextResponse } from 'next/server';
import { MERCANTIL_CONFIG } from '@/lib/ApiBank/mercantil';

export async function GET() {
  try {
    // Usamos EXACTAMENTE el mismo payload que te dio éxito en Postman
    const payload = {
        merchantIdentify: {
            integratorId: 31,
            merchantId: 11103402,
            terminalId: "abcde"
        },
        clientIdentify: {
            ipAddress: "10.0.0.1",
            browserAgent: "Chrome 18.1.3",
            mobile: {
                manufacturer: "Samsung"
            }
        },
        transferSearch: {
            account: "N1IH8GqG9krQTx24fwpq27oSCleBHZ2uJbMFId4jc/s=",
            issuerCustomerId: "wu9E0a5j29KkwsqlGD8QJg==",
            trxDate: "2023-09-26",
            issuerBankId: 105,
            transactionType: 1,
            paymentReference: "00009384",
            amount: 1200.00
        }
    };

    const response = await fetch(MERCANTIL_CONFIG.transferSearch.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-IBM-Client-Id': MERCANTIL_CONFIG.transferSearch.clientId,
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    return NextResponse.json({
      success: true,
      mensaje: "Prueba desde Node.js imitando a Postman",
      respuesta_mercantil: { status: response.status, data }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}