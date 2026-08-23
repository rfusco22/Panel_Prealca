-- Agregar campo 'obra' a pedidos y guia_despacho
ALTER TABLE pedidos ADD COLUMN obra VARCHAR(255) NULL AFTER notas;
ALTER TABLE guia_despacho ADD COLUMN obra VARCHAR(255) NULL AFTER pedido_id;
