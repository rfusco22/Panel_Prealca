-- Migración de campos faltantes en pedidos, materia_prima y guia_despacho
-- Agregar campo 'obra' a pedidos y guia_despacho
ALTER TABLE pedidos ADD COLUMN obra VARCHAR(255) NULL AFTER notas;
ALTER TABLE guia_despacho ADD COLUMN obra VARCHAR(255) NULL AFTER pedido_id;

-- Agregar campo 'es_saldo_inicial' y 'planta' a materia_prima
ALTER TABLE materia_prima ADD COLUMN es_saldo_inicial TINYINT(1) DEFAULT 0;
ALTER TABLE materia_prima ADD COLUMN planta VARCHAR(255) NULL;