-- Agregar campos de Póliza RCV y ROT a unidades
ALTER TABLE unidades
  ADD COLUMN poliza_rcv_numero VARCHAR(100) NULL AFTER color,
  ADD COLUMN poliza_rcv_vencimiento DATE NULL AFTER poliza_rcv_numero,
  ADD COLUMN rot_numero VARCHAR(100) NULL AFTER poliza_rcv_vencimiento,
  ADD COLUMN rot_vencimiento DATE NULL AFTER rot_numero;
