# Sistema de Gestión PREALCA

Aplicación web empresarial para automatizar procesos de la empresa PREALCA, incluyendo gestión de proveedores, clientes, bancos, ingresos, egresos, guías de despacho, facturas, retenciones de impuestos, choferes y más.

## Características Principales

### Autenticación y Seguridad
- Login seguro con iron-session + MySQL
- Tres roles con redirección por dashboard:
  - **Admin**: Gestión completa del sistema, usuarios, productos, unidades, retenciones
  - **Registro**: Proveedores, clientes, vendedores, bancos, facturas, órdenes de compra, choferes
  - **Dosificador**: Alertas de stock, materia prima, guías de despacho
- Hashing seguro de contraseñas con bcryptjs
- Último inicio de sesión registrado

### Rol Admin
- **Dashboard**: Estadísticas en tiempo real con 6 módulos
- **Gestión de Usuarios**: CRUD completo, activar/desactivar, roles, último acceso
- **Ingresos**: Registro con tasa BCV automática
- **Egresos**: Clasificación por categoría (Mantenimiento, Producción, Servicios, Gasto de Personal, Impuestos)
- **Productos**: Catálogo de productos (resistencia, pulgada, unidad)
- **Unidades**: Gestión de unidades de transporte
- **Retenciones de Impuestos**: Filtros por cliente/factura, cálculo automático 75% IVA

### Rol Registro
- **Dashboard**: Resumen general con estadísticas y alertas de documentos
- **Choferes**: CRUD con documentos (licencia, certificado médico, RIF) y alertas de vencimiento
- **Alertas**: Documentos de choferes vencidos o por vencer en ≤ 7 días
- **Proveedores**: CRUD con RIF, dirección, clasificación
- **Clientes**: CRUD con RIF, vendedor, contribuyente especial
- **Vendedores**: CRUD con cédula, teléfono
- **Bancos**: Gestión de cuentas bancarias con logos
- **Facturas**: Auto-fill desde guía de despacho, impresión
- **Órdenes de Compra**: Moneda toggle (Bs/$), tasa BCV, vista previa

### Rol Dosificador
- **Dashboard**: Vista general del flujo de materiales
- **Alertas de Stock**: Productos con despacho < 200 M³ en 30 días
- **Materia Prima**: Registro de cantidades por agregado
- **Guías de Despacho**: Formulario completo con Prealca/Premezclado

### Módulo Financiero
- **Ingresos**: Registro bancario con conversión automática Bs ↔ $
- **Egresos**: 5 clasificaciones con subcategorías detalladas
- **Cálculo de IVA**: 16% automático en documentos
- **Retenciones**: 75% del IVA para contribuyentes especiales
- **Tasa BCV**: API `ve.dolarapi.com/v1/dolares/oficiales` con fallback

### Choferes y Alertas
- **Campos**: Nombre, cédula, teléfono, correo, dirección
- **Documentos**: Licencia, certificado médico, RIF — cada uno con número y fecha de vencimiento
- **Alertas automáticas**: Documentos vencidos o por vencer en ≤ 7 días
- **Sección dedicada**: `/registro/alerta` con diseño alarmante (rojo, pulsante)

## Tech Stack

- **Frontend**: Next.js 16 + React 19 + Tailwind CSS v4
- **Backend**: Next.js API Routes
- **Auth**: iron-session
- **Database**: MySQL remoto (cPanel)
- **Validation**: react-hook-form + Zod
- **Icons**: lucide-react
- **Animations**: framer-motion
- **Currency**: API BCV (ve.dolarapi.com)

## Estructura del Proyecto

