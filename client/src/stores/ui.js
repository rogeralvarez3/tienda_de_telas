import { defineStore } from 'pinia';

// Estado de interfaz: avisos (snackbar) y estado de la conexión en tiempo real
export const useUiStore = defineStore('ui', {
  state: () => ({
    conectado: false,
    snack: { visible: false, texto: '', color: 'success' }
  }),
  actions: {
    notificar(texto, color = 'success') {
      this.snack = { visible: true, texto, color };
    }
  }
});
