-- Chat interno entre usuarios (mensajes en tiempo real por WebSocket).
-- La app crea estas tablas sola la primera vez que se usa el chat
-- (lib/chat.ts -> ensureTablasChat); este script es para crearlas a mano.
--
-- destinatario_id NULL = canal "General", visible para todos.

CREATE TABLE IF NOT EXISTS chat_mensajes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  remitente_id INT NOT NULL,
  destinatario_id INT NULL,
  contenido TEXT NOT NULL,
  leido TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_chat_conversacion (remitente_id, destinatario_id),
  INDEX idx_chat_destinatario (destinatario_id, leido)
);

-- Hasta qué mensaje del canal General leyó cada usuario.
CREATE TABLE IF NOT EXISTS chat_lecturas (
  usuario_id INT PRIMARY KEY,
  ultimo_general_id INT NOT NULL DEFAULT 0
);