```
app/
  ├── auth/
  │   ├── login/                    # Login
  │   ├── registro/                 # Registro de usuarios
  │   └── forget/                   # Recuperar contraseña
  ├── admin/
  │   ├── page.tsx                  # Dashboard Admin
  │   ├── users/                    # Gestión de usuarios
  │   ├── retenciones/              # Retenciones de impuestos
  │   └── layout.tsx                # Layout con sidebar
  ├── registro/
  │   ├── page.tsx                  # Dashboard Registro
  │   ├── alerta/                   # Alertas de documentos choferes
  │   ├── choferes/                 # Gestión de choferes
  │   ├── clientes/                 # Gestión de clientes
  │   ├── proveedores/              # Gestión de proveedores
  │   ├── vendedores/               # Gestión de vendedores
  │   ├── bancos/                   # Gestión de bancos
  │   ├── facturas/                 # Facturas
  │   └── ordenes-compra/           # Órdenes de compra
  ├── dosificador/
  │   ├── page.tsx                  # Dashboard Dosificador
  │   ├── alerta/                   # Alertas de stock bajo
  │   ├── materia-prima/            # Registro de materia prima
  │   └── guia-despacho/            # Guías de despacho
  └── api/
      ├── auth/                     # Login, session, signout
      ├── admin/users/              # CRUD usuarios
      ├── choferes/                 # CRUD choferes + alertas
      ├── clientes/                 # CRUD clientes
      ├── proveedores/              # CRUD proveedores
      ├── vendedores/               # CRUD vendedores
      ├── bancos/                   # CRUD bancos
      ├── egresos/                  # CRUD egresos
      ├── ingresos/                 # CRUD ingresos
      ├── facturas/                 # CRUD facturas
      ├── guia-despacho/            # CRUD guías
      ├── orden-compra/             # CRUD órdenes
      ├── retenciones/              # CRUD retenciones
      ├── materia-prima/            # CRUD materia prima
      ├── agregados/                # CRUD agregados
      ├── alerta/                   # Alertas de stock
      ├── productos/                # Productos
      ├── unidades/                 # Unidades
      ├── bcv/                      # Tasa BCV
      └── stats/                    # Estadísticas

components/
  ├── auth/
  │   ├── login-form.tsx
  │   └── register-form.tsx
  ├── forms/
  │   ├── chofer-form.tsx           # Formulario choferes
  │   ├── cliente-form.tsx          # Formulario clientes
  │   ├── proveedor-form.tsx        # Formulario proveedores
  │   ├── vendedor-form.tsx         # Formulario vendedores
  │   ├── egreso-form.tsx           # Formulario egresos
  │   ├── ingreso-form.tsx          # Formulario ingresos
  │   ├── factura-form.tsx          # Formulario facturas
  │   ├── guia-despacho-form.tsx    # Formulario guías
  │   ├── orden-compra-form.tsx     # Formulario órdenes
  │   └── retencion-form.tsx        # Formulario retenciones
  ├── tables/
  │   ├── choferes-table.tsx
  │   ├── clientes-table.tsx
  │   ├── egresos-table.tsx
  │   ├── guia-despacho-table.tsx
  │   ├── ingresos-table.tsx
  │   ├── retenciones-table.tsx
  │   └── ordenes-compra-table.tsx
  ├── sidebar.tsx                   # Sidebar Admin
  ├── registro-sidebar.tsx          # Sidebar Registro
  ├── dosificador-sidebar.tsx       # Sidebar Dosificador
  └── top-bar.tsx                   # Barra superior

lib/
  ├── db.ts                         # Conexión MySQL directa
  ├── session.ts                    # Configuración iron-session
  ├── calculations.ts               # Cálculos IVA y retención
  ├── currency.ts                   # Conversión de monedas
  └── document-templates.ts         # HTML para impresión de documentos

hooks/
  └── useAuth.ts                    # Hook de autenticación

schema.ts                           # Schema Drizzle ORM (referencia)
```

## Base de Datos

### Tablas Principales

