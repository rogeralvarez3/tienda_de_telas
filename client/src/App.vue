<template>
  <v-app>
    <template v-if="auth.logueado">
      <v-app-bar color="primary" density="comfortable" flat>
        <v-app-bar-nav-icon @click="drawer = !drawer" />
        <v-app-bar-title>{{ parametros.nombreTienda }}</v-app-bar-title>
        <v-icon
          :icon="ui.conectado ? 'mdi-access-point' : 'mdi-access-point-off'"
          :color="ui.conectado ? 'green-lighten-2' : 'red-lighten-2'"
          :title="ui.conectado ? 'Tiempo real activo' : 'Sin conexión en tiempo real'"
          class="mr-2"
        />
        <v-menu>
          <template #activator="{ props }">
            <v-btn v-bind="props" variant="text" prepend-icon="mdi-account-circle">
              <span class="d-none d-sm-inline">{{ auth.usuario.nombre }}</span>
            </v-btn>
          </template>
          <v-list>
            <v-list-item :subtitle="auth.usuario.rol" :title="auth.usuario.nombre" />
            <v-divider />
            <v-list-item prepend-icon="mdi-logout" title="Cerrar sesión" @click="salir" />
          </v-list>
        </v-menu>
      </v-app-bar>

      <v-navigation-drawer v-model="drawer" :mobile-breakpoint="960">
        <v-list nav>
          <v-list-item
            v-for="i in menu" :key="i.to" :to="i.to"
            :prepend-icon="i.icono" :title="i.titulo" color="primary"
            @click="!escritorio && (drawer = false)"
          />
        </v-list>
      </v-navigation-drawer>
    </template>

    <v-main><router-view /></v-main>

    <v-snackbar v-model="ui.snack.visible" :color="ui.snack.color" :timeout="5000" location="top">
      {{ ui.snack.texto }}
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { useAuthStore } from './stores/auth';
import { useUiStore } from './stores/ui';
import { useParametrosStore } from './stores/parametros';
import { useProductosStore } from './stores/productos';
import { iniciarSocket, cerrarSocket } from './services/socket';

const auth = useAuthStore();
const ui = useUiStore();
const parametros = useParametrosStore();
const productos = useProductosStore();
const router = useRouter();
const { mdAndUp: escritorio } = useDisplay();
// Menú lateral: abierto en pantallas anchas y cerrado en móvil (se abre con el botón de la barra)
const drawer = ref(escritorio.value);
watch(escritorio, (v) => { drawer.value = v; });

// Opciones del menú según el rol
const menu = computed(() =>
  [
    { titulo: 'Mis pedidos', to: '/pedidos', icono: 'mdi-clipboard-list-outline', roles: ['vendedor'] },
    { titulo: 'Caja', to: '/caja', icono: 'mdi-cash-register', roles: ['cajero'] },
    { titulo: 'Inventario', to: '/inventario', icono: 'mdi-package-variant-closed', roles: ['admin'] },
    { titulo: 'Empleados', to: '/empleados', icono: 'mdi-account-group-outline', roles: ['admin'] },
    { titulo: 'Planilla', to: '/planilla', icono: 'mdi-file-table-outline', roles: ['admin'] },
    { titulo: 'Ventas', to: '/ventas', icono: 'mdi-chart-line', roles: ['admin'] },
    { titulo: 'Parámetros', to: '/parametros', icono: 'mdi-cog-outline', roles: ['admin'] }
  ].filter((i) => auth.rol === 'admin' || i.roles.includes(auth.rol))
);

// Al iniciar sesión se abre la conexión en tiempo real y se cargan datos base
watch(
  () => auth.logueado,
  (activo) => {
    if (activo) {
      iniciarSocket(auth.token);
      parametros.cargar();
      productos.cargar();
    } else {
      cerrarSocket();
    }
  },
  { immediate: true }
);

function salir() {
  auth.logout();
  router.push('/login');
}

window.addEventListener('sesion-expirada', salir);
</script>
