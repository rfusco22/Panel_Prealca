function formatDate(dateString: string) {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  return date.toLocaleDateString("es-ES")
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
  chofer: string
  placa: string
  items: Array<{
    nombreProducto: string
    cantidad: number
    unidadMedida: string
    precioUnitario: number
    subtotalItem: number
  }>
  total: number
}

export function generateGuiaDespachoHtml(data: GuiaDespachoPrintData): string {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="border:1px solid #ddd;padding:8px;">${item.nombreProducto}</td>
      <td style="border:1px solid #ddd;padding:8px;text-align:right;">${item.cantidad.toLocaleString("es-ES")}</td>
      <td style="border:1px solid #ddd;padding:8px;">${item.unidadMedida}</td>
      <td style="border:1px solid #ddd;padding:8px;text-align:right;">${formatCurrency(item.precioUnitario)}</td>
      <td style="border:1px solid #ddd;padding:8px;text-align:right;">${formatCurrency(item.subtotalItem)}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Guía de Despacho ${data.guiaNumber}</title>
<style>${documentStyles()}</style></head>
<body>
<div class="container">
  ${companyHeader()}
  <h4>GUÍA DE DESPACHO: ${data.guiaNumber}</h4>
  <p style="text-align:right;margin-bottom:20px;">Fecha: ${formatDate(data.fecha)}</p>
  <div class="section-details">
    <p><strong>Cliente:</strong> ${data.clienteNombre}</p>
    <p><strong>RIF:</strong> ${data.clienteRif}</p>
    <p><strong>Dirección:</strong> ${data.clienteDireccion}</p>
    <p><strong>Chofer:</strong> ${data.chofer}</p>
    <p><strong>Vehículo:</strong> ${data.placa}</p>
  </div>
  <table>
    <thead><tr>
      <th>Producto</th>
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

export interface FacturaPrintData {
  facturaNumber: string
  fecha: string
  clienteNombre: string
  clienteRif: string
  clienteDireccion: string
  formaPago: string
  comprobanteRetencion: string
  items: Array<{
    descripcion: string
    cantidad: number
    precioUnitario: number
    subtotalItem: number
  }>
  total: number
}

export function generateFacturaHtml(data: FacturaPrintData): string {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="border:1px solid #ddd;padding:8px;">${item.descripcion}</td>
      <td style="border:1px solid #ddd;padding:8px;text-align:right;">${item.cantidad.toLocaleString("es-ES")}</td>
      <td style="border:1px solid #ddd;padding:8px;text-align:right;">${formatCurrency(item.precioUnitario)}</td>
      <td style="border:1px solid #ddd;padding:8px;text-align:right;">${formatCurrency(item.subtotalItem)}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Factura ${data.facturaNumber}</title>
<style>${documentStyles()}</style></head>
<body>
<div class="container">
  ${companyHeader()}
  <h4>FACTURA: ${data.facturaNumber}</h4>
  <p style="text-align:right;margin-bottom:20px;">Fecha: ${formatDate(data.fecha)}</p>
  <div class="section-details">
    <p><strong>Cliente:</strong> ${data.clienteNombre}</p>
    <p><strong>RIF:</strong> ${data.clienteRif}</p>
    <p><strong>Dirección:</strong> ${data.clienteDireccion}</p>
    <p><strong>Forma de Pago:</strong> ${data.formaPago}</p>
    ${data.comprobanteRetencion ? `<p><strong>Comprobante Retención:</strong> ${data.comprobanteRetencion}</p>` : ''}
  </div>
  <table>
    <thead><tr>
      <th>Descripción</th>
      <th style="text-align:right;">Cantidad</th>
      <th style="text-align:right;">Precio Unitario</th>
      <th style="text-align:right;">Total</th>
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
