// lib/ApiBank/mercantil.ts
import crypto from 'crypto';

export const MERCANTIL_CONFIG = {
  ted: {
    merchantId: "11103402",
    clientId: "81188330-c768-46fe-a378-ff3ac9e88824",
    encryptionKey: "0011103402J000000405660872000000000000",
  },
  transferSearch: {
    merchantId: 11103402,
    clientId: "17ebe62df9a1ca008b912ddd92f3d486",
    encryptionKey: "0011103402J000000405660872000000000000",
    url: "https://apimbu.mercantilbanco.com/mercantil-banco/sandbox/v1/payment/transfer-search"
  },
  mobilePaymentSearch: {
    merchantId: 200284,
    clientId: "81188330-c768-46fe-a378-ff3ac9e88824",
    encryptionKey: "A11103402525120190822HB01",
    url: "https://apimbu.mercantilbanco.com/mercantil-banco/sandbox/v1/mobile-payment/search"
  }
};

/**
 * Encriptación Mercantil: AES-256-ECB con ajuste automático de llave (Padding a 32 bytes)
 */
function encryptData(text: string, key: string): string {
  try {
    // Magia aquí: Creamos un buffer vacío de exactamente 32 bytes (lleno de nulos)
    const secureKey = Buffer.alloc(32);
    // Escribimos la llave dentro. Si sobra espacio, quedan nulos. Si es muy larga, se recorta sola.
    secureKey.write(key, 'utf8'); 
    
    const cipher = crypto.createCipheriv('aes-256-ecb', secureKey, null);
    
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    return encrypted;
  } catch (error: any) {
    console.error("Error cifrando datos para Mercantil:", error);
    // En lugar de un mensaje genérico, enviamos el error real para saber qué pasa
    throw new Error(error.message); 
  }
}

export async function verifyTransfer(referencia: string, cuentaDestino: string, monto: number, cedulaEmisor: string) {
  // Encriptamos la cuenta destino y la cédula usando el MD5 que ya corregimos
  const encryptedAccount = encryptData(cuentaDestino, MERCANTIL_CONFIG.transferSearch.encryptionKey);
  const encryptedCustomerId = encryptData(cedulaEmisor, MERCANTIL_CONFIG.transferSearch.encryptionKey);

  const payload = {
      merchantIdentify: {
          integratorId: 31,
          merchantId: MERCANTIL_CONFIG.transferSearch.merchantId, // 11103402
          terminalId: "abcde" // Ajustado al ejemplo del manual
      },
      clientIdentify: {
          ipAddress: "10.0.0.1", // A mayúscula, tal como el ejemplo
          browserAgent: "Chrome 114.0.0",
          mobile: {
              manufacturer: "Samsung"
          }
      },
      transferSearch: {
          account: encryptedAccount,
          issuerCustomerId: encryptedCustomerId, // Agregado y encriptado
          trxDate: new Date().toISOString().split('T')[0], // Formato "YYYY-MM-DD"
          issuerBankId: 105, // ID estandarizado en el ejemplo
          transactionType: 1, // ID estandarizado en el ejemplo
          paymentReference: referencia, // Nombre de variable corregido
          amount: monto
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
  return { status: response.status, data };
}

/**
 * Búsqueda de Pago Móvil (Sandbox)
 */
export async function verifyMobilePayment(referencia: string, telefonoDestino: string, monto: number, cedula: string) {
  const encryptedPhone = encryptData(telefonoDestino, MERCANTIL_CONFIG.mobilePaymentSearch.encryptionKey);

  const payload = {
    merchant_identify: {
        integratorId: 31,
        merchantId: MERCANTIL_CONFIG.mobilePaymentSearch.merchantId,
        terminalId: "1"
    },
    client_identify: {
        ipaddress: "10.0.0.1",
        browser_agent: "Chrome 114.0.0",
        mobile: { manufacturer: "Generico" }
    },
    transaction: {
        trx_type: "compra",
        payment_method: "pago movil",
        mobile_network: "Digitel", 
        phone_number: encryptedPhone,
        id_number: cedula,
        amount: monto,
        reference: referencia
    }
  };

  const response = await fetch(MERCANTIL_CONFIG.mobilePaymentSearch.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-IBM-Client-Id': MERCANTIL_CONFIG.mobilePaymentSearch.clientId,
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  return { status: response.status, data };
}