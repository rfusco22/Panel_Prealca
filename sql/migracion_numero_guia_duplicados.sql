-- Números de guía duplicados: diagnóstico y, si se decide, corrección.
--
-- QUÉ PASÓ
--
-- sql/migracion_numero_guia_por_tipo.sql separó la numeración en dos contadores,
-- uno para Prealca y otro para Premezclado, y los creó arrancando en 1. Pero las
-- guías que ya existían estaban numeradas del 1 al 5 con el contador viejo
-- compartido. Entonces los primeros números de cada tipo salieron repetidos:
-- quedaron dos guías Premezclado con el número GD-2.
--
-- NO HACE FALTA CORRER ESTE SCRIPT PARA QUE DEJE DE PASAR.
--
-- La app ya no puede crear un número repetido: antes de usar el número que le
-- toca verifica que no esté usado por otra guía del mismo tipo, y si lo está
-- adelanta el contador hasta pasar el máximo. Además intenta crear un índice
-- UNIQUE (tipo, numero_guia), que es la garantía a nivel de base de datos.
--
-- Ese índice NO se va a crear mientras queden duplicados: la creación falla y se
-- ignora. Apenas se resuelvan, se crea solo en el siguiente pedido.
--
-- Este script sirve para ver qué duplicados hay y, si el administrador decide
-- corregirlos, hacerlo a mano.


-- 1. VER LOS DUPLICADOS. Esto solo lee, no cambia nada.
--    Si no devuelve filas, no hay duplicados y no hay nada que hacer.
SELECT tipo,
       numero_guia,
       COUNT(*)                              AS veces,
       GROUP_CONCAT(id ORDER BY id)          AS ids_de_las_guias,
       GROUP_CONCAT(DATE(created_at) ORDER BY id) AS fechas
FROM guia_despacho
WHERE numero_guia IS NOT NULL
GROUP BY tipo, numero_guia
HAVING COUNT(*) > 1
ORDER BY tipo, numero_guia;


-- 2. VER EL DETALLE de las guías involucradas, para decidir con datos:
--    cliente, obra y fecha de cada una.
SELECT gd.id, gd.tipo, gd.numero_guia, gd.created_at,
       c.nombre AS cliente, gd.obra, gd.cantidad_m3
FROM guia_despacho gd
LEFT JOIN clientes c ON gd.cliente_id = c.id
WHERE (gd.tipo, gd.numero_guia) IN (
        SELECT tipo, numero_guia FROM (
          SELECT tipo, numero_guia FROM guia_despacho
          WHERE numero_guia IS NOT NULL
          GROUP BY tipo, numero_guia HAVING COUNT(*) > 1
        ) AS d
      )
ORDER BY gd.tipo, gd.numero_guia, gd.id;


-- 3. CORRECCIÓN: NO está automatizada a propósito.
--
-- Las dos guías duplicadas ya se imprimieron y están en la calle con ese
-- número. Cambiarle el número a una en el sistema hace que el papel y el panel
-- dejen de coincidir, así que no es una decisión que deba tomar un script: la
-- toma el administrador, que sabe qué pasó con cada documento.
--
-- Si se decide renumerar, hay que elegir A CUÁL de las dos, y correr algo así,
-- reemplazando los valores por los que devolvió la consulta 2:
--
--   UPDATE guia_despacho
--      SET numero_guia = <numero libre>
--    WHERE id = <id de la guia que se renumera>;
--
-- Para saber qué número está libre en ese tipo:
--
--   SELECT COALESCE(MAX(numero_guia), 0) + 1 AS siguiente_libre
--     FROM guia_despacho WHERE tipo = 'Premezclado';
--
-- La otra alternativa, igual de válida, es dejar los duplicados como están
-- (son historia, ya impresa) y convivir con que una búsqueda de GD-2 devuelva
-- dos resultados. En ese caso el índice UNIQUE nunca se va a crear, y la
-- protección queda solo del lado de la aplicación, que ya alcanza para que no
-- aparezcan duplicados nuevos.


-- 4. VERIFICACIÓN. Después de resolver los duplicados, esto confirma que el
--    índice quedó creado (la app lo intenta sola en el siguiente pedido):
--
--   SHOW INDEX FROM guia_despacho WHERE Key_name = 'idx_guia_tipo_numero';
