<template>
  <v-container class="fill-height" style="max-width: 420px">
    <v-card width="100%" class="pa-4" border flat>
      <v-card-title class="text-h5">{{ parametros.nombreTienda }}</v-card-title>
      <v-card-subtitle>Ingresa con tu usuario</v-card-subtitle>
      <v-card-text class="pt-6">
        <v-text-field v-model="usuario" label="Usuario" prepend-inner-icon="mdi-account-outline" autofocus @keyup.enter="entrar" />
        <v-text-field v-model="password" type="password" label="Contraseña" prepend-inner-icon="mdi-lock-outline" @keyup.enter="entrar" />
        <v-alert v-if="error" type="error" variant="tonal" class="mb-3">{{ error }}</v-alert>
        <v-btn block color="primary" variant="flat" size="large" :loading="cargando" @click="entrar">Entrar</v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useParametrosStore } from '../stores/parametros';

const auth = useAuthStore();
const parametros = useParametrosStore();
const router = useRouter();
const usuario = ref('');
const password = ref('');
const error = ref('');
const cargando = ref(false);

async function entrar() {
  cargando.value = true;
  error.value = '';
  try {
    await auth.login(usuario.value, password.value);
    router.push('/');
  } catch (e) {
    error.value = e.message;
  } finally {
    cargando.value = false;
  }
}
</script>
