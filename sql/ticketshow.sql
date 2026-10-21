-- =========================================================
-- Base de datos de TicketShow
-- Importar desde phpMyAdmin (pestaña "Importar") o por consola:
--   mysql -u root -p < sql/ticketshow.sql
-- =========================================================
CREATE DATABASE IF NOT EXISTS ticketshow
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ticketshow;

-- ---------------------------------------------------------
-- Tabla de usuarios
-- password es VARCHAR(255): guarda el hash BCRYPT (60 caracteres
-- hoy, pero el estándar de PHP recomienda reservar 255).
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre      VARCHAR(100) NOT NULL,
  apellido    VARCHAR(100) NOT NULL DEFAULT '',
  email       VARCHAR(150) NOT NULL,
  password    VARCHAR(255) NOT NULL,
  pais        VARCHAR(30)  NULL,
  telefono    VARCHAR(30)  NULL,
  tipo_doc    VARCHAR(20)  NULL,
  documento   VARCHAR(30)  NULL,
  nacimiento  DATE         NULL,
  genero      VARCHAR(30)  NULL,
  newsletter  TINYINT(1)   NOT NULL DEFAULT 0,
  rol         VARCHAR(20)  NOT NULL DEFAULT 'cliente',
  creado_en   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Tabla de compras (dominio del proyecto: entradas a shows)
-- Cada compra pertenece a un usuario registrado.
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS compras (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id    INT UNSIGNED NOT NULL,
  evento_clave  VARCHAR(30)  NOT NULL,
  evento_titulo VARCHAR(150) NOT NULL,
  precio        DECIMAL(10,2) NOT NULL,
  medio_pago    VARCHAR(30)  NOT NULL,
  direccion     VARCHAR(200) NULL,
  telefono      VARCHAR(30)  NULL,
  creado_en     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_compras_usuario (usuario_id),
  CONSTRAINT fk_compras_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
