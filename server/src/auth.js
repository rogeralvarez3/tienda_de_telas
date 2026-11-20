import jwt from 'jsonwebtoken';

export const firmar = (u) =>
  jwt.sign({ id: u.id, nombre: u.nombre, rol: u.rol }, process.env.JWT_SECRET, { expiresIn: '12h' });

export const verificarToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

// Middleware: exige sesión y, opcionalmente, uno de los roles indicados.
// El rol "admin" siempre tiene acceso.
export function requiereAuth(...roles) {
  return (req, res, next) => {
    const cabecera = req.headers.authorization || '';
    const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'No autenticado' });
    try {
      req.usuario = verificarToken(token);
    } catch {
      return res.status(401).json({ error: 'Sesión inválida o expirada' });
    }
    if (roles.length && req.usuario.rol !== 'admin' && !roles.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'No tienes permiso para esta acción' });
    }
    next();
  };
}
