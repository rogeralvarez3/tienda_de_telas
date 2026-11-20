import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import { createVuetify } from 'vuetify';

// Paleta: índigo (tinte de tela), verde azulado (hilo) y ámbar (alfiler) para lo pendiente
export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#2B3A67',
          secondary: '#1F7A74',
          warning: '#D99A00',
          background: '#F5F4F8',
          surface: '#FFFFFF'
        }
      }
    }
  },
  defaults: {
    VBtn: { rounded: 'lg' },
    VTextField: { variant: 'outlined', density: 'comfortable' },
    VSelect: { variant: 'outlined', density: 'comfortable' }
  }
});
