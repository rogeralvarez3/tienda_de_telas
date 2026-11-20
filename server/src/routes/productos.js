import { Router } from 'express';
import { pool } from '../db.js';
import { requiereAuth } from '../auth.js';
import { emitirTodos } from '../realtime.js';
import { ah, err } from '../util.js';

const r = Router();

// Lista de productos activos (los vendedores la usan para armar pedidos)
r.get('/', requiereAuth(), ah(async (req, res) => {
  const [filas] = await pool.query('SELECT * FROM productos WHERE activo = 1 ORDER BY nombre');
  res.json(filas);
}));

r.post('/', requiereAuth('admin'), ah(async (req, res) => {
  const { codigo, nombre, categoria, unidad, precio, stock, stock_minimo } = req.body;
  if (!codigo || !nombre || !(Number(precio) >= 0)) throw err(400, 'Código, nombre y precio son obligatorios');
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [ins] = await conn.query(
      'INSERT INTO productos (codigo, nombre, categoria, unidad, precio, stock, stock_minimo) VALUES (?,?,?,?,?,?,?)',
      [codigo.trim(), nombre.trim(), categoria || null, unidad || 'unidad', Number(precio), Number(stock) || 0, Number(stock_minimo) || 0]
    );
    if (Number(stock) > 0) {
      await conn.query(
        "INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, usuario_id) VALUES (?,'entrada',?,?,?)",
        [ins.insertId, Number(stock), 'Stock inicial', req.usuario.id]
      );
    }
    await conn.commit();
    emitirTodos('inventario:actualizado');
    res.status(201).json({ id: ins.insertId });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

// Edita datos del producto (el stock se cambia solo con /ajuste para dejar historial)
r.put('/:id', requiereAuth('admin'), ah(async (req, res) => {
  const { codigo, nombre, categoria, unidad, precio, stock_minimo } = req.body;
  await pool.query(
    'UPDATE productos SET codigo=?, nombre=?, categoria=?, unidad=?, precio=?, stock_minimo=? WHERE id=?',
    [codigo.trim(), nombre.trim(), categoria || null, unidad || 'unidad', Number(precio), Number(stock_minimo) || 0, req.params.id]
  );
  emitirTodos('inventario:actualizado');
  res.json({ id: Number(req.params.id) });
}));

// "Eliminar" = desactivar, para conservar el historial de ventas
r.delete('/:id', requiereAuth('admin'), ah(async (req, res) => {
  await pool.query('UPDATE productos SET activo = 0 WHERE id = ?', [req.params.id]);
  emitirTodos('inventario:actualizado');
  res.json({ ok: true });
}));

// Ajuste de inventario: entrada (suma), salida (resta) o ajuste (fija el stock real)
r.post('/:id/ajuste', requiereAuth('admin'), ah(async (req, res) => {
  const { tipo, cantidad, motivo } = req.body;
  const cant = Number(cantidad);
  if (!['entrada', 'salida', 'ajuste'].includes(tipo)) throw err(400, 'Tipo de movimiento inválido');
  if (isNaN(cant) || cant < 0 || (tipo !== 'ajuste' && cant === 0)) throw err(400, 'Cantidad inválida');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[p]] = await conn.query('SELECT stock FROM productos WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!p) throw err(404, 'Producto no encontrado');
    // delta = variación real del stock (con signo)
    const delta = tipo === 'entrada' ? cant : tipo === 'salida' ? -cant : cant - p.stock;
    if (p.stock + delta < 0) throw err(400, 'El stock no puede quedar negativo');
    await conn.query('UPDATE productos SET stock = stock + ? WHERE id = ?', [delta, req.params.id]);
    await conn.query(
      'INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, usuario_id) VALUES (?,?,?,?,?)',
      [req.params.id, tipo, delta, motivo || null, req.usuario.id]
    );
    await conn.commit();
    emitirTodos('inventario:actualizado');
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

export default r;
