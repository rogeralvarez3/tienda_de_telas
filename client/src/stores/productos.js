import { defineStore } from 'pinia';
import { api } from '../services/api';

export const useProductosStore = defineStore('productos', {
  state: () => ({ lista: [], cargando: false }),
  actions: {
    async cargar() {
      this.cargando = true;
      try { this.lista = await api('/productos'); } finally { this.cargando = false; }
    },
    async guardar(p) {
      if (p.id) await api(`/productos/${p.id}`, { method: 'PUT', body: p });
      else await api('/productos', { method: 'POST', body: p });
      await this.cargar();
    },
    async eliminar(id) {
      await api(`/productos/${id}`, { method: 'DELETE' });
      await this.cargar();
    },
    async ajustar(id, datos) {
      await api(`/productos/${id}/ajuste`, { method: 'POST', body: datos });
      await this.cargar();
    }
  }
});
