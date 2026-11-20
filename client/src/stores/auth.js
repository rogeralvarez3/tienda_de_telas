import { defineStore } from 'pinia';
import { api } from '../services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token'),
    usuario: JSON.parse(localStorage.getItem('usuario') || 'null')
  }),
  getters: {
    logueado: (s) => !!s.token,
    rol: (s) => s.usuario?.rol,
    esCajero: (s) => ['cajero', 'admin'].includes(s.usuario?.rol)
  },
  actions: {
    async login(usuario, password) {
      const d = await api('/auth/login', { method: 'POST', body: { usuario, password } });
      this.token = d.token;
      this.usuario = d.usuario;
      localStorage.setItem('token', d.token);
      localStorage.setItem('usuario', JSON.stringify(d.usuario));
    },
    logout() {
      this.token = null;
      this.usuario = null;
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
    }
  }
});
