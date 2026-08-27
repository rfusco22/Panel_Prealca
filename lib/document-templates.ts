import { formatearFecha } from './fecha';
function formatDate(dateString: string) {
  if (!dateString) return "N/A"
  // Pasa por aFechaLocal: new Date('2026-08-26') se interpreta como medianoche
  // UTC y en UTC-4 imprimia el dia anterior en guias y facturas.
  return formatearFecha(dateString, "N/A")
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "VES",
  }).format(value)
}

function convertNumberToWords(num: number): string {
  const units = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"]
  const teens = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"]
  const tens = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"]
  const hundreds = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"]

  function convertGroup(n: number): string {
    let s = ""
    const h = Math.floor(n / 100)
    const t = Math.floor((n % 100) / 10)
    const u = n % 10
    if (h > 0) s += hundreds[h] + " "
    if (t === 1) s += teens[u]
    else if (t > 1) {
      s += tens[t]
      if (u > 0) s += " y " + units[u]
    } else if (u > 0) s += units[u]
    return s.trim()
  }

  if (num === 0) return "cero"
  let integerPart = Math.floor(num)
  const decimalPart = Math.round((num - integerPart) * 100)
  let words = ""

  if (integerPart >= 1000000000) {
    words += convertGroup(Math.floor(integerPart / 1000000000)) + " mil millones "
    integerPart %= 1000000000
  }
  if (integerPart >= 1000000) {
    const millions = Math.floor(integerPart / 1000000)
    words += (millions === 1 ? "un millón " : convertGroup(millions) + " millones ")
    integerPart %= 1000000
  }
  if (integerPart >= 1000) {
    const thousands = Math.floor(integerPart / 1000)
    words += (thousands === 1 ? "mil " : convertGroup(thousands) + " mil ")
    integerPart %= 1000
  }
  if (integerPart > 0) words += convertGroup(integerPart)
  words = words.trim()
  words += ` con ${decimalPart.toString().padStart(2, "0")}/100`
  return words.toUpperCase() + " BOLÍVARES"
}

function documentStyles() {
  return `
    body { font-family: 'Poppins', sans-serif; margin: 20px; color: #333; }
    .container { width: 100%; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0,0,0,0.05); }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .company-info img { max-width: 300px; height: auto; margin-bottom: 5px; }
    .company-info p, .address-info p { margin: 0; font-size: 0.8em; }
    h4 { text-align: center; margin-bottom: 10px; }
    .section-details p { margin: 0; font-size: 0.9em; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 0.9em; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; color: #000; font-weight: bold; }
    .totals-summary p { margin: 0; font-size: 0.9em; text-align: right; }
    .totals-summary .final-total { font-weight: bold; }
    @media print {
      body { margin: 0; }
      .container { border: none; box-shadow: none; }
    }
  `
}

function companyHeader() {
  return `
    <div class="header">
      <div class="company-info">
        <img src="/logo.jpeg" alt="Prealca Logo" style="max-width:150px;">
        <p>RIF.: J-30913171-0</p>
      </div>
      <div class="address-info">
        <p>Av. 2 parcela E-37, Zona Ind. Sta Cruz</p>
        <p>Estado Aragua</p>
        <p>Telf: 04128936930 / Roberto Quintero</p>
      </div>
    </div>
  `
}

export interface OrdenCompraPrintData {
  poNumber: string
  fecha: string
  tipo?: string
  proveedorNombre: string
  proveedorRif: string
  proveedorDireccion: string
  proveedorContacto: string
  proveedorTelefono: string
  items: Array<{
    nombreMaterial: string
    cantidad: number
    unidadMedida: string
    precioUnitario: number
    subtotalItem: number
  }>
  total: number
}

