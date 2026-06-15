# Sistema de Gestión PREALCA

Aplicación web empresarial para automatizar procesos de la empresa PREALCA, incluyendo gestión de proveedores, clientes, bancos, ingresos, egresos, guías de despacho, facturas y retenciones de impuestos.

## Características Principales

### Autenticación y Seguridad
- Login seguro con Better Auth + MySQL
- Three roles with dashboard redirection:
  - **Admin**: Gestión de maestros, bancos, retenciones, reportes
  - **Registro**: Registro de proveedores, clientes, ingresos, egresos, facturas
  - **Documentador**: Creación de guías de despacho
- Middleware de protección por rol
- Hashing seguro de contraseñas con bcryptjs

### Catálogos Maestros
- Gestión de Proveedores (RIF único)
- Gestión de Clientes (RIF único)
- Gestión de Bancos con cuentas
- Gestión de Productos (Prealca, Premezclado)
- Gestión de Unidades de Transporte (Camiones, volquetas, etc)

### Módulo Banco
- **Ingresos**: Registrar ingresos bancarios con conversión automática de moneda
- **Egresos**: Registrar gastos con clasificación dinámica
- Cálculo automático de IVA 16%
- Conversión Bs ↔ $ en tiempo real

### Módulo Ventas
- **Guías de Despacho**: Crear guías con volumen y peso
- **Facturas**: Tres tipos (Prealca, Premezclado, Servicio)
- Vinculación automática entre documentos
- Cálculo automático de IVA

### Retenciones
- Retención del 75% de IVA para contribuyentes especiales
- Vinculación automática con facturas
- Cálculo automático

### Reportes y Exportación
- Reportes de Ingresos, Egresos, Ventas, Retenciones
- Exportación a Excel (XLSX) y PDF
- Utilidades reutilizables para reportes

## Tech Stack

- **Frontend**: Next.js 16 + React 19 + Tailwind CSS v4
- **Backend**: Next.js API Routes
- **Auth**: Better Auth
- **Database**: MySQL + Drizzle ORM
- **Validation**: Zod + react-hook-form
- **Export**: XLSX + jsPDF
- **Currency**: Axios para API de tasas de cambio
- **Icons**: lucide-react

## Estructura del Proyecto

```
app/
  ├── (auth)/login/                 # Página de login
  ├── (admin)/                       # Dashboard Admin
  │   ├── bancos/                   # Gestión de bancos
  │   ├── productos/                # Gestión de productos
  │   ├── unidades/                 # Gestión de unidades
  │   ├── retenciones/              # Gestión de retenciones
  │   ├── reportes/                 # Reportes y estadísticas
  │   └── settings/                 # Configuración de tasas
  ├── (registro)/                    # Dashboard Registro
  │   ├── proveedores/              # Gestión de proveedores
  │   ├── clientes/                 # Gestión de clientes
  │   ├── ingresos/                 # Ingresos bancarios
  │   ├── egresos/                  # Egresos/gastos
  │   └── facturas/                 # Facturas
  └── (documentador)/                # Dashboard Documentador
      └── guia-despacho/            # Guías de despacho

components/
  ├── auth/
  │   └── login-form.tsx
  ├── layout/
  │   └── navbar.tsx
  ├── forms/                        # 10+ formularios CRUD
  └── tables/                       # 10+ tablas responsivas

lib/
  ├── auth.ts                       # Configuración Better Auth
  ├── db.ts                         # Conexión MySQL
  ├── currency.ts                   # Conversión de monedas
  └── export.ts                     # Utilidades de exportación

schema.ts                           # Drizzle ORM schema

middleware.ts                       # Protección de rutas por rol

scripts/
  └── init-db.ts                    # Script de inicialización
```

## Instalación y Configuración

### 1. Requisitos Previos
- Node.js 18+
- MySQL 8.0+
- pnpm (gestor de paquetes)

### 2. Configuración de MySQL

```bash
# Crear base de datos
mysql -u root -p
CREATE DATABASE prealca;
CREATE USER 'prealca'@'localhost' IDENTIFIED BY 'tu_contraseña';
GRANT ALL PRIVILEGES ON prealca.* TO 'prealca'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Variables de Entorno

Copia `.env.example` a `.env.local` y configura:

```env
# MySQL
DB_HOST=localhost
DB_USER=prealca
DB_PASSWORD=tu_contraseña
DB_NAME=prealca

# Better Auth
BETTER_AUTH_SECRET=tu_secret_key_de_32_caracteres

# Currency API (opcional, para tasa de cambio)
EXCHANGE_RATE_API_KEY=tu_api_key
EXCHANGE_RATE_API_URL=https://api.example.com/rates
```

Genera BETTER_AUTH_SECRET:
```bash
openssl rand -base64 32
```

### 4. Instalación de Dependencias

```bash
cd /vercel/share/v0-project
pnpm install
```

### 5. Inicializar Base de Datos

```bash
# Crear tablas
pnpm drizzle-kit push:mysql

