import { defineStore } from 'pinia';
import { usePedidosStore } from './pedidos';

// Pedido que el vendedor está armando antes de enviarlo a caja
export const useCarritoStore = defineStore('carrito', {
  state: () => ({ cliente: '', items: [] }),
  getters: {
    total: (s) => Math.round(s.items.reduce((a, i) => a + (Number(i.cantidad) || 0) * i.precio, 0) * 100) / 100
  },
  actions: {
    agregar(p) {
      const it = this.items.find((i) => i.producto_id === p.id);
      if (it) it.cantidad = Math.round((Number(it.cantidad) + 1) * 100) / 100;
      else this.items.push({ producto_id: p.id, nombre: p.nombre, unidad: p.unidad, precio: p.precio, stock: p.stock, cantidad: 1 });
    },
    quitar(id) { this.items = this.items.filter((i) => i.producto_id !== id); },
    vaciar() { this.cliente = ''; this.items = []; },
    async enviar() {
      const pedido = await usePedidosStore().crear({
        cliente_nombre: this.cliente,
        items: this.items.map((i) => ({ producto_id: i.producto_id, cantidad: Number(i.cantidad) }))
      });
      this.vaciar();
      return pedido;
    }
  }
});