export function generateOrdenCompraHtml(data: OrdenCompraPrintData): string {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="border:1px solid #ddd;padding:8px;">${item.nombreMaterial}</td>
      <td style="border:1px solid #ddd;padding:8px;text-align:right;">${item.cantidad.toLocaleString("es-ES")}</td>
      <td style="border:1px solid #ddd;padding:8px;">${item.unidadMedida}</td>
      <td style="border:1px solid #ddd;padding:8px;text-align:right;">${formatCurrency(item.precioUnitario)}</td>
      <td style="border:1px solid #ddd;padding:8px;text-align:right;">${formatCurrency(item.subtotalItem)}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Orden de Compra ${data.poNumber}</title>
<style>${documentStyles()}</style></head>
<body>
<div class="container">
  ${companyHeader()}
  <h4>ORDEN DE COMPRA A PROVEEDOR: ${data.poNumber}</h4>
  <div style="display:flex;justify-content:space-between;margin-bottom:20px;">
    ${data.tipo ? `<p><strong>Tipo:</strong> ${data.tipo}</p>` : ''}
    <p style="text-align:right;">Fecha: ${formatDate(data.fecha)}</p>
  </div>
  <div class="section-details">
    <p><strong>Proveedor:</strong> ${data.proveedorNombre}</p>
    <p><strong>RIF:</strong> ${data.proveedorRif}</p>
    <p><strong>Dirección:</strong> ${data.proveedorDireccion}</p>
    <p><strong>CONTACTO:</strong> ${data.proveedorContacto}</p>
    <p><strong>TELF:</strong> ${data.proveedorTelefono}</p>
  </div>
  <table>
    <thead><tr>
      <th>Descripción</th>
      <th style="text-align:right;">Cantidad</th>
      <th style="text-align:left;">Unidad</th>
      <th style="text-align:right;">Precio Unitario</th>
      <th style="text-align:right;">Subtotal</th>
    </tr></thead>
    <tbody>${itemsHtml}</tbody>
  </table>
  <div class="totals-summary">
    <p class="final-total">TOTAL: ${formatCurrency(data.total)}</p>
  </div>
  <p style="text-align:left;margin-top:20px;font-size:0.9em;">Son: ${convertNumberToWords(data.total)}</p>
</div>
</body></html>`
}

export interface GuiaDespachoPrintData {
  guiaNumber: string
  fecha: string
  clienteNombre: string
  clienteRif: string
  clienteDireccion: string
  clienteTelefono?: string
  chofer: string
  placa: string
  vanM3?: number
  deM3?: number
  items: Array<{
    nombreProducto: string
    resistencia?: string
    pulgada?: string
    cantidad: number
    unidadMedida: string
    precioUnitario: number
    subtotalItem: number
  }>
  total: number
}

export function generateGuiaDespachoHtml(data: GuiaDespachoPrintData): string {
  const item = data.items[0] || { nombreProducto: '', cantidad: 0, unidadMedida: '', precioUnitario: 0, subtotalItem: 0 }
  const horaSalida = new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true })

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Guía de Despacho ${data.guiaNumber}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Poppins', sans-serif; background: #f0f0f0; display: flex; justify-content: center; padding: 20px; }
  .guia { width: 800px; background: #fff; border: 2px solid #1a5276; padding: 0; position: relative; }
  
  /* Header */
  .guia-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 15px 20px 10px; border-bottom: 2px solid #1a5276; }
  .guia-title { font-size: 28px; font-weight: 700; color: #1a5276; letter-spacing: 1px; }
  .guia-center { text-align: center; }
  .guia-center .subtitle { font-size: 14px; font-weight: 600; color: #333; text-transform: uppercase; letter-spacing: 2px; }
  .guia-center .guia-num { font-size: 16px; font-weight: 700; color: #c0392b; margin-top: 4px; }
  .guia-fechas { text-align: right; font-size: 11px; }
  .guia-fechas .fecha-box { border: 1px solid #999; padding: 3px 8px; margin-bottom: 3px; display: inline-block; }
  .guia-fechas .fecha-label { color: #666; font-weight: 600; }
  .guia-fechas .fecha-value { color: #333; font-weight: 400; }
  
  /* Cliente Section */
  .cliente-section { padding: 12px 20px; border-bottom: 1px solid #ccc; }
  .cliente-row { display: flex; gap: 10px; margin-bottom: 4px; font-size: 12px; }
  .cliente-row .label { font-weight: 600; color: #333; min-width: 80px; }
  .cliente-row .value { flex: 1; border-bottom: 1px solid #999; padding-bottom: 1px; color: #333; }
  
  /* Condiciones */
  .condiciones-row { display: flex; justify-content: space-between; padding: 8px 20px; border-bottom: 2px solid #1a5276; font-size: 12px; }
  .condiciones-row .label { font-weight: 600; }
  .condiciones-row .van { font-weight: 700; font-size: 14px; }
  
  /* Tabla */
  .guia-table { width: 100%; border-collapse: collapse; }
  .guia-table th { background: #e8e8e8; border: 1px solid #999; padding: 8px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #333; text-align: center; }
  .guia-table td { border: 1px solid #999; padding: 10px; font-size: 12px; color: #333; vertical-align: top; }
  .guia-table .col-cant { width: 10%; text-align: center; }
  .guia-table .col-resistencia { width: 20%; text-align: center; }
  .guia-table .col-asent { width: 10%; text-align: center; }
  .guia-table .col-obs { width: 60%; }
  .observaciones-cell { min-height: 80px; font-size: 12px; line-height: 1.6; }
  
  /* Adición agua */
  .agua-row { display: flex; justify-content: space-between; padding: 8px 20px; border-top: 1px solid #999; font-size: 11px; color: #555; }
  .agua-row span { border-bottom: 1px dotted #999; min-width: 80px; display: inline-block; margin: 0 4px; }
  
  /* Footer */
  .guia-footer { padding: 12px 20px; border-top: 1px solid #ccc; }
  .footer-row { display: flex; gap: 20px; margin-bottom: 6px; font-size: 11px; }
  .footer-row .label { font-weight: 600; color: #333; min-width: 60px; }
  .footer-row .value { border-bottom: 1px solid #999; flex: 1; padding-bottom: 1px; }
  .footer-row .field { flex: 1; }
  .footer-row .field .label { min-width: auto; }
  .footer-row .field .value { border-bottom: 1px solid #999; padding-bottom: 1px; }
  
  /* Firma */
  .firmas-section { display: flex; justify-content: space-between; padding: 15px 20px 10px; border-top: 1px solid #ccc; }
  .firma-box { text-align: center; width: 30%; }
  .firma-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; font-size: 10px; font-weight: 600; color: #333; }
  
  @media print {
    body { background: #fff; padding: 0; }
    .guia { border: 2px solid #000; width: 100%; }
  }
</style>
</head>
<body>
<div class="guia">
  <!-- Header -->
  <div class="guia-header">
    <div class="guia-title">CONCRETO PREMEZCLADO</div>
    <div class="guia-center">
      <div class="subtitle">Guía de Despacho</div>
      <div class="guia-num">Nº ${data.guiaNumber}</div>
    </div>
    <div class="guia-fechas">
      <div class="fecha-box">
        <span class="fecha-label">Fecha de Emisión:</span>
        <span class="fecha-value">${formatDate(data.fecha)}</span>
      </div>
      <br>
      <div class="fecha-box">
        <span class="fecha-label">Fecha de Vencimiento:</span>
        <span class="fecha-value">___/___/______</span>
      </div>
    </div>
  </div>
  
  <!-- Cliente -->
  <div class="cliente-section">
    <div class="cliente-row">
      <span class="label">Cliente:</span>
      <span class="value">${data.clienteNombre}</span>
      <span class="label" style="min-width:40px;">RIF:</span>
      <span class="value" style="max-width:150px;">${data.clienteRif}</span>
    </div>
    <div class="cliente-row">
      <span class="label">Dirección:</span>
      <span class="value">${data.clienteDireccion}</span>
    </div>
    <div class="cliente-row">
      <span class="label">Teléfono:</span>
      <span class="value">${data.clienteTelefono || ''}</span>
    </div>
  </div>
  
  <!-- Condiciones -->
  <div class="condiciones-row">
    <span class="label">CONDICIONES</span>
    <span class="van">VAN: ${data.vanM3 || 0} M³ DE ${data.deM3 ? data.deM3 : '<span style="border-bottom:1px solid #999;min-width:40px;display:inline-block;">&nbsp;&nbsp;&nbsp;&nbsp;</span>'} M³</span>
  </div>
  
  <!-- Tabla -->
  <table class="guia-table">
    <thead>
      <tr>
        <th class="col-cant">Cant.</th>
        <th class="col-resistencia">Resistencia (RC)</th>
        <th class="col-asent">Asent.</th>
        <th class="col-obs">Observaciones</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="col-cant">${item.cantidad}</td>
        <td class="col-resistencia" style="text-align:center;">${item.resistencia || ''}</td>
        <td class="col-asent" style="text-align:center;">${item.pulgada ? item.pulgada + '&quot;' : ''}</td>
        <td class="col-obs observaciones-cell">&nbsp;</td>
      </tr>
    </tbody>
  </table>
  
  <!-- Adición agua -->
  <div class="agua-row">
    <span>Adición de agua sugerido por el dueño <span>&nbsp;</span> litros</span>
    <span>/ Adición de agua sugerido por el cliente <span>&nbsp;</span> Litros.</span>
    <span>Firma:</span>
  </div>
  
  <!-- Footer -->
  <div class="guia-footer">
    <div class="footer-row">
      <span class="label">OBRA:</span>
      <span class="value"></span>
    </div>
    <div class="footer-row">
        <span class="label">CHOFER:</span>
        <span class="value" style="max-width:200px;">${data.chofer}</span>
        <span class="label" style="min-width:80px;">Hora salida:</span>
        <span class="value" style="max-width:80px;">${horaSalida}</span>
      <span class="label" style="min-width:80px;">Hora llegada:</span>
      <span class="value" style="max-width:80px;"></span>
    </div>
    <div class="footer-row">
      <span class="label">N° UNIDAD:</span>
      <span class="value" style="max-width:120px;">${data.placa}</span>
      <span class="label" style="min-width:60px;">NOMBRE:</span>
      <span class="value"></span>
    </div>
  </div>
  
  <!-- Firmas -->
  <div class="firmas-section">
    <div class="firma-box">
      <div class="firma-line">Recibido Por:</div>
    </div>
    <div class="firma-box">
      <div class="firma-line">Firma:</div>
    </div>
    <div class="firma-box">
      <div class="firma-line">Fecha / Hora:</div>
    </div>
  </div>
</div>
</body></html>`
}