| Tabla | Descripción |
|-------|-------------|
| `users` | Usuarios con roles (admin, registro, dosificador) |
| `clientes` | Clientes con RIF, vendedor, contribuyente especial |
| `proveedores` | Proveedores con RIF y clasificación |
| `vendedores` | Vendedores con cédula y teléfono |
| `choferes` | Choferes con documentos y fechas de vencimiento |
| `bancos` | Cuentas bancarias |
| `productos` | Catálogo de productos (resistencia, pulgada) |
| `unidades` | Unidades de transporte |
| `agregados` | Materiales agregados con unidad de medida |
| `materia_prima` | Registro de materia prima por agregado |
| `ingresos` | Ingresos bancarios |
| `egresos` | Egresos con clasificación y subcategoría |
| `guia_despacho` | Guías de despacho (Prealca/Premezclado) |
| `facturas` | Facturas de venta |
| `orden_compra` | Órdenes de compra |
| `retenciones_impuestos` | Retenciones de IVA |

## API Routes

### Autenticación
- `POST /api/auth/login` - Login
- `GET /api/auth/session` - Verificar sesión
- `POST /api/auth/signout` - Cerrar sesión

### Choferes
- `GET /api/choferes` - Listar choferes
- `POST /api/choferes` - Crear chofer
- `PUT /api/choferes` - Actualizar chofer
- `DELETE /api/choferes?id=X` - Eliminar chofer
- `GET /api/choferes/alertas` - Documentos vencidos/por vencer

### Retenciones
- `GET /api/retenciones` - Listar (filtro por cliente_id, factura_id)
- `POST /api/retenciones` - Crear retención
- `GET /api/retenciones/facturas-contribuyentes` - Facturas de contribuyentes especiales

### Otros
- `GET/POST /api/clientes`, `/api/proveedores`, `/api/vendedores`, `/api/bancos`
- `GET/POST /api/egresos`, `/api/ingresos`, `/api/facturas`
- `GET/POST /api/guia-despacho`, `/api/orden-compra`
- `GET/POST /api/materia-prima`, `/api/agregados`
- `GET /api/alerta` - Productos con stock < 200 M³
- `GET /api/bcv` - Tasa oficial BCV
- `GET /api/stats` - Estadísticas generales

## Usuarios de Prueba

| Email | Contraseña | Rol |
|-------|-----------|-----|
| franco123@gmail.com | password123 | Admin |
| franco@gmail.com | password123 | Registro |

## Instalación

### Requisitos
- Node.js 18+
- MySQL 8.0+ (o MySQL remoto)

### Configuración

```bash
# Clonar repositorio
git clone https://github.com/rfusco22/Panel_Prealca.git
cd Panel_Prealca

# Instalar dependencias
npm install

# Configurar variables de entorno (.env)
DB_HOST=tu_host
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=tu_base_de_datos
DB_PORT=3306

# Ejecutar
npm run dev
```

Abrir http://localhost:3000

## Funcionalidades Automáticas

1. **Tasa BCV**: Conversión automática Bs ↔ $ usando API oficial
2. **Cálculo de IVA**: 16% automático en guías y facturas
3. **Retención**: 75% del IVA para contribuyentes especiales
4. **Alertas de Stock**: Productos < 200 M³ en 30 días
5. **Alertas de Documentos**: Choferes con documentos vencidos/por vencer
6. **Impresión**: Generación HTML para guías, facturas, órdenes de compra

## Reglas de Negocio

1. **Prealca vs Premezclado**: Si lleva IVA → Prealca. Si no → Premezclado
2. **Contribuyente Especial**: Solo clientes con `es_contribuyente_especial = 1` aplican para retenciones
3. **Stock Crítico**: Productos con < 200 M³ despachados en 30 días generan alerta
4. **Vencimiento de Documentos**: Alerta 7 días antes del vencimiento de licencia, certificado o RIF

## Mantenimiento

```bash
# Actualizar dependencias
npm update

# Backup de BD
mysqldump -u usuario -p base_de_datos > backup_$(date +%Y%m%d).sql

# Limpiar caché
rm -rf .next
```

## Licencia

Propietario de PREALCA
