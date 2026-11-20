import { defineStore } from 'pinia';
import { api } from '../services/api';
import { useAuthStore } from './auth';
import { useUiStore } from './ui';
import { moneda } from '../utils/formato';
import { pitar } from '../utils/sonido';

export const usePedidosStore = defineStore('pedidos', {
  state: () => ({ lista: [], cargando: false }),
  getters: {
    // Caja atiende primero el pedido más antiguo
    pendientes: (s) => s.lista.filter((p) => p.estado === 'pendiente').sort((a, b) => a.id - b.id),
    cobrados: (s) => s.lista.filter((p) => p.estado === 'cobrado'),
    recientes: (s) => [...s.lista].sort((a, b) => b.id - a.id)
  },
  actions: {
    async cargar() {
      this.cargando = true;
      try { this.lista = await api('/pedidos'); } finally { this.cargando = false; }
    },
    // Inserta o reemplaza un pedido (idempotente: los eventos pueden repetirse)
    upsert(p) {
      const i = this.lista.findIndex((x) => x.id === p.id);
      if (i >= 0) this.lista[i] = { ...this.lista[i], ...p };
      else this.lista.unshift(p);
    },
    async crear(datos) {
      const p = await api('/pedidos', { method: 'POST', body: datos });
      this.upsert(p);
      return p;
    },
    async anular(id) {
      const d = await api(`/pedidos/${id}/anular`, { method: 'POST' });
      this.recibirAnulado(d);
    },
    async cobrar(datos) {
      const factura = await api('/facturas/cobrar', { method: 'POST', body: datos });
      this.recibirCobrado({
        pedido_id: factura.pedido_id,
        factura_numero: factura.numero,
        comision_monto: factura.comision_monto,
        recibido: factura.recibido,
        cambio: factura.cambio
      });
      return factura;
    },

    // ---- Eventos que llegan en tiempo real por Socket.IO ----
    recibirNuevo(p) {
      const existia = this.lista.some((x) => x.id === p.id);
      this.upsert(p);
      const auth = useAuthStore();
      // Caja recibe aviso sonoro cuando llega un pedido de otro usuario
      if (!existia && auth.esCajero && p.vendedor_id !== auth.usuario.id) {
        pitar();
        useUiStore().notificar(`Nuevo pedido de ${p.vendedor_nombre} para ${p.cliente_nombre} (${moneda(p.total)})`, 'warning');
      }
    },
    recibirCobrado(d) {
      const p = this.lista.find((x) => x.id === d.pedido_id);
      const yaCobrado = p?.estado === 'cobrado';
      if (p) {
        Object.assign(p, {
          estado: 'cobrado',
          factura_numero: d.factura_numero,
          comision_monto: d.comision_monto,
          recibido: d.recibido,
          cambio: d.cambio
        });
      }
      // El vendedor ve en su móvil que el cliente ya pagó
      const auth = useAuthStore();
      if (!yaCobrado && d.vendedor_id && d.vendedor_id === auth.usuario?.id) {
        useUiStore().notificar(`¡Pedido de ${d.cliente_nombre} cobrado! Comisión: ${moneda(d.comision_monto)}`);
      }
    },
    recibirAnulado(d) {
      const p = this.lista.find((x) => x.id === d.id);
      if (p) p.estado = 'anulado';
    }
  }
});