export interface ServicioBombaPrintData {
  guiaNumber: string
  fecha: string
  clienteNombre: string
  clienteRif: string
  clienteDireccion: string
  clienteTelefono?: string
  operador: string
  unidad: string
  items: Array<{
    resistencia: string
    pulgada: string
    cantidad: number
  }>
}

export function generateServicioBombaHtml(data: ServicioBombaPrintData): string {
  const item = data.items[0] || { resistencia: '', pulgada: '', cantidad: 0 }

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Orden Servicio de Bomba ${data.guiaNumber}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Poppins', sans-serif; background: #f0f0f0; display: flex; justify-content: center; padding: 20px; }
  .guia { width: 800px; background: #fff; border: 2px solid #1a5276; padding: 0; }
  .guia-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 15px 20px 10px; border-bottom: 2px solid #1a5276; }
  .guia-center { text-align: center; }
  .guia-center .subtitle { font-size: 14px; font-weight: 600; color: #333; text-transform: uppercase; letter-spacing: 2px; }
  .guia-center .guia-num { font-size: 16px; font-weight: 700; color: #c0392b; margin-top: 4px; }
  .guia-fechas { text-align: right; font-size: 11px; }
  .guia-fechas .fecha-box { border: 1px solid #999; padding: 3px 8px; margin-bottom: 3px; display: inline-block; }
  .guia-fechas .fecha-label { color: #666; font-weight: 600; }
  .cliente-section { padding: 12px 20px; border-bottom: 1px solid #ccc; }
  .cliente-row { display: flex; gap: 10px; margin-bottom: 4px; font-size: 12px; }
  .cliente-row .label { font-weight: 600; color: #333; min-width: 80px; }
  .cliente-row .value { flex: 1; border-bottom: 1px solid #999; padding-bottom: 1px; color: #333; }
  .guia-table { width: 100%; border-collapse: collapse; }
  .guia-table th { background: #e8e8e8; border: 1px solid #999; padding: 8px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #333; text-align: center; }
  .guia-table td { border: 1px solid #999; padding: 10px; font-size: 12px; color: #333; vertical-align: top; text-align: center; }
  .footer-section { padding: 12px 20px; }
  .footer-row { display: flex; gap: 10px; margin-bottom: 6px; font-size: 11px; }
  .footer-row .label { font-weight: 600; color: #333; min-width: 80px; }
  .footer-row .value { border-bottom: 1px solid #999; flex: 1; padding-bottom: 1px; }
  @media print { body { background: #fff; padding: 0; } .guia { border: 2px solid #000; width: 100%; } }
</style>
</head>
<body>
<div class="guia">
  <div class="guia-header">
    <div class="flex items-start gap-3">
      <img src="/logo.jpeg" alt="Prealca" style="width:70px;height:auto;">
      <div style="font-size:9px;color:#555;line-height:1.4;">
        <p style="font-weight:700;">CALLE ZONA INDUSTRIAL, 2DA ETAPA, PARCELA</p>
        <p style="font-weight:700;">E-37 ZONA INDUSTRIAL SANTA CRUZ</p>
        <p>SANTA CRUZ DE ARAGUA - EDO. ARAGUA</p>
        <p>TELEFAX: (0243) 251.75.33</p>
        <p>TELÉFONOS: (0414) 454.00.42 (0412) 435.09.07</p>
        <p>0412 844.52.30</p>
      </div>
    </div>
    <div class="guia-center">
      <div class="subtitle">Orden Servicio de Bomba</div>
      <div class="guia-num">Nº ${data.guiaNumber}</div>
    </div>
    <div class="guia-fechas">
      <div class="fecha-box">
        <span class="fecha-label">Fecha de Emisión:</span> ${formatearFecha(new Date())}
      </div>
      <br>
      <div class="fecha-box">
        <span class="fecha-label">Fecha de Vencimiento:</span> ___/___/______
      </div>
    </div>
  </div>

  <div class="cliente-section">
    <div class="cliente-row">
      <span class="label">CLIENTE:</span>
      <span class="value">${data.clienteNombre}</span>
      <span class="label" style="min-width:50px;">R.I.F:</span>
      <span class="value" style="max-width:150px;">${data.clienteRif}</span>
    </div>
    <div class="cliente-row">
      <span class="label">DIRECCIÓN:</span>
      <span class="value">${data.clienteDireccion}</span>
    </div>
    <div class="cliente-row">
      <span class="label">TELÉFONOS:</span>
      <span class="value">${data.clienteTelefono || ''}</span>
      <span class="label" style="min-width:50px;">N.I.T:</span>
      <span class="value" style="max-width:120px;"></span>
      <span class="label" style="min-width:90px;">CONDICIONES:</span>
      <span class="value"></span>
    </div>
  </div>

  <table class="guia-table">
    <thead>
      <tr>
        <th>N° GUÍA</th>
        <th>RC</th>
        <th>CANT.</th>
        <th>N° GUÍA</th>
        <th>RC</th>
        <th>CANT.</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>&nbsp;</td>
        <td>${item.resistencia}</td>
        <td>${item.cantidad}</td>
        <td>&nbsp;</td>
        <td>&nbsp;</td>
        <td>&nbsp;</td>
      </tr>
      <tr>
        <td>&nbsp;</td>
        <td>&nbsp;</td>
        <td>&nbsp;</td>
        <td>&nbsp;</td>
        <td>&nbsp;</td>
        <td>&nbsp;</td>
      </tr>
    </tbody>
  </table>

  <div class="footer-section">
    <div class="footer-row">
      <span class="label">UNIDAD:</span>
      <span class="value" style="max-width:200px;">${data.unidad}</span>
      <span class="label" style="min-width:90px;">OPERADOR:</span>
      <span class="value">${data.operador}</span>
    </div>
    <div class="footer-row">
      <span class="label">Observaciones:</span>
      <span class="value"></span>
    </div>
    <div class="footer-row">
      <span class="label">NOMBRE:</span>
      <span class="value"></span>
    </div>
    <div class="footer-row">
      <span class="label">FECHA:</span>
      <span class="value"></span>
    </div>
    <div class="footer-row">
      <span class="label">HORA:</span>
      <span class="value"></span>
    </div>
    <div class="footer-row">
      <span class="label">CLIENTE:</span>
      <span class="value"></span>
    </div>
  </div>
</div>
</body></html>`
}

export interface PrealcaPrintData {
  guiaNumber: string
  fecha: string
  clienteNombre: string
  clienteRif: string
  clienteDireccion: string
  clienteTelefono?: string
  obra?: string
  chofer: string
  // La plantilla de Prealca no imprime la placa (solo el chofer), por eso es
  // opcional. Si algún día se quiere mostrar, hay que agregarla al HTML.
  placa?: string
  vanM3?: number
  deM3?: number
  items: Array<{
    resistencia: string
    pulgada: string
    cantidad: number
  }>
}

export function generatePrealcaHtml(data: PrealcaPrintData): string {
  const item = data.items[0] || { resistencia: '', pulgada: '', cantidad: 0 }
  const horaSalida = new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true })

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Guía de Despacho Prealca ${data.guiaNumber}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Poppins', sans-serif; background: #f0f0f0; display: flex; justify-content: center; padding: 20px; }
  .guia { width: 1050px; background: #fff; border: 2px solid #000; padding: 15px 20px; }
  @page { size: landscape; margin: 10mm; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 8px; border-bottom: 2px solid #000; margin-bottom: 8px; }
  .header-left { display: flex; align-items: flex-start; gap: 8px; }
  .header-left img { width: 110px; height: auto; }
  .company-info { font-size: 8px; line-height: 1.3; }
  .company-info .name { font-size: 9px; font-weight: 700; }
  .header-center { text-align: center; }
  .header-center .rif { font-size: 10px; font-weight: 600; }
  .header-center .title { font-size: 14px; font-weight: 700; }
  .header-center .guia-num { font-size: 26px; font-weight: 700; color: #c0392b; }
  .header-right { text-align: right; }
  .header-right .date-box { border: 1px solid #000; padding: 3px 10px; margin-bottom: 4px; font-size: 9px; }
  .header-right .date-box .label { font-weight: 700; }
  .cliente-section { font-size: 10px; margin-bottom: 6px; }
  .cliente-row { display: flex; align-items: center; gap: 4px; margin-bottom: 3px; }
  .cliente-row .label { font-weight: 700; min-width: 70px; }
  .cliente-row .value { flex: 1; border-bottom: 1px solid #000; }
  .cliente-row .short-value { border-bottom: 1px solid #000; }
  .condiciones-row { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 6px; padding: 2px 0; }
  .condiciones-row .label { font-weight: 700; }
  .condiciones-row .van { font-weight: 700; font-size: 12px; }
  .guia-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 10px; }
  .guia-table th { background: #333; border: 1px solid #000; padding: 4px 8px; font-weight: 700; color: #fff; text-align: center; }
  .guia-table td { border: 1px solid #000; padding: 8px; vertical-align: top; }
  .agua-row { font-size: 9px; margin-bottom: 6px; padding: 2px 0; }
  .footer-section { font-size: 10px; margin-bottom: 6px; }
  .footer-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
  .footer-row .label { font-weight: 700; }
  .footer-row .value { border-bottom: 1px solid #000; flex: 1; }
  .recibido-row { display: flex; justify-content: space-between; align-items: flex-start; border-top: 1px solid #000; padding-top: 6px; margin-bottom: 6px; font-size: 10px; }
  .recibido-label { font-weight: 700; }
  .recibido-fields { display: flex; gap: 20px; font-size: 9px; }
  .control-row { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #000; padding-top: 6px; font-size: 12px; }
  .control-row .control-num { font-weight: 700; color: #c0392b; font-size: 18px; }
  .control-row .legal { font-size: 9px; font-weight: 700; color: #c0392b; }
  @media print { body { background: #fff; padding: 0; } .guia { border: 2px solid #000; width: 100%; } }
</style>
</head>
<body>
<div class="guia">
  <div class="header">
    <div class="header-left">
      <img src="/logo.jpeg" alt="Prealca">
      <div class="company-info">
        <p class="name">PREALCA, C.A.</p>
        <p>CALLE ZONA INDUSTRIAL, 2da ETAPA, PARCELA E-37 ZONA INDUSTRIAL SANTA CRUZ</p>
        <p>SANTA CRUZ DE ARAGUA - EDO. ARAGUA</p>
        <p>TELF: (0243) 251.75.33 - 672.01.65 - (0412) 755.62.07 - (0424) 303.37.40</p>
      </div>
    </div>
    <div class="header-center">
      <div class="rif">R.I.F.: J-30913171-0</div>
      <div class="title">Guía de Despacho</div>
      <div class="guia-num">${data.guiaNumber}</div>
    </div>
    <div class="header-right">
      <div class="date-box">
        <div class="label">FECHA DE EMISIÓN</div>
        <div>${formatearFecha(new Date())}</div>
      </div>
      <div class="date-box">
        <div class="label">FECHA DE VENCIMIENTO</div>
        <div>___/___/______</div>
      </div>
    </div>
  </div>

  <div class="cliente-section">
    <div class="cliente-row">
      <span class="label">Cliente:</span>
      <span class="value">${data.clienteNombre}</span>
      <span class="label" style="margin-left:16px;">R.I.F.:</span>
      <span class="short-value" style="width:200px;">${data.clienteRif}</span>
    </div>
    <div class="cliente-row">
      <span class="label">Dirección:</span>
      <span class="value">${data.clienteDireccion}</span>
    </div>
    <div class="cliente-row">
      <span class="label">Teléfonos:</span>
      <span class="short-value" style="width:150px;">${data.clienteTelefono || ''}</span>
      <span class="label" style="margin-left:16px;">N.I.T.:</span>
      <span class="short-value" style="width:100px;"></span>
      <span class="label" style="margin-left:16px;">Condiciones:</span>
      <span class="short-value" style="width:80px;text-align:center;">Contado</span>
      <span class="label" style="margin-left:24px;">Van:</span>
      <span class="short-value" style="width:40px;text-align:center;font-weight:700;">${data.vanM3 || item.cantidad}</span>
      <span style="margin:0 2px;">M³de</span>
      <span class="short-value" style="width:40px;text-align:center;font-weight:700;">${data.deM3 || '___'}</span>
      <span>M³</span>
    </div>
  </div>

  <table class="guia-table">
    <thead>
      <tr>
        <th style="width:8%;">Cant.</th>
        <th style="width:22%;">Resistencia (RG)</th>
        <th style="width:10%;">ASENT.</th>
        <th>OBSERVACIONES</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="text-align:center;font-weight:700;font-size:14px;padding:12px 8px;">${item.cantidad}</td>
        <td style="text-align:center;font-weight:700;padding:12px 8px;">${item.resistencia || ''}${item.pulgada ? ' ' + item.pulgada + 'ST' : ''}</td>
        <td style="text-align:center;padding:12px 8px;">${item.pulgada ? item.pulgada + '&quot;' : ''}</td>
        <td style="font-size:9px;line-height:1.6;padding:10px;">
          <p>El Concreto suministrado cumple con la Norma COVENIN 633.</p>
          <p>Cualquier adición de agua va por cuenta y riesgo del Cliente.</p>
          <p style="font-weight:700;margin-top:4px;">ADITIVO WRDA 79</p>
          <p style="text-align:right;font-weight:700;margin-top:4px;">FRACTIL 10%</p>
        </td>
      </tr>
    </tbody>
  </table>

  <div class="agua-row">
    <span>Adición de Agua Sugerido por el Dueño _____ Litros / Adición de Agua Sugerido por el Cliente _____ Litros</span>
    <span style="float:right;">Firma ________________</span>
  </div>

  <div class="footer-section">
    <div class="footer-row">
      <span class="label">OBRA:</span>
      <span class="value">${data.obra || ''}</span>
    </div>
    <div class="footer-row">
      <span class="label">CHOFER:</span>
      <span class="value" style="max-width:250px;">${data.chofer}</span>
      <span class="label" style="margin-left:24px;">HORA DE SALIDA:</span>
      <span class="value" style="max-width:120px;font-weight:700;">${horaSalida}</span>
      <span class="label" style="margin-left:24px;">HORA DE LLEGADA:</span>
      <span class="value" style="max-width:120px;"></span>
    </div>
  </div>

  <div class="recibido-row">
    <span class="recibido-label">RECIBIDO POR:</span>
    <div class="recibido-fields">
      <span><strong>Nombre:</strong> ________________</span>
      <span><strong>Firma:</strong> ________________</span>
      <span><strong>Fecha:</strong> ________________</span>
      <span><strong>Hora:</strong> ________________</span>
    </div>
  </div>

  <div class="control-row">
    <div>
      <span style="font-weight:700;">N° DE CONTROL:</span>
      <span class="control-num">00-${data.guiaNumber}</span>
    </div>
    <span class="legal">ORIGINAL CLIENTE - SIN DERECHO A CREDITO FISCAL</span>
  </div>
</div>
</body></html>`
}

export interface FacturaPrintData {
  facturaNumber: string
  fecha: string
  vence?: string
  clienteNombre: string
  clienteRif: string
  clienteDireccion: string
  clienteTelefono?: string
  vendedor?: string
  formaPago: string
  nota?: string
  tasaBcv?: number
  retencionIva?: number
  porCobrar?: number
  transferencia?: number
  excento?: number
  baseImponible?: number
  totalIva?: number
  totalPagar?: number
  biIgtf?: number
  igtf3?: number
  totalPagarIgtf?: number
  items: Array<{
    codigo?: string
    descripcion: string
    cantidad: number
    precioUnitario: number
    subtotalItem: number
  }>
  total: number
  subtotalGeneral?: number
  ivaRetenido?: number
  esContribuyenteEspecial?: boolean
}

function formatBsValue(value: number): string {
  return value.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function generateFacturaHtml(data: FacturaPrintData): string {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #ddd;">${item.codigo || ''}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #ddd;">${item.descripcion}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #ddd;text-align:center;">${item.cantidad.toLocaleString("es-VE")}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #ddd;text-align:right;">${formatBsValue(item.precioUnitario)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #ddd;text-align:right;">${formatBsValue(item.subtotalItem)}</td>
    </tr>
  `).join('')

  const subtotal = data.subtotalGeneral ?? data.total
  const excento = data.excento ?? 0
  const baseImponible = data.baseImponible ?? subtotal
  const iva = data.totalIva ?? 0
  const totalPagar = data.totalPagar ?? (baseImponible + iva)
  const retIva = data.retencionIva ?? 0
  const porCobrar = data.porCobrar ?? totalPagar
  const transferencia = data.transferencia ?? 0
  const biIgtf = data.biIgtf ?? 0
  const igtf3 = data.igtf3 ?? 0
  const totalPagarIgtf = data.totalPagarIgtf ?? totalPagar

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Factura ${data.facturaNumber}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Poppins', sans-serif; background: #f0f0f0; display: flex; justify-content: center; padding: 20px; }
  .factura { width: 800px; background: #fff; padding: 40px; min-height: 1000px; }
  .top-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
  .top-left { display: flex; align-items: center; gap: 10px; }
  .top-left img { width: 80px; height: auto; }
  .top-left .company-name { font-size: 16px; font-weight: 700; color: #000; }
  .top-left .company-rif { font-size: 11px; color: #555; }
  .top-right { text-align: right; }
  .top-right .factura-num { font-size: 14px; font-weight: 700; color: #000; margin-bottom: 2px; }
  .top-right .factura-num span { font-weight: 400; font-size: 16px; }
  .top-right .fecha-line { font-size: 12px; color: #333; }
  .client-info { margin-bottom: 30px; }
  .client-info table { width: 100%; }
  .client-info td { padding: 2px 0; font-size: 13px; vertical-align: top; }
  .client-info td:first-child { font-weight: 700; width: 100px; color: #000; }
  .client-info td:last-child { color: #333; }
  .items-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
  .items-table th { background: #d9d9d9; padding: 8px; font-size: 12px; font-weight: 700; color: #000; border-bottom: 2px solid #999; }
  .items-table th:first-child { text-align: left; }
  .items-table th:nth-child(2) { text-align: left; }
  .items-table th:nth-child(3) { text-align: center; }
  .items-table th:nth-child(4) { text-align: right; }
  .items-table th:nth-child(5) { text-align: right; }
  .bottom-section { display: flex; gap: 0; border: 1px solid #333; margin-top: 40px; }
  .bottom-left { flex: 1; padding: 12px 16px; border-right: 1px solid #333; font-size: 12px; line-height: 2; }
  .bottom-left .nota-line { font-weight: 600; margin-bottom: 4px; }
  .bottom-left .detail-line { font-weight: 400; }
  .bottom-left .detail-line strong { font-weight: 600; }
  .bottom-right { width: 280px; padding: 0; }
  .bottom-right table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .bottom-right td { padding: 4px 10px; border-bottom: 1px solid #ddd; }
  .bottom-right td:first-child { font-weight: 600; text-align: left; }
  .bottom-right td:last-child { text-align: right; font-weight: 400; }
  .bottom-right tr:last-child td { border-bottom: none; }
  .bottom-right .total-row td { font-weight: 700; border-top: 2px solid #333; font-size: 13px; }
  @media print {
    body { margin: 0; background: #fff; padding: 0; }
    .factura { border: none; box-shadow: none; width: 100%; }
  }
</style>
</head>
<body>
<div class="factura">
  <div class="top-header">
    <div class="top-left">
      <img src="/logo.jpeg" alt="Prealca Logo">
      <div>
        <div class="company-name">PREALCA</div>
        <div class="company-rif">RIF.: J-30913171-0</div>
      </div>
    </div>
    <div class="top-right">
      <div class="factura-num">FACTURA <span>${data.facturaNumber}</span></div>
      <div class="fecha-line">Fecha: ${formatDate(data.fecha)}</div>
      ${data.vence ? `<div class="fecha-line">Vence: ${formatDate(data.vence)}</div>` : ''}
    </div>
  </div>

  <div class="client-info">
    <table>
      <tr><td>Cliente:</td><td>${data.clienteNombre}</td></tr>
      <tr><td>Dirección:</td><td>${data.clienteDireccion}</td></tr>
      <tr><td>Rif:</td><td>${data.clienteRif}</td></tr>
      ${data.vendedor ? `<tr><td>Vendedor:</td><td>${data.vendedor}</td></tr>` : ''}
    </table>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>Codigo</th>
        <th>Descripcion</th>
        <th>Cantidad</th>
        <th>Precio Unitario</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>

  <div class="bottom-section">
    <div class="bottom-left">
      <div class="nota-line">GUIA DE DESPACHO: ${data.nota ? 'GD-' + data.nota : ''}</div>
      <div class="detail-line"><strong>TASA OFICIAL (BCV)</strong> ${data.tasaBcv ? data.tasaBcv.toLocaleString("es-VE", { minimumFractionDigits: 4 }) : ''}</div>
      <div class="detail-line"><strong>FORMA DE PAGO:</strong> ${data.formaPago}</div>
      <div class="detail-line"><strong>RET. IVA</strong> Bs.${formatBsValue(retIva)}</div>
      <div class="detail-line"><strong>POR COBRAR</strong> Bs.${formatBsValue(porCobrar)}</div>
      <div class="detail-line"><strong>TRANSFERENCIA</strong> Bs.${formatBsValue(transferencia)}</div>
    </div>
    <div class="bottom-right">
      <table>
        <tr><td>SUB TOTAL</td><td>${formatBsValue(subtotal)}</td></tr>
        <tr><td>EXCENTO</td><td>${formatBsValue(excento)}</td></tr>
        <tr><td>BASE IMPONIBLE</td><td>${formatBsValue(baseImponible)}</td></tr>
        <tr><td>I.V.A. 16%</td><td>${formatBsValue(iva)}</td></tr>
        <tr class="total-row"><td>TOTAL A PAGAR</td><td>${formatBsValue(totalPagar)}</td></tr>
        <tr><td>B.I. IGTF</td><td>${formatBsValue(biIgtf)}</td></tr>
        <tr><td>IGTF 3%</td><td>${formatBsValue(igtf3)}</td></tr>
        <tr class="total-row"><td>TOTAL A PAGAR IGTF</td><td>${formatBsValue(totalPagarIgtf)}</td></tr>
      </table>
    </div>
  </div>
</div>
</body></html>`
}

export function printDocument(html: string) {
  const printWindow = window.open("", "_blank")
  if (!printWindow) {
    alert("No se pudo abrir la ventana de impresión. Permita pop-ups e intente de nuevo.")
    return
  }
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
}
