import { Router } from 'express';
import { pool } from '../db.js';
import { requiereAuth } from '../auth.js';
import { emitirPedido } from '../realtime.js';
import { ah, err, r2 } from '../util.js';

const r = Router();

const SELECT_PEDIDO = `
  SELECT p.*, v.nombre AS vendedor_nombre,
         f.numero AS factura_numero, f.comision_monto, f.recibido, f.cambio
  FROM pedidos p
  JOIN usuarios v ON v.id = p.vendedor_id
  LEFT JOIN facturas f ON f.pedido_id = p.id`;

// Devuelve un pedido con sus líneas
export async function obtenerPedido(db, id) {
  const [[p]] = await db.query(`${SELECT_PEDIDO} WHERE p.id = ?`, [id]);
  if (!p) return null;
  const [items] = await db.query(
    `SELECT i.*, pr.nombre, pr.codigo, pr.unidad
     FROM pedido_items i JOIN productos pr ON pr.id = i.producto_id WHERE i.pedido_id = ?`, [id]);
  p.items = items;
  return p;
}

// Pedidos pendientes + los de hoy. El vendedor solo ve los suyos; caja ve todos.
r.get('/', requiereAuth(), ah(async (req, res) => {
  const params = [];
  let filtro = '';
  if (req.usuario.rol === 'vendedor') {
    filtro = 'AND p.vendedor_id = ?';
    params.push(req.usuario.id);
  }
  const [pedidos] = await pool.query(
    `${SELECT_PEDIDO}
     WHERE (p.estado = 'pendiente' OR DATE(p.creado_en) = CURDATE()) ${filtro}
     ORDER BY p.id DESC LIMIT 200`, params);

  if (pedidos.length) {
    const [items] = await pool.query(
      `SELECT i.*, pr.nombre, pr.codigo, pr.unidad
       FROM pedido_items i JOIN productos pr ON pr.id = i.producto_id
       WHERE i.pedido_id IN (?)`, [pedidos.map((p) => p.id)]);
    for (const p of pedidos) p.items = items.filter((i) => i.pedido_id === p.id);
  }
  res.json(pedidos);
}));

// El vendedor envía el pedido del cliente a caja
r.post('/', requiereAuth('vendedor'), ah(async (req, res) => {
  const { cliente_nombre, items } = req.body;
  if (!cliente_nombre?.trim()) throw err(400, 'Falta el nombre del cliente');
  if (!Array.isArray(items) || !items.length) throw err(400, 'El pedido no tiene productos');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let total = 0;
    const lineas = [];
    for (const it of items) {
      const cant = Number(it.cantidad);
      if (!(cant > 0)) throw err(400, 'Cantidad inválida');
      const [[pr]] = await conn.query(
        'SELECT id, nombre, precio, stock FROM productos WHERE id = ? AND activo = 1', [it.producto_id]);
      if (!pr) throw err(400, 'Producto no encontrado');
      if (cant > pr.stock) throw err(400, `Stock insuficiente de "${pr.nombre}" (disponible: ${pr.stock})`);
      // El precio se toma siempre de la base de datos, nunca del móvil
      const subtotal = r2(cant * pr.precio);
      total += subtotal;
      lineas.push([pr.id, cant, pr.precio, subtotal]);
    }
    const [ins] = await conn.query(
      'INSERT INTO pedidos (vendedor_id, cliente_nombre, total) VALUES (?,?,?)',
      [req.usuario.id, cliente_nombre.trim(), r2(total)]);
    await conn.query(
      'INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario, subtotal) VALUES ?',
      [lineas.map((l) => [ins.insertId, ...l])]);
    await conn.commit();

    const pedido = await obtenerPedido(pool, ins.insertId);
    // Tiempo real: llega a caja y a los dispositivos del vendedor
    emitirPedido('pedido:nuevo', pedido, pedido.vendedor_id);
    res.status(201).json(pedido);
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

// Anular un pedido pendiente (el vendedor dueño o caja)
r.post('/:id/anular', requiereAuth('vendedor', 'cajero'), ah(async (req, res) => {
  const p = await obtenerPedido(pool, req.params.id);
  if (!p) throw err(404, 'Pedido no encontrado');
  if (req.usuario.rol === 'vendedor' && p.vendedor_id !== req.usuario.id) {
    throw err(403, 'No puedes anular pedidos de otro vendedor');
  }
  const [upd] = await pool.query(
    "UPDATE pedidos SET estado = 'anulado' WHERE id = ? AND estado = 'pendiente'", [p.id]);
  if (!upd.affectedRows) throw err(409, 'El pedido ya no está pendiente');
  const datos = { id: p.id, estado: 'anulado', vendedor_id: p.vendedor_id };
  emitirPedido('pedido:anulado', datos, p.vendedor_id);
  res.json(datos);
}));

export default r;
