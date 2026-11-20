-- Esquema de la base de datos de la tienda de telas (compatible con MySQL 5.0 o superior)
CREATE DATABASE IF NOT EXISTS tienda_telas CHARACTER SET utf8 COLLATE utf8_unicode_ci;
USE tienda_telas;

-- Parámetros generales (incluye el porcentaje de comisión de los vendedores)
CREATE TABLE IF NOT EXISTS parametros (
  clave        VARCHAR(50)  PRIMARY KEY,
  valor        VARCHAR(255) NOT NULL,
  descripcion  VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT IGNORE INTO parametros (clave, valor, descripcion) VALUES
  ('comision_porcentaje', '5', 'Porcentaje de comisión que gana el vendedor sobre cada venta cobrada'),
  ('nombre_tienda', 'Tienda de Telas', 'Nombre que aparece en la app y en los PDF'),
  ('simbolo_moneda', '$', 'Símbolo de moneda para mostrar montos');

-- Empleados (el vendedor es un empleado más: salario = básico + comisiones)
CREATE TABLE IF NOT EXISTS usuarios (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(100) NOT NULL,
  usuario        VARCHAR(50)  NOT NULL UNIQUE,
  password_hash  VARCHAR(100) NOT NULL,
  rol            ENUM('admin','cajero','vendedor') NOT NULL DEFAULT 'vendedor',
  salario_basico DECIMAL(12,2) NOT NULL DEFAULT 0,
  activo         TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Inventario: telas (se venden por metro) y accesorios de costura (por unidad)
CREATE TABLE IF NOT EXISTS productos (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  codigo       VARCHAR(30)  NOT NULL UNIQUE,
  nombre       VARCHAR(150) NOT NULL,
  categoria    VARCHAR(60)  NULL,
  unidad       VARCHAR(20)  NOT NULL DEFAULT 'unidad',
  precio       DECIMAL(12,2) NOT NULL,
  stock        DECIMAL(12,2) NOT NULL DEFAULT 0,
  stock_minimo DECIMAL(12,2) NOT NULL DEFAULT 0,
  activo       TINYINT(1) NOT NULL DEFAULT 1,
  INDEX idx_productos_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Historial de movimientos (cantidad con signo: entradas +, salidas -)
CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  producto_id INT NOT NULL,
  tipo        ENUM('entrada','salida','ajuste') NOT NULL,
  cantidad    DECIMAL(12,2) NOT NULL,
  motivo      VARCHAR(200) NULL,
  usuario_id  INT NULL,
  creado_en   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Pedidos que el vendedor envía desde el móvil a caja
CREATE TABLE IF NOT EXISTS pedidos (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  vendedor_id    INT NOT NULL,
  cliente_nombre VARCHAR(120) NOT NULL,
  estado         ENUM('pendiente','cobrado','anulado') NOT NULL DEFAULT 'pendiente',
  total          DECIMAL(12,2) NOT NULL DEFAULT 0,
  creado_en      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pedidos_estado (estado),
  INDEX idx_pedidos_fecha (creado_en),
  FOREIGN KEY (vendedor_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS pedido_items (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id       INT NOT NULL,
  producto_id     INT NOT NULL,
  cantidad        DECIMAL(12,2) NOT NULL,
  precio_unitario DECIMAL(12,2) NOT NULL,
  subtotal        DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Facturas: se generan al cobrar el pedido en caja.
-- La comisión se guarda "congelada" (porcentaje y monto) para que un cambio
-- posterior en parámetros no altere las planillas anteriores.
CREATE TABLE IF NOT EXISTS facturas (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  numero              VARCHAR(20) NULL UNIQUE,
  pedido_id           INT NOT NULL UNIQUE,
  cajero_id           INT NOT NULL,
  vendedor_id         INT NOT NULL,
  cliente_nombre      VARCHAR(120) NOT NULL,
  total               DECIMAL(12,2) NOT NULL,
  metodo_pago         ENUM('efectivo','tarjeta','transferencia') NOT NULL DEFAULT 'efectivo',
  recibido            DECIMAL(12,2) NOT NULL,
  cambio              DECIMAL(12,2) NOT NULL DEFAULT 0,
  comision_porcentaje DECIMAL(5,2)  NOT NULL DEFAULT 0,
  comision_monto      DECIMAL(12,2) NOT NULL DEFAULT 0,
  creada_en           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_facturas_fecha (creada_en),
  INDEX idx_facturas_vendedor (vendedor_id),
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
  FOREIGN KEY (cajero_id) REFERENCES usuarios(id),
  FOREIGN KEY (vendedor_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