# Crear usuarios de prueba
pnpm ts-node scripts/init-db.ts
```

### 6. Ejecutar Aplicación

```bash
pnpm dev
```

Abre http://localhost:3000 en tu navegador.

## Usuarios de Prueba

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@prealca.com | password123 | Admin |
| cris@prealca.com | password123 | Registro |
| andry@prealca.com | password123 | Documentador |

## Estructura de Base de Datos

### Tablas Principales

1. **users** - Usuarios del sistema
2. **sessions** - Sesiones de autenticación (Better Auth)
3. **proveedores** - Información de proveedores
4. **clientes** - Información de clientes
5. **bancos** - Bancos y cuentas
6. **productos** - Catálogo de productos
7. **unidades** - Unidades de transporte
8. **ingresos** - Ingresos bancarios
9. **egresos** - Gastos y egresos
10. **guias_despacho** - Guías de despacho
11. **facturas** - Facturas de venta
12. **retenciones** - Retenciones de impuestos

## API Routes a Implementar

### Autenticación
- `POST /api/auth/[...auth]` - Todas las operaciones de Better Auth

### Proveedores
- `GET /api/proveedores` - Listar proveedores
- `POST /api/proveedores` - Crear proveedor
- `PUT /api/proveedores/:id` - Actualizar
- `DELETE /api/proveedores/:id` - Eliminar

### Clientes
- `GET /api/clientes` - Listar clientes
- `POST /api/clientes` - Crear cliente
- `PUT /api/clientes/:id` - Actualizar
- `DELETE /api/clientes/:id` - Eliminar

### Bancos
- `GET /api/bancos` - Listar bancos
- `POST /api/bancos` - Crear banco
- `PUT /api/bancos/:id` - Actualizar
- `DELETE /api/bancos/:id` - Eliminar

### Ingresos
- `GET /api/ingresos` - Listar ingresos
- `POST /api/ingresos` - Crear ingreso (con conversión automática)
- `PUT /api/ingresos/:id` - Actualizar
- `DELETE /api/ingresos/:id` - Eliminar

### Egresos
- `GET /api/egresos` - Listar egresos
- `POST /api/egresos` - Crear egreso
- `PUT /api/egresos/:id` - Actualizar
- `DELETE /api/egresos/:id` - Eliminar

### Guías de Despacho
- `GET /api/guias-despacho` - Listar guías
- `POST /api/guias-despacho` - Crear guía
- `PUT /api/guias-despacho/:id` - Actualizar
- `DELETE /api/guias-despacho/:id` - Eliminar

### Facturas
- `GET /api/facturas` - Listar facturas
- `POST /api/facturas` - Crear factura
- `PUT /api/facturas/:id` - Actualizar
- `DELETE /api/facturas/:id` - Eliminar
- `GET /api/facturas/:id/pdf` - Descargar PDF

### Retenciones
- `GET /api/retenciones` - Listar retenciones
- `POST /api/retenciones` - Crear retención
- `DELETE /api/retenciones/:id` - Eliminar

### Reportes
- `GET /api/reportes/ingresos` - Datos para reporte
- `GET /api/reportes/egresos` - Datos para reporte
- `GET /api/reportes/ventas` - Datos para reporte
- `GET /api/reportes/retenciones` - Datos para reporte

## Funcionalidades Automáticas

1. **Conversión de Moneda**: Al ingresar montos en Bolívares, se convierte automáticamente a Dólares
2. **Cálculo de IVA**: IVA 16% se calcula automáticamente en Ingresos, Egresos, Facturas y Guías
3. **Retención de Impuestos**: El 75% del IVA se retiene automáticamente para contribuyentes especiales
4. **Validación de Unicidad**: RIF de proveedores y clientes deben ser únicos
5. **Autocompletado**: Los datos se cargan automáticamente desde catálogos

## Reglas de Negocio

1. **Contado = Ingreso Automático**: Si una factura es "Contado", crea automáticamente un ingreso
2. **Tipos de Guía**: Prealca (vinculada a factura) o Premezclado (independiente)
3. **Estatus de Documentos**: Pendiente, Aprobado, Cancelado, Anulado
4. **Clasificación de Gastos**: Mantenimiento, Producción, Administración, Otros
5. **Períodos de Reporte**: Mensual, Trimestral, Anual

## Exportación de Datos

### Excel (XLSX)
- Formato profesional con encabezados
- Múltiples hojas por reporte
- Fórmulas para cálculos
- Ancho de columnas optimizado

### PDF
- Encabezado con título y fecha
- Tablas automáticas con jsPDF-autotable
- Numeración de páginas
- Estilos profesionales

## Próximas Fases

### Fase 6: Optimización y Testing
- Unit tests con Jest
- Integration tests
- Performance optimization
- Caching strategy

### Fase 7: DevOps y Despliegue
- Docker configuration
- GitHub Actions CI/CD
- Database backups
- Monitoring y alertas

## Mantenimiento

### Actualizar Dependencias
```bash
pnpm update
```

### Hacer Backup de BD
```bash
mysqldump -u prealca -p prealca > backup_$(date +%Y%m%d).sql
```

### Limpiar Logs
```bash
rm -rf .next logs/*
```

## Documentación Adicional

- `SETUP.md` - Instrucciones detalladas de instalación
- `API_IMPLEMENTATION.md` - Patrones para implementar APIs
- `PHASE_COMPLETION.md` - Estado actual del proyecto
- `SIGUIENTE_PASOS.md` - Roadmap de implementación

## Soporte y Contacto

Para problemas o consultas, contacta al equipo de desarrollo.

## Licencia

Propietario de PREALCA
