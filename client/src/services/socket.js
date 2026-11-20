import { io } from 'socket.io-client';
import { usePedidosStore } from '../stores/pedidos';
import { useProductosStore } from '../stores/productos';
import { useUiStore } from '../stores/ui';

let socket = null;

// Abre la conexión en tiempo real y conecta cada evento con su store
export function iniciarSocket(token) {
  if (socket) return socket;
  const pedidos = usePedidosStore();
  const productos = useProductosStore();
  const ui = useUiStore();

  socket = io({ auth: { token } });

  socket.on('connect', () => {
    ui.conectado = true;
    pedidos.cargar(); // al (re)conectar se resincroniza por si se perdió algún evento
  });
  socket.on('disconnect', () => { ui.conectado = false; });

  socket.on('pedido:nuevo', (p) => pedidos.recibirNuevo(p));
  socket.on('pedido:cobrado', (d) => pedidos.recibirCobrado(d));
  socket.on('pedido:anulado', (d) => pedidos.recibirAnulado(d));
  socket.on('inventario:actualizado', () => productos.cargar());
  return socket;
}

export function cerrarSocket() {
  socket?.disconnect();
  socket = null;
}
