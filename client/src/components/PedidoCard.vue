<template>
  <v-card variant="flat" border :class="{ 'opacity-60': pedido.estado === 'anulado' }">
    <v-card-item>
      <template #prepend>
        <v-avatar :color="color" size="40" variant="tonal">
          <v-icon :icon="icono" />
        </v-avatar>
      </template>
      <v-card-title>{{ pedido.cliente_nombre }}</v-card-title>
      <v-card-subtitle>
        Pedido #{{ pedido.id }} · {{ hora(pedido.creado_en) }}
        <template v-if="mostrarVendedor"> · {{ pedido.vendedor_nombre }}</template>
      </v-card-subtitle>
      <template #append>
        <v-chip :color="color" size="small" variant="flat">{{ pedido.estado }}</v-chip>
      </template>
    </v-card-item>

    <v-card-text class="pt-0">
      <div v-for="i in pedido.items" :key="i.id" class="d-flex justify-space-between text-body-2">
        <span class="text-truncate mr-2">{{ i.cantidad }} {{ i.unidad }} · {{ i.nombre }}</span>
        <span>{{ moneda(i.subtotal) }}</span>
      </div>
      <v-divider class="my-2" />
      <div class="d-flex justify-space-between font-weight-medium">
        <span>Total</span><span>{{ moneda(pedido.total) }}</span>
      </div>
      <!-- Datos del cobro: se actualizan solos cuando caja cobra el pedido -->
      <div v-if="pedido.estado === 'cobrado'" class="text-caption text-medium-emphasis mt-2">
        Factura {{ pedido.factura_numero }} · Recibido {{ moneda(pedido.recibido) }} · Cambio {{ moneda(pedido.cambio) }}
        <div v-if="mostrarComision" class="text-secondary font-weight-medium">Tu comisión: {{ moneda(pedido.comision_monto) }}</div>
      </div>
    </v-card-text>

    <v-card-actions v-if="$slots.default"><slot /></v-card-actions>
  </v-card>
</template>

<script setup>
import { computed } from 'vue';
import { moneda, hora } from '../utils/formato';

const props = defineProps({
  pedido: { type: Object, required: true },
  mostrarVendedor: Boolean,
  mostrarComision: Boolean
});

const color = computed(() => ({ pendiente: 'warning', cobrado: 'secondary', anulado: 'grey' })[props.pedido.estado]);
const icono = computed(() => ({
  pendiente: 'mdi-clock-outline', cobrado: 'mdi-check-circle-outline', anulado: 'mdi-close-circle-outline'
})[props.pedido.estado]);
</script>
