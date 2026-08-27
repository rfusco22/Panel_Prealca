-- Materia prima: registrar de qué planta del proveedor vino el material y con
-- qué chofer y unidad se despachó.
--
-- planta_id apunta a proveedor_plantas (creada en migracion_planta_saldo.sql),
-- que es la relación 1 a muchos real entre proveedor y sus plantas.
--
-- Las tres columnas son NULL: los registros anteriores no las tienen, y un
-- saldo inicial no involucra chofer ni unidad.

ALTER TABLE materia_prima ADD COLUMN planta_id INT NULL;
ALTER TABLE materia_prima ADD COLUMN chofer_id INT NULL;
ALTER TABLE materia_prima ADD COLUMN unidad_id INT NULL;

CREATE INDEX idx_mp_planta ON materia_prima (planta_id);
CREATE INDEX idx_mp_chofer ON materia_prima (chofer_id);
CREATE INDEX idx_mp_unidad ON materia_prima (unidad_id);
