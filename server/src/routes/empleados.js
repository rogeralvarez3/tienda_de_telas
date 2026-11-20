import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { requiereAuth } from '../auth.js';
import { ah, err } from '../util.js';

const r = Router();
const ROLES = ['admin', 'cajero', 'vendedor'];
const COLUMNAS = 'id, nombre, usuario, rol, salario_basico, activo';

r.get('/', requiereAuth('admin'), ah(async (req, res) => {
  const [filas] = await pool.query(`SELECT ${COLUMNAS} FROM usuarios ORDER BY activo DESC, nombre`);
  res.json(filas);
}));

r.post('/', requiereAuth('admin'), ah(async (req, res) => {
  const { nombre, usuario, password, rol, salario_basico } = req.body;
  if (!nombre || !usuario || !password) throw err(400, 'Nombre, usuario y contraseña son obligatorios');
  if (!ROLES.includes(rol)) throw err(400, 'Rol inválido');
  const hash = await bcrypt.hash(password, 10);
  const [ins] = await pool.query(
    'INSERT INTO usuarios (nombre, usuario, password_hash, rol, salario_basico) VALUES (?,?,?,?,?)',
    [nombre.trim(), usuario.trim(), hash, rol, Number(salario_basico) || 0]
  );
  res.status(201).json({ id: ins.insertId });
}));

r.put('/:id', requiereAuth('admin'), ah(async (req, res) => {
  const { nombre, usuario, password, rol, salario_basico, activo } = req.body;
  const id = Number(req.params.id);
  if (!ROLES.includes(rol)) throw err(400, 'Rol inválido');
  if (id === req.usuario.id && !activo) throw err(400, 'No puedes desactivar tu propio usuario');
  await pool.query(
    'UPDATE usuarios SET nombre=?, usuario=?, rol=?, salario_basico=?, activo=? WHERE id=?',
    [nombre.trim(), usuario.trim(), rol, Number(salario_basico) || 0, activo ? 1 : 0, id]
  );
  // La contraseña solo se cambia si se envía una nueva
  if (password) {
    await pool.query('UPDATE usuarios SET password_hash=? WHERE id=?', [await bcrypt.hash(password, 10), id]);
  }
  res.json({ id });
}));

export default r;
