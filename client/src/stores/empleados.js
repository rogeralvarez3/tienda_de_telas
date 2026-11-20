import { defineStore } from 'pinia';
import { api } from '../services/api';

export const useEmpleadosStore = defineStore('empleados', {
  state: () => ({ lista: [] }),
  actions: {
    async cargar() { this.lista = await api('/empleados'); },
    async guardar(e) {
      if (e.id) await api(`/empleados/${e.id}`, { method: 'PUT', body: e });
      else await api('/empleados', { method: 'POST', body: e });
      await this.cargar();
    }
  }
});
