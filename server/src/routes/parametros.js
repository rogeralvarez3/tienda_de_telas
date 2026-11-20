import { Router } from 'express';
import { pool } from '../db.js';
import { requiereAuth } from '../auth.js';
import { ah, err } from '../util.js';

const r = Router();

// Todos los usuarios pueden leer los parámetros (nombre de tienda, moneda...)
r.get('/', requiereAuth(), ah(async (req, res) => {
  const [filas] = await pool.query('SELECT * FROM parametros ORDER BY clave');
  res.json(filas);
}));

// Solo el administrador los modifica
r.put('/:clave', requiereAuth('admin'), ah(async (req, res) => {
  const { clave } = req.params;
  const valor = String(req.body.valor ?? '').trim();
  if (!valor) throw err(400, 'El valor no puede estar vacío');
  if (clave === 'comision_porcentaje') {
    const n = Number(valor);
    if (isNaN(n) || n < 0 || n > 100) throw err(400, 'La comisión debe estar entre 0 y 100');
  }
  const [r2] = await pool.query('UPDATE parametros SET valor = ? WHERE clave = ?', [valor, clave]);
  if (!r2.affectedRows) throw err(404, 'Parámetro no encontrado');
  res.json({ clave, valor });
}));

export default r;
