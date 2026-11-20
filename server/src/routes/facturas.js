import { Router } from 'express';
import { pool } from '../db.js';
import { requiereAuth } from '../auth.js';
import { emitirPedido, emitirTodos } from '../realtime.js';
import { ah, err, r2 } from '../util.js';

const r = Router();

// Factura completa con sus líneas (para mostrar o generar el PDF)
async function obtenerFactura(db, id) {
  const [[f]] = await db.query(
    `SELECT f.*, v.nombre AS vendedor_nombre, c.nombre AS cajero_nombre
     FROM facturas f
     JOIN usuarios v ON v.id = f.vendedor_id
     JOIN usuarios c ON c.id = f.cajero_id
     WHERE f.id = ?`, [id]);
  if (!f) return null;
  const [items] = await db.query(
    `SELECT i.cantidad, i.precio_unitario, i.subtotal, pr.nombre, pr.unidad
     FROM pedido_items i JOIN productos pr ON pr.id = i.producto_id WHERE i.pedido_id = ?`, [f.pedido_id]);
  f.items = items;
  return f;
}

// Cobro en caja: crea la factura, descuenta inventario y calcula la comisión
r.post('/cobrar', requiereAuth('cajero'), ah(async (req, res) => {
  const { pedido_id, metodo_pago = 'efectivo', recibido } = req.body;
  if (!['efectivo', 'tarjeta', 'transferencia'].includes(metodo_pago)) throw err(400, 'Método de pago inválido');

  const conn = await pool.getConnection();
  let facturaId, pedido;
  try {
    await conn.beginTransaction();

    // Bloqueamos el pedido para que dos cajas no lo cobren a la vez
    const [[p]] = await conn.query('SELECT * FROM pedidos WHERE id = ? FOR UPDATE', [pedido_id]);
    if (!p) throw err(404, 'Pedido no encontrado');
    if (p.estado !== 'pendiente') throw err(409, `El pedido ya está ${p.estado}`);
    pedido = p;

    const total = Number(p.total);
    // Solo en efectivo se registra dinero recibido y cambio; otros métodos pagan exacto
    const dinero = metodo_pago === 'efectivo' ? r2(recibido) : total;
    if (!(dinero >= total)) throw err(400, 'El dinero recibido es menor al total del pedido');
    const cambio = r2(dinero - total);

    // Descontar inventario (revalidando el stock actual)
    const [items] = await conn.query('SELECT * FROM pedido_items WHERE pedido_id = ?', [p.id]);
    for (const it of items) {
      const [[pr]] = await conn.query('SELECT nombre, stock FROM productos WHERE id = ? FOR UPDATE', [it.producto_id]);
      if (Number(it.cantidad) > pr.stock) {
        throw err(409, `Stock insuficiente de "${pr.nombre}" (disponible: ${pr.stock})`);
      }
      await conn.query('UPDATE productos SET stock = stock - ? WHERE id = ?', [it.cantidad, it.producto_id]);
      await conn.query(
        "INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, usuario_id) VALUES (?,'salida',?,?,?)",
        [it.producto_id, -it.cantidad, `Venta pedido #${p.id}`, req.usuario.id]);
    }

    // Comisión del vendedor según el porcentaje guardado en la tabla parametros
    const [[par]] = await conn.query("SELECT valor FROM parametros WHERE clave = 'comision_porcentaje'");
    const pct = Number(par?.valor || 0);
    const comision = r2((total * pct) / 100);

    const [ins] = await conn.query(
      `INSERT INTO facturas (pedido_id, cajero_id, vendedor_id, cliente_nombre, total, metodo_pago,
                             recibido, cambio, comision_porcentaje, comision_monto)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [p.id, req.usuario.id, p.vendedor_id, p.cliente_nombre, total, metodo_pago, dinero, cambio, pct, comision]);
    facturaId = ins.insertId;
    await conn.query('UPDATE facturas SET numero = ? WHERE id = ?', [`F-${String(facturaId).padStart(6, '0')}`, facturaId]);
    await conn.query("UPDATE pedidos SET estado = 'cobrado' WHERE id = ?", [p.id]);

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }

  const factura = await obtenerFactura(pool, facturaId);
  // Tiempo real: el vendedor ve su pedido cobrado y caja se sincroniza
  emitirPedido('pedido:cobrado', {
    pedido_id: pedido.id,
    vendedor_id: pedido.vendedor_id,
    cliente_nombre: pedido.cliente_nombre,
    total: pedido.total,
    factura_numero: factura.numero,
    comision_monto: factura.comision_monto,
    recibido: factura.recibido,
    cambio: factura.cambio
  }, pedido.vendedor_id);
  emitirTodos('inventario:actualizado');
  res.status(201).json(factura);
}));

r.get('/:id', requiereAuth('cajero'), ah(async (req, res) => {
  const f = await obtenerFactura(pool, req.params.id);
  if (!f) throw err(404, 'Factura no encontrada');
  res.json(f);
}));

export default r;
