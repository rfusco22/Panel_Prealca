-- Agregar campo es_saldo_inicial a materia_prima
ALTER TABLE materia_prima ADD COLUMN es_saldo_inicial TINYINT(1) NOT NULL DEFAULT 0 AFTER proveedor_id;
