-- Agrega el rol "seguridad-vial" al ENUM de users.role.
--
-- La app también puede aplicar esto sola: GET /api/admin/migrate-role
-- (protegido, solo admin) corre el mismo ALTER. Este archivo es la
-- referencia para correrlo a mano si se prefiere.
--
-- MySQL no tiene "ADD VALUE" para ENUM como Postgres: hay que redeclarar la
-- columna completa. Por eso se repite la lista entera de roles en vez de
-- agregar solo el nuevo.

ALTER TABLE users
  MODIFY COLUMN role ENUM('admin','registro','dosificador','gerencia','seguridad-vial')
  NOT NULL DEFAULT 'registro';
