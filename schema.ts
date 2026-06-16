import { 
  mysqlTable, 
  serial, 
  varchar, 
  text, 
  decimal, 
  int, 
  boolean, 
  datetime, 
  json, 
  mysqlEnum, // <--- CORRECCIÓN AQUÍ
  uniqueIndex, 
  index 
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm'; // <-- AGREGA ESTO

// ==================== USUARIOS Y AUTENTICACIÓN ====================

export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  role: mysqlEnum('role', ['admin', 'registro', 'documentador']).notNull().default('registro'),
  estado: varchar('estado', { length: 50 }).default('activo'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  emailIdx: uniqueIndex('email_idx').on(table.email),
}));

export const sessions = mysqlTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: serial('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: datetime('expires_at').notNull(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
}));

// ==================== CATÁLOGOS MAESTROS ====================

export const proveedores = mysqlTable('proveedores', {
  id: serial('id').primaryKey(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  rif: varchar('rif', { length: 50 }).notNull().unique(),
  direccion: text('direccion'),
  clasificacionGasto: varchar('clasificacion_gasto', { length: 100 }),
  esContribuyenteEspecial: boolean('es_contribuyente_especial').default(false),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').onUpdate(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  rifIdx: uniqueIndex('proveedor_rif_idx').on(table.rif),
}));

export const clientes = mysqlTable('clientes', {
  id: serial('id').primaryKey(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  rif: varchar('rif', { length: 50 }).notNull().unique(),
  direccion: text('direccion'),
  esContribuyenteEspecial: boolean('es_contribuyente_especial').default(false),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').onUpdate(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  rifIdx: uniqueIndex('cliente_rif_idx').on(table.rif),
}));

export const bancos = mysqlTable('bancos', {
  id: serial('id').primaryKey(),
  nombreBanco: varchar('nombre_banco', { length: 255 }).notNull(),
  numeroCuenta: varchar('numero_cuenta', { length: 50 }).notNull().unique(),
  titularCuenta: varchar('titular_cuenta', { length: 255 }),
  cedula: varchar('cedula', { length: 50 }),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').onUpdate(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  cuentaIdx: uniqueIndex('cuenta_idx').on(table.numeroCuenta),
}));

