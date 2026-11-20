// Crea la base de datos, las tablas y datos de ejemplo.  Uso: npm run seed
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql';
import bcrypt from 'bcryptjs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const sql = fs.readFileSync(path.join(aqui, '../schema.sql'), 'utf8');

const conn = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  charset: 'UTF8_GENERAL_CI',
  insecureAuth: process.env.DB_INSECURE_AUTH === 'true',
  multipleStatements: true
});

// Ayudante para usar promesas con este driver
const q = (texto, params) =>
  new Promise((ok, fallo) => conn.query(texto, params, (e, r) => (e ? fallo(e) : ok(r))));

try {
  await new Promise((ok, fallo) => conn.connect((e) => (e ? fallo(e) : ok())));
  await q(sql); // crea la base de datos y las tablas (schema.sql)

  // Las transacciones y claves foráneas requieren el motor InnoDB
  const [estado] = await q("SHOW TABLE STATUS FROM tienda_telas LIKE 'pedidos'");
  if (estado && estado.Engine !== 'InnoDB') {
    console.warn(`ATENCIÓN: las tablas usan el motor ${estado.Engine}, no InnoDB. Habilita InnoDB en my.ini (quita "skip-innodb") y vuelve a ejecutar el seed.`);
  }

  // Usuarios de ejemplo (cambia las contraseñas desde la app: Empleados)
  const usuarios = [
    ['Administrador', 'admin', 'admin123', 'admin', 0],
    ['Caja Principal', 'caja', 'caja123', 'cajero', 1300000],
    ['Vendedor Uno', 'vendedor1', 'venta123', 'vendedor', 1300000],
    ['Vendedor Dos', 'vendedor2', 'venta123', 'vendedor', 1300000]
  ];
  for (const [nombre, usuario, clave, rol, basico] of usuarios) {
    await q(
      'INSERT IGNORE INTO usuarios (nombre, usuario, password_hash, rol, salario_basico) VALUES (?,?,?,?,?)',
      [nombre, usuario, await bcrypt.hash(clave, 10), rol, basico]);
  }

  // Productos de ejemplo
  const productos = [
    ['TEL-001', 'Algodón estampado floral', 'Telas', 'metro', 18000, 120, 20],
    ['TEL-002', 'Lino natural', 'Telas', 'metro', 32000, 80, 15],
    ['TEL-003', 'Satín liso', 'Telas', 'metro', 22000, 60, 10],
    ['TEL-004', 'Tela para cortinas', 'Telas', 'metro', 27000, 45, 10],
    ['ACC-001', 'Hilo poliéster (cono)', 'Hilos', 'unidad', 4500, 200, 40],
    ['ACC-002', 'Botones surtidos (bolsa)', 'Accesorios', 'unidad', 3500, 90, 20],
    ['ACC-003', 'Cierre invisible 22 cm', 'Accesorios', 'unidad', 2500, 150, 30],
    ['ACC-004', 'Elástico 2 cm', 'Accesorios', 'metro', 1800, 300, 50]
  ];
  for (const p of productos) {
    await q(
      'INSERT IGNORE INTO productos (codigo, nombre, categoria, unidad, precio, stock, stock_minimo) VALUES (?,?,?,?,?,?,?)', p);
  }

  console.log('Base de datos lista. Usuarios: admin/admin123, caja/caja123, vendedor1/venta123, vendedor2/venta123');
} catch (e) {
  console.error('Error:', e.message);
  if (e.code === 'HANDSHAKE_INSECURE_AUTH') {
    console.error('Pon DB_INSECURE_AUTH=true en server/.env (el usuario usa el hash de contraseña antiguo).');
  }
  process.exitCode = 1;
} finally {
  conn.destroy();
}
