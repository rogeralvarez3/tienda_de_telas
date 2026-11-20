import { Server } from 'socket.io';
import { verificarToken } from './auth.js';

let io;

// Inicia Socket.IO sobre el mismo servidor HTTP. Cada conexión se autentica con el JWT.
export function iniciarTiempoReal(httpServer) {
  io = new Server(httpServer, { cors: { origin: true } });

  io.use((socket, next) => {
    try {
      socket.data.usuario = verificarToken(socket.handshake.auth?.token);
      next();
    } catch {
      next(new Error('No autorizado'));
    }
  });

  io.on('connection', (socket) => {
    const u = socket.data.usuario;
    // Caja recibe todos los pedidos; cada vendedor solo los suyos
    if (u.rol === 'cajero' || u.rol === 'admin') socket.join('caja');
    if (u.rol === 'vendedor' || u.rol === 'admin') socket.join(`vendedor:${u.id}`);
  });
}

// Envía un evento a caja y al vendedor dueño del pedido (una sola vez por socket)
export const emitirPedido = (evento, datos, vendedorId) =>
  io?.to('caja').to(`vendedor:${vendedorId}`).emit(evento, datos);

// Envía un evento a todos los conectados
export const emitirTodos = (evento, datos) => io?.emit(evento, datos);
