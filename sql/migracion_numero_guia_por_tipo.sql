-- Numeración de guías de despacho separada por tipo (Prealca / Premezclado).
--
-- Hasta ahora numero_guia se generaba desde una única tabla
-- guia_numero_secuencia, compartida entre los dos tipos de guía: Prealca y
-- Premezclado avanzaban en la misma cronología. Esta migración crea dos
-- tablas nuevas, una por tipo, cada una con su propio AUTO_INCREMENT
-- arrancando en 1, para que cada tipo lleve su propio correlativo.
--
-- No se toca guia_despacho.numero_guia ni la tabla guia_numero_secuencia
-- original: las guías ya creadas conservan el número que tienen (no se
-- renumeran, para no invalidar documentos ya impresos). Solo las guías
-- nuevas usan el contador de su tipo correspondiente.
--
-- Idempotente: se puede correr las veces que haga falta. La app también
-- aplica esto sola desde ensureColumns() en app/api/guia-despacho/route.ts.

CREATE TABLE IF NOT EXISTS guia_numero_secuencia_prealca (
  numero INT AUTO_INCREMENT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS guia_numero_secuencia_premezclado (
  numero INT AUTO_INCREMENT PRIMARY KEY
);
