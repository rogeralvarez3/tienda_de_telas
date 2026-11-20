import { defineStore } from 'pinia';
import { api } from '../services/api';
import { fijarSimbolo } from '../utils/formato';

export const useParametrosStore = defineStore('parametros', {
  state: () => ({ lista: [] }),
  getters: {
    valor: (s) => (clave, defecto = '') => s.lista.find((p) => p.clave === clave)?.valor ?? defecto,
    nombreTienda() { return this.valor('nombre_tienda', 'Tienda de Telas'); }
  },
  actions: {
    async cargar() {
      this.lista = await api('/parametros');
      fijarSimbolo(this.valor('simbolo_moneda', '$'));
    },
    async guardar(clave, valor) {
      await api(`/parametros/${clave}`, { method: 'PUT', body: { valor } });
      await this.cargar();
    }
  }
});
