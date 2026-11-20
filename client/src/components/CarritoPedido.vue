<template>
  <v-card variant="flat" border>
    <v-card-title class="text-subtitle-1">Pedido en preparación</v-card-title>
    <v-card-text>
      <v-text-field v-model="carrito.cliente" label="Nombre del cliente" prepend-inner-icon="mdi-account-outline" hide-details class="mb-3" />

      <div v-if="!carrito.items.length" class="text-medium-emphasis text-center py-4">
        Busca un producto arriba para agregarlo al pedido.
      </div>

      <div v-for="i in carrito.items" :key="i.producto_id" class="d-flex align-center ga-2 mb-2">
        <div class="flex-grow-1" style="min-width: 0">
          <div class="text-body-2 text-truncate">{{ i.nombre }}</div>
          <div class="text-caption text-medium-emphasis">{{ moneda(i.precio) }} por {{ i.unidad }}</div>
        </div>
        <v-text-field
          v-model="i.cantidad" type="number" min="0.1" step="0.5" :suffix="i.unidad"
          hide-details density="compact" style="max-width: 130px"
        />
        <div class="text-body-2 font-weight-medium" style="min-width: 90px; text-align: right">
          {{ moneda((Number(i.cantidad) || 0) * i.precio) }}
        </div>
        <v-btn icon="mdi-close" size="small" variant="text" @click="carrito.quitar(i.producto_id)" />
      </div>
    </v-card-text>
    <v-divider />
    <v-card-actions class="pa-4">
      <div class="text-h6">Total: {{ moneda(carrito.total) }}</div>
      <v-spacer />
      <v-btn color="primary" variant="flat" :disabled="!puedeEnviar" :loading="enviando" prepend-icon="mdi-send" @click="enviar">
        Enviar a caja
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useCarritoStore } from '../stores/carrito';
import { useUiStore } from '../stores/ui';
import { moneda } from '../utils/formato';

const emit = defineEmits(['enviado']);
const carrito = useCarritoStore();
const ui = useUiStore();
const enviando = ref(false);

const puedeEnviar = computed(() =>
  carrito.cliente.trim() && carrito.items.length && carrito.items.every((i) => Number(i.cantidad) > 0)
);

async function enviar() {
  enviando.value = true;
  try {
    const p = await carrito.enviar();
    ui.notificar(`Pedido #${p.id} enviado a caja`);
    emit('enviado');
  } catch (e) {
    ui.notificar(e.message, 'error');
  } finally {
    enviando.value = false;
  }
}
</script>