export const productos = mysqlTable('productos', {
  id: serial('id').primaryKey(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  resistencia: varchar('resistencia', { length: 100 }),
  descripcion: text('descripcion'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').onUpdate(sql`CURRENT_TIMESTAMP`),
});

export const unidades = mysqlTable('unidades', {
  id: serial('id').primaryKey(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  tipo: varchar('tipo', { length: 100 }), // Camión, etc.
  placa: varchar('placa', { length: 50 }).unique(),
  createdAt: datetime('created_at').defaultNow(),
  updatedAt: datetime('updated_at').onUpdateNow(),
});

export const vendedores = mysqlTable('vendedores', {
  id: serial('id').primaryKey(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  usuarioId: serial('usuario_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: datetime('created_at').defaultNow(),
  updatedAt: datetime('updated_at').onUpdateNow(),
});

// ==================== TRANSACCIONES FINANCIERAS ====================

export const ingresos = mysqlTable('ingresos', {
  id: serial('id').primaryKey(),
  bancoId: serial('banco_id').notNull().references(() => bancos.id, { onDelete: 'restrict' }),
  clienteId: serial('cliente_id').notNull().references(() => clientes.id, { onDelete: 'restrict' }),
  vendedorId: serial('vendedor_id').references(() => vendedores.id, { onDelete: 'set null' }),
  descripcion: text('descripcion'),
  m3: decimal('m3', { precision: 10, scale: 2 }),
  resistencia: varchar('resistencia', { length: 100 }),
  precioBolivares: decimal('precio_bolivares', { precision: 15, scale: 2 }).notNull(),
  precioDolares: decimal('precio_dolares', { precision: 15, scale: 2 }),
  ivaAplicado: boolean('iva_aplicado').default(false),
  ivaMonto: decimal('iva_monto', { precision: 15, scale: 2 }).default('0'),
  esAnticipo: boolean('es_anticipo').default(false),
  referencia: varchar('referencia', { length: 100 }),
  comprobanteUrl: varchar('comprobante_url', { length: 500 }),
  fecha: datetime('fecha').defaultNow(),
  usuarioId: serial('usuario_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  createdAt: datetime('created_at').defaultNow(),
  updatedAt: datetime('updated_at').onUpdateNow(),
}, (table) => ({
  bancoIdx: index('ingreso_banco_idx').on(table.bancoId),
  clienteIdx: index('ingreso_cliente_idx').on(table.clienteId),
  fechaIdx: index('ingreso_fecha_idx').on(table.fecha),
}));

export const egresos = mysqlTable('egresos', {
  id: serial('id').primaryKey(),
  bancoId: serial('banco_id').notNull().references(() => bancos.id, { onDelete: 'restrict' }),
  proveedorId: serial('proveedor_id').notNull().references(() => proveedores.id, { onDelete: 'restrict' }),
  clasificacionGasto: varchar('clasificacion_gasto', { length: 100 }).notNull(),
  tipoGasto: varchar('tipo_gasto', { length: 100 }).notNull(),
  descripcion: text('descripcion'),
  montoBolivares: decimal('monto_bolivares', { precision: 15, scale: 2 }).notNull(),
  montoDolares: decimal('monto_dolares', { precision: 15, scale: 2 }),
  referencia: varchar('referencia', { length: 100 }),
  fecha: datetime('fecha').defaultNow(),
  usuarioId: serial('usuario_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  createdAt: datetime('created_at').defaultNow(),
  updatedAt: datetime('updated_at').onUpdateNow(),
}, (table) => ({
  bancoIdx: index('egreso_banco_idx').on(table.bancoId),
  proveedorIdx: index('egreso_proveedor_idx').on(table.proveedorId),
  fechaIdx: index('egreso_fecha_idx').on(table.fecha),
}));

export const tasaCambio = mysqlTable('tasa_cambio', {
  id: serial('id').primaryKey(),
  fecha: datetime('fecha').notNull().unique(),
  tasaBolivaresADolares: decimal('tasa_bolivares_a_dolares', { precision: 10, scale: 4 }).notNull(),
  creadoEn: datetime('creado_en').defaultNow(),
});

// ==================== VENTAS ====================

export const guiaDespacho = mysqlTable('guia_despacho', {
  id: serial('id').primaryKey(),
  fecha: datetime('fecha').defaultNow(),
  tipo: mysqlEnum('tipo', ['Prealca', 'Premezclado']).notNull(),
  clienteId: serial('cliente_id').notNull().references(() => clientes.id, { onDelete: 'restrict' }),
  productoId: serial('producto_id').notNull().references(() => productos.id, { onDelete: 'restrict' }),
  cantidadM3: decimal('cantidad_m3', { precision: 10, scale: 2 }).notNull(),
  precioM3: decimal('precio_m3', { precision: 15, scale: 2 }).notNull(),
  ivaAplicado: boolean('iva_aplicado').default(false),
  ivaMonto: decimal('iva_monto', { precision: 15, scale: 2 }).default('0'),
  total: decimal('total', { precision: 15, scale: 2 }).notNull(),
  chofer: varchar('chofer', { length: 255 }),
  unidadId: serial('unidad_id').references(() => unidades.id, { onDelete: 'set null' }),
  usuarioId: serial('usuario_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  createdAt: datetime('created_at').defaultNow(),
  updatedAt: datetime('updated_at').onUpdateNow(),
}, (table) => ({
  clienteIdx: index('guia_cliente_idx').on(table.clienteId),
  tipoIdx: index('guia_tipo_idx').on(table.tipo),
}));

export const facturas = mysqlTable('facturas', {
  id: serial('id').primaryKey(),
  fecha: datetime('fecha').defaultNow(),
  guiaDespachoId: serial('guia_despacho_id').references(() => guiaDespacho.id, { onDelete: 'set null' }),
  clienteId: serial('cliente_id').notNull().references(() => clientes.id, { onDelete: 'restrict' }),
  formaPago: mysqlEnum('forma_pago', ['Contado', 'Crédito']).notNull(),
  comprobanteRetencion: varchar('comprobante_retencion', { length: 100 }),
  estado: mysqlEnum('estado', ['Pendiente', 'Cancelada', 'Anulada']).default('Pendiente'),
  total: decimal('total', { precision: 15, scale: 2 }),
  usuarioId: serial('usuario_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  createdAt: datetime('created_at').defaultNow(),
  updatedAt: datetime('updated_at').onUpdateNow(),
}, (table) => ({
  clienteIdx: index('factura_cliente_idx').on(table.clienteId),
  estadoIdx: index('factura_estado_idx').on(table.estado),
}));

export const retencionesImpuestos = mysqlTable('retenciones_impuestos', {
  id: serial('id').primaryKey(),
  clienteId: serial('cliente_id').notNull().references(() => clientes.id, { onDelete: 'restrict' }),
  facturaId: serial('factura_id').notNull().references(() => facturas.id, { onDelete: 'restrict' }),
  montoRetenido: decimal('monto_retenido', { precision: 15, scale: 2 }).notNull(),
  porcentajeRetencion: decimal('porcentaje_retencion', { precision: 5, scale: 2 }).default('75'),
  fecha: datetime('fecha').defaultNow(),
  usuarioId: serial('usuario_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  createdAt: datetime('created_at').defaultNow(),
  updatedAt: datetime('updated_at').onUpdateNow(),
}, (table) => ({
  clienteIdx: index('retencion_cliente_idx').on(table.clienteId),
  facturaIdx: index('retencion_factura_idx').on(table.facturaId),
}));

// ==================== RELACIONES ====================

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  vendedores: many(vendedores),
  ingresos: many(ingresos),
  egresos: many(egresos),
  guiasDespacho: many(guiaDespacho),
  facturas: many(facturas),
  retenciones: many(retencionesImpuestos),
}));

export const clientesRelations = relations(clientes, ({ many }) => ({
  ingresos: many(ingresos),
  guiasDespacho: many(guiaDespacho),
  facturas: many(facturas),
  retenciones: many(retencionesImpuestos),
}));

export const bancosRelations = relations(bancos, ({ many }) => ({
  ingresos: many(ingresos),
  egresos: many(egresos),
}));

export const productosRelations = relations(productos, ({ many }) => ({
  guiasDespacho: many(guiaDespacho),
}));

export const unidadesRelations = relations(unidades, ({ many }) => ({
  guiasDespacho: many(guiaDespacho),
}));

export const vendedoresRelations = relations(vendedores, ({ many }) => ({
  ingresos: many(ingresos),
}));

export const guiaDespachoRelations = relations(guiaDespacho, ({ one, many }) => ({
  cliente: one(clientes, { fields: [guiaDespacho.clienteId], references: [clientes.id] }),
  producto: one(productos, { fields: [guiaDespacho.productoId], references: [productos.id] }),
  unidad: one(unidades, { fields: [guiaDespacho.unidadId], references: [unidades.id] }),
  usuario: one(users, { fields: [guiaDespacho.usuarioId], references: [users.id] }),
  facturas: many(facturas),
}));

export const facturasRelations = relations(facturas, ({ one, many }) => ({
  guiaDespacho: one(guiaDespacho, { fields: [facturas.guiaDespachoId], references: [guiaDespacho.id] }),
  cliente: one(clientes, { fields: [facturas.clienteId], references: [clientes.id] }),
  usuario: one(users, { fields: [facturas.usuarioId], references: [users.id] }),
  retenciones: many(retencionesImpuestos),
}));

export const retencionesRelations = relations(retencionesImpuestos, ({ one }) => ({
  cliente: one(clientes, { fields: [retencionesImpuestos.clienteId], references: [clientes.id] }),
  factura: one(facturas, { fields: [retencionesImpuestos.facturaId], references: [facturas.id] }),
  usuario: one(users, { fields: [retencionesImpuestos.usuarioId], references: [users.id] }),
}));
