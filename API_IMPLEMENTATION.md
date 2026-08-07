# Implementación de APIs - PREALCA

Este documento describe cómo implementar las API routes necesarias para que la aplicación PREALCA funcione completamente.

## Estructura de Rutas API

```
/app/api/
├── auth/
│   └── [...auth]/route.ts           ✅ IMPLEMENTADA (Better Auth)
├── proveedores/
│   ├── route.ts                     (GET, POST)
│   └── [id]/route.ts                (GET, PUT, DELETE)
├── clientes/
│   ├── route.ts                     (GET, POST)
│   └── [id]/route.ts                (GET, PUT, DELETE)
├── bancos/
│   ├── route.ts                     (GET, POST)
│   └── [id]/route.ts                (GET, PUT, DELETE)
├── productos/
│   ├── route.ts                     (GET, POST)
│   └── [id]/route.ts                (GET, PUT, DELETE)
├── unidades/
│   ├── route.ts                     (GET, POST)
│   └── [id]/route.ts                (GET, PUT, DELETE)
├── ingresos/
│   ├── route.ts                     (GET, POST)
│   └── [id]/route.ts                (GET, PUT, DELETE)
├── egresos/
│   ├── route.ts                     (GET, POST)
│   └── [id]/route.ts                (GET, PUT, DELETE)
├── guias/
│   ├── route.ts                     (GET, POST)
│   └── [id]/route.ts                (GET, PUT, DELETE)
├── facturas/
│   ├── route.ts                     (GET, POST)
│   └── [id]/route.ts                (GET, PUT, DELETE)
├── retenciones/
│   ├── route.ts                     (GET, POST)
│   └── [id]/route.ts                (GET, PUT, DELETE)
├── conversion/route.ts              (GET - obtener tasa actual)
├── export/
│   ├── excel/route.ts               (POST - exportar a XLSX)
│   └── pdf/route.ts                 (POST - exportar a PDF)
```

## Ejemplo: API de Proveedores

### GET /api/proveedores
Obtiene la lista de proveedores

```typescript
// app/api/proveedores/route.ts
import { db } from '@/lib/db';
import { proveedores } from '@/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const data = await db.select().from(proveedores);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[v0] Error fetching proveedores:', error);
    return NextResponse.json({ error: 'Error al obtener proveedores' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const [result] = await db.insert(proveedores).values({
      nombre: body.nombre,
      rif: body.rif,
      direccion: body.direccion,
      clasificacionGasto: body.clasificacionGasto,
      esContribuyenteEspecial: body.esContribuyenteEspecial ?? false,
    });
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('[v0] Error creating proveedor:', error);
    return NextResponse.json({ error: 'Error al crear proveedor' }, { status: 500 });
  }
}
```

### GET /api/proveedores/[id]
Obtiene un proveedor específico

```typescript
// app/api/proveedores/[id]/route.ts
import { db } from '@/lib/db';
import { proveedores } from '@/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [data] = await db
      .select()
      .from(proveedores)
      .where(eq(proveedores.id, parseInt(params.id)));
    
    if (!data) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('[v0] Error fetching proveedor:', error);
    return NextResponse.json({ error: 'Error al obtener proveedor' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const [result] = await db
      .update(proveedores)
      .set(body)
      .where(eq(proveedores.id, parseInt(params.id)));
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('[v0] Error updating proveedor:', error);
    return NextResponse.json({ error: 'Error al actualizar proveedor' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db
      .delete(proveedores)
      .where(eq(proveedores.id, parseInt(params.id)));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Error deleting proveedor:', error);
    return NextResponse.json({ error: 'Error al eliminar proveedor' }, { status: 500 });
  }
}
```

## Validación de Datos

Todos los endpoints deben incluir validación con Zod:

```typescript
import { z } from 'zod';

const proveedorSchema = z.object({
  nombre: z.string().min(3),
  rif: z.string().min(6).unique(),
  direccion: z.string().optional(),
  clasificacionGasto: z.string().optional(),
  esContribuyenteEspecial: z.boolean().default(false),
});

// En el endpoint
const validatedData = proveedorSchema.parse(body);
```

## Autenticación

Todos los endpoints excepto `/api/auth` deben verificar la sesión del usuario:

```typescript
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Tu lógica aquí
  } catch (error) {
    // ...
  }
}
```

## Exportación a Excel

```typescript
// app/api/export/excel/route.ts
import { write, utils } from 'xlsx';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { data, fileName } = await request.json();
    
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Datos');
    
    const buffer = write(wb, { bookType: 'xlsx', type: 'buffer' });
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('[v0] Error exporting Excel:', error);
    return NextResponse.json({ error: 'Error al exportar' }, { status: 500 });
  }
}
```

## Exportación a PDF

```typescript
// app/api/export/pdf/route.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { title, data, columns } = await request.json();
    
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    
    autoTable(doc, {
      head: [columns],
      body: data,
      startY: 25,
    });
    
    const pdf = doc.output('arraybuffer');
    
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${title}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[v0] Error exporting PDF:', error);
    return NextResponse.json({ error: 'Error al exportar' }, { status: 500 });
  }
}
```

## Testing de APIs

Para probar los endpoints localmente:

```bash
# Obtener proveedores
curl http://localhost:3000/api/proveedores

# Crear proveedor
curl -X POST http://localhost:3000/api/proveedores \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Proveedor Test",
    "rif": "V-12345678",
    "direccion": "Calle Principal",
    "clasificacionGasto": "Mantenimiento",
    "esContribuyenteEspecial": false
  }'

# Obtener proveedor específico
curl http://localhost:3000/api/proveedores/1

# Actualizar
curl -X PUT http://localhost:3000/api/proveedores/1 \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Nuevo Nombre"}'

# Eliminar
curl -X DELETE http://localhost:3000/api/proveedores/1
```

## Patrones a Seguir

1. **Manejo de Errores**: Todos los endpoints deben tener try-catch
2. **Validación**: Usar Zod para validar entrada
3. **Autenticación**: Verificar sesión del usuario
4. **Logs**: Usar console.log con prefijo `[v0]` para debugging
5. **Códigos HTTP**: Usar códigos apropiados (200, 201, 400, 401, 404, 500)
6. **Respuestas**: Retornar JSON estructurado

## Próximas Implementaciones

- [ ] Implementar todos los endpoints CRUD
- [ ] Agregar paginación a listados
- [ ] Implementar búsqueda y filtros
- [ ] Agregar autorización por rol
- [ ] Rate limiting
- [ ] Caché en cliente con SWR
- [ ] Validación de RIF/Cédula únicos
- [ ] Transacciones para operaciones complejas
