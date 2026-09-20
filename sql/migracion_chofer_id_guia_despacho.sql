-- guia_despacho.chofer (texto) -> guia_despacho.chofer_id (FK a choferes).
--
-- El problema: guia_despacho guardaba el chofer como texto con el nombre
-- copiado. El <select> del formulario ya salía de la tabla choferes, así que
-- los valores están bastante sanos, pero al guardar el nombre y no el id
-- quedaban dos problemas:
--
--   1. Si alguien corrige el nombre de un chofer en su ficha, las guías viejas
--      siguen apuntando al nombre anterior y pasan a contarse como si fueran
--      de otra persona.
--   2. No se puede cruzar una guía con la ficha del chofer (licencia,
--      certificado médico, alertas de Seguridad Vial).
--
-- Eso bloqueaba el reporte de viajes por trompero (issue #6), que necesita
-- agrupar por chofer de forma confiable.
--
-- Esta migración NO es destructiva:
--
--   * Agrega chofer_id como NULL.
--   * Rellena chofer_id donde el nombre matchea exactamente un chofer
--     (comparando sin mayúsculas ni espacios sobrantes).
--   * NO borra la columna chofer. Se conserva a propósito: es el nombre tal
--     como se imprimió en la guía, y para las filas que no matcheen es el
--     único registro de quién manejó. La app lee COALESCE(ch.nombre,
--     gd.chofer), así que las filas sin chofer_id siguen mostrándose bien.
--
-- Idempotente y sin orden obligatorio respecto del deploy: cada paso se saltea
-- solo si ya está aplicado. La columna también la crea sola la app desde
-- ensureColumns() en app/api/guia-despacho/route.ts (por eso los chequeos
-- contra information_schema: si se deployó primero, un ALTER pelado fallaría
-- con "Duplicate column name" y varios clientes abortan el script entero,
-- salteándose el relleno).

-- 0. El tipo de choferes.id, que puede ser INT, INT UNSIGNED, BIGINT...
--    MySQL exige que la columna que referencia tenga EXACTAMENTE el mismo
--    tipo que la referenciada, o la foreign key del paso 6 falla con
--    "#3780 ... are incompatible". Por eso no se hardcodea INT: se lee el
--    tipo real y se usa ese.
SELECT COLUMN_TYPE INTO @tipo_id_chofer
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'choferes'
  AND COLUMN_NAME = 'id';

SELECT @tipo_id_chofer AS tipo_detectado_de_choferes_id;

-- 1. La columna, con el tipo que corresponde.
SET @existe_columna = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'guia_despacho'
    AND COLUMN_NAME = 'chofer_id'
);
SET @sql = IF(@existe_columna = 0,
  CONCAT('ALTER TABLE guia_despacho ADD COLUMN chofer_id ', @tipo_id_chofer, ' NULL'),
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Si la columna ya existía con otro tipo, se corrige. Es el caso cuando el
--    deploy corrió primero: ensureColumns() la crea como INT a secas, y si
--    choferes.id es INT UNSIGNED hay que ajustarla antes de poder crear la FK.
SET @tipo_actual = (
  SELECT COLUMN_TYPE FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'guia_despacho'
    AND COLUMN_NAME = 'chofer_id'
);
SET @sql = IF(@tipo_actual <> @tipo_id_chofer,
  CONCAT('ALTER TABLE guia_despacho MODIFY COLUMN chofer_id ', @tipo_id_chofer, ' NULL'),
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. El índice.
SET @existe_indice = (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'guia_despacho'
    AND INDEX_NAME = 'idx_guia_despacho_chofer_id'
);
SET @sql = IF(@existe_indice = 0,
  'CREATE INDEX idx_guia_despacho_chofer_id ON guia_despacho (chofer_id)',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4. Relleno. Solo toca filas sin chofer_id, y solo cuando el nombre matchea
--    UN chofer y nada más: si hubiera dos choferes con el mismo nombre, la
--    fila se deja en NULL a propósito en vez de adivinar (el paso 5 las lista).
UPDATE guia_despacho gd
SET gd.chofer_id = (
  SELECT c.id
  FROM choferes c
  WHERE UPPER(TRIM(c.nombre)) = UPPER(TRIM(gd.chofer))
  LIMIT 1
)
WHERE gd.chofer_id IS NULL
  AND gd.chofer IS NOT NULL
  AND TRIM(gd.chofer) <> ''
  AND (
    SELECT COUNT(*)
    FROM choferes c
    WHERE UPPER(TRIM(c.nombre)) = UPPER(TRIM(gd.chofer))
  ) = 1;

-- 5. Diagnóstico: qué quedó sin vincular y por qué. Si devuelve filas, son
--    guías cuyo texto no coincide con ningún chofer registrado (o coincide
--    con más de uno). Siguen funcionando -- se muestran con el nombre de la
--    columna chofer -- pero no van a aparecer agrupadas en el reporte de
--    viajes hasta que se les asigne el chofer a mano.
--    El agrupado va en una subconsulta: si la subconsulta correlacionada del
--    COUNT se pone junto al GROUP BY, MySQL la rechaza por only_full_group_by
--    (que viene activo por defecto).
SELECT
  v.chofer_sin_vincular,
  v.guias_afectadas,
  (SELECT COUNT(*) FROM choferes c
    WHERE UPPER(TRIM(c.nombre)) = v.chofer_normalizado) AS choferes_que_matchean
FROM (
  SELECT
    UPPER(TRIM(gd.chofer)) AS chofer_normalizado,
    MIN(TRIM(gd.chofer)) AS chofer_sin_vincular,
    COUNT(*) AS guias_afectadas
  FROM guia_despacho gd
  WHERE gd.chofer_id IS NULL
    AND gd.chofer IS NOT NULL
    AND TRIM(gd.chofer) <> ''
  GROUP BY UPPER(TRIM(gd.chofer))
) v
ORDER BY v.guias_afectadas DESC;

-- 6. La foreign key. Va al final, después del relleno, porque en este punto
--    chofer_id solo tiene ids válidos o NULL.
--    ON DELETE SET NULL a propósito: si se borra un chofer, la guía se
--    conserva (es un documento emitido) y queda con el nombre en gd.chofer.
SET @existe_fk = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'guia_despacho'
    AND CONSTRAINT_NAME = 'fk_guia_despacho_chofer'
);
SET @sql = IF(@existe_fk = 0,
  'ALTER TABLE guia_despacho ADD CONSTRAINT fk_guia_despacho_chofer FOREIGN KEY (chofer_id) REFERENCES choferes (id) ON DELETE SET NULL',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
