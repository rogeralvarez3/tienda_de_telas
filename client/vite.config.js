import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';

// En desarrollo, el front (5173) reenvía /api y /socket.io al servidor Node (3000)
export default defineConfig({
  plugins: [vue(), vuetify({ autoImport: true })],
  server: {
    host: true, // permite abrirlo desde el móvil en la misma red wifi
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/socket.io': { target: 'http://localhost:3000', ws: true }
    }
  }
});
