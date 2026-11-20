import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { firmar, requiereAuth } from '../auth.js';
import { ah, err } from '../util.js';

const r = Router();

// Inicio de sesión: devuelve un token JWT y los datos básicos del usuario
r.post('/login', ah(async (req, res) => {
  const { usuario, password } = req.body;
  const [[u]] = await pool.query('SELECT * FROM usuarios WHERE usuario = ? AND activo = 1', [usuario]);
  if (!u || !(await bcrypt.compare(password || '', u.password_hash))) {
    throw err(401, 'Usuario o contraseña incorrectos');
  }
  res.json({ token: firmar(u), usuario: { id: u.id, nombre: u.nombre, rol: u.rol } });
}));

r.get('/me', requiereAuth(), (req, res) => res.json(req.usuario));

export default r;
