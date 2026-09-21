import { Paperclip } from 'lucide-react';

// Links para abrir los comprobantes de un ingreso o egreso.
//
// Cada link apunta a /api/comprobantes?id=, que devuelve el archivo solo si el
// rol puede leer ese tipo de registro. La lista trae los metadatos (id,
// nombre), nunca el archivo: así abrir la tabla no descarga todas las imágenes.
export function ComprobanteLinks({ comprobantes }: { comprobantes?: { id: number; nombre: string }[] }) {
  if (!comprobantes || comprobantes.length === 0) {
    return <span className="text-slate-400 text-xs">—</span>;
  }
  return (
    <div className="flex flex-col items-center gap-0.5">
      {comprobantes.map((c, i) => (
        <a
          key={c.id}
          href={`/api/comprobantes?id=${c.id}`}
          target="_blank"
          rel="noopener noreferrer"
          title={c.nombre}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
        >
          <Paperclip size={11} className="shrink-0" />
          {comprobantes.length > 1 ? `Ver ${i + 1}` : 'Ver'}
        </a>
      ))}
    </div>
  );
}
