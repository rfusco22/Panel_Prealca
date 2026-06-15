# Configuración de PREALCA - Sistema de Gestión Empresarial

## Requisitos Previos

- Node.js 18+
- MySQL Server 5.7+ ejecutándose localmente o en servidor remoto
- pnpm (gestor de paquetes recomendado)

## Pasos de Configuración

### 1. Configurar Variables de Entorno

Copia el archivo `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Luego edita `.env.local` con tus credenciales de MySQL:

```env
DATABASE_URL=mysql://usuario:contraseña@localhost:3306/prealca
BETTER_AUTH_SECRET=your-secret-key-generate-with-openssl-rand-base64-32
BETTER_AUTH_URL=http://localhost:3000
```

### 2. Generar BETTER_AUTH_SECRET

```bash
openssl rand -base64 32
```

Copia el resultado y pégalo en la variable `BETTER_AUTH_SECRET` de `.env.local`.

### 3. Crear Base de Datos MySQL

Conecta a tu servidor MySQL y ejecuta:

```sql
CREATE DATABASE prealca;
```

### 4. Ejecutar Migraciones

Este proyecto usa Drizzle ORM. Para aplicar el schema, necesitarás ejecutar las migraciones:

```bash
pnpm drizzle-kit generate:mysql
pnpm drizzle-kit push:mysql
```

O si prefieres crear la BD manualmente, ejecuta el SQL en `schema.sql` (si está disponible).

### 5. Inicializar Usuarios de Demostración

```bash
pnpm ts-node scripts/init-db.ts
```

Esto creará tres usuarios de demostración:

| Usuario | Email | Contraseña | Rol |
|---------|-------|-----------|-----|
| Lic. Roberto | admin@prealca.com | password123 | Admin |
| Cris | cris@prealca.com | password123 | Registro |
| Ing. Andry | andry@prealca.com | password123 | Documentador |

### 6. Instalar Dependencias

```bash
pnpm install
```

### 7. Ejecutar la Aplicación en Desarrollo

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Estructura del Proyecto

```
/app
  /(admin)          - Rutas protegidas para Administrador
  /(registro)       - Rutas protegidas para Registro
  /(documentador)   - Rutas protegidas para Documentador
  /(auth)           - Rutas de autenticación (login)
  /api              - API routes

/components
  /auth             - Componentes de autenticación
  /layout           - Componentes de layout
  /forms            - Formularios para CRUD
  /tables           - Componentes de tablas
  /ui               - Componentes shadcn/ui

/lib
  auth.ts           - Configuración de Better Auth
  db.ts             - Conexión a MySQL
  currency.ts       - Utilidades de conversión de monedas

/hooks
  useAuth.ts        - Hook para obtener sesión y user info

/schema.ts          - Schema de Drizzle ORM (tablas y relaciones)
```

## Flujos de Aplicación

### Login
```
Usuario → Email/Contraseña → Better Auth valida → Redirige al dashboard según rol
```

### Dashboards por Rol

**Admin (Lic. Roberto)**
- Gestionar Bancos, Productos, Unidades
- Crear Retenciones de Impuestos
- Ver configuración y tasas de cambio
- Acceso a reportes

**Registro (Cris)**
- Crear/Editar Proveedores y Clientes
- Registrar Bancos
- Registrar Ingresos y Egresos
- Crear Facturas
- Vincular Ingresos a Facturas (Contado)

**Documentador (Ing. Andry)**
- Crear Guías de Despacho
- Consultar productos y clientes
- Sin acceso a finanzas ni gestión administrativa

## Características Principales

### 1. Autenticación Segura
- Password hashing con bcryptjs
- Sessions con Better Auth
- Protección de rutas por rol

### 2. Conversión de Monedas
- API en tiempo real (exchangerate-api.com u open.er-api.com)
- Caché diario en BD
- Cálculo automático de Bs a $ en formularios

### 3. Cálculo de IVA
- 16% aplicable según checkbox
- Cálculo automático en Ingresos, Guías, Facturas
- Retención del 75% del IVA para contribuyentes especiales

### 4. Validaciones
- RIF único por Proveedor/Cliente
- Número de cuenta único por Banco
- Guías solo tipo "Prealca" para facturas
- Campos dinámicos según tipo de gasto

### 5. Exportación (Próximamente)
- Excel (XLSX) con formato
- PDF con encabezados profesionales
- Incluye tasa de cambio en fecha

## Conexión a MySQL Remota

Si tu MySQL está en un servidor remoto, usa el formato:

```
DATABASE_URL=mysql://usuario:contraseña@servidor.com:3306/prealca
```

## Troubleshooting

### Error: "DATABASE_URL no está configurada"
- Verifica que `.env.local` existe y tiene la variable `DATABASE_URL` correctamente formada

### Error: "Can't connect to MySQL"
- Verifica que el servidor MySQL está ejecutándose
- Verifica las credenciales de usuario/contraseña
- Verifica el host y puerto

### Error: "Tables not found"
- Ejecuta las migraciones: `pnpm drizzle-kit push:mysql`

### Login no funciona
- Verifica que los usuarios fueron creados: `pnpm ts-node scripts/init-db.ts`
- Verifica que `BETTER_AUTH_SECRET` está configurado

## Próximas Fases

- [ ] Fase 2: Módulos de Catálogos Maestros (CRUD completo)
- [ ] Fase 3: Módulo Banco (Ingresos/Egresos)
- [ ] Fase 4: Módulo Ventas (Guías/Facturas)
- [ ] Fase 5: Reportes y Exportación (Excel/PDF)

## Contacto y Soporte

Para consultas técnicas o reportar bugs, contacta al equipo de desarrollo.
