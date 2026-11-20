<template>
  <v-dialog v-model="abierto" max-width="480" persistent>
    <v-card v-if="pedido">
      <!-- Paso 1: registrar el pago -->
      <template v-if="!factura">
        <v-card-title>Cobrar pedido #{{ pedido.id }}</v-card-title>
        <v-card-subtitle>{{ pedido.cliente_nombre }} · Vendedor: {{ pedido.vendedor_nombre }}</v-card-subtitle>
        <v-card-text>
          <div v-for="i in pedido.items" :key="i.id" class="d-flex justify-space-between text-body-2">
            <span>{{ i.cantidad }} {{ i.unidad }} · {{ i.nombre }}</span><span>{{ moneda(i.subtotal) }}</span>
          </div>
          <v-divider class="my-3" />
          <div class="text-h5 mb-4">Total a cobrar: {{ moneda(pedido.total) }}</div>

          <v-select v-model="metodo" :items="metodos" label="Método de pago" />
          <template v-if="metodo === 'efectivo'">
            <v-text-field v-model="recibido" type="number" min="0" step="any" label="Dinero recibido" autofocus />
            <v-btn size="small" variant="tonal" class="mb-3" @click="recibido = pedido.total">Monto exacto</v-btn>
            <v-alert :type="cambio >= 0 ? 'success' : 'warning'" variant="tonal" density="comfortable">
              <template v-if="cambio >= 0">Cambio a devolver: <strong>{{ moneda(cambio) }}</strong></template>
              <template v-else>Faltan {{ moneda(-cambio) }}</template>
            </v-alert>
          </template>
          <v-alert v-if="error" type="error" variant="tonal" class="mt-3">{{ error }}</v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="cerrar">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :disabled="!valido" :loading="cobrando" @click="cobrar">Confirmar cobro</v-btn>
        </v-card-actions>
      </template>

      <!-- Paso 2: cobro realizado -->
      <template v-else>
        <v-card-text class="text-center pt-8">
          <v-icon size="56" color="secondary">mdi-check-circle</v-icon>
          <div class="text-h6 mt-2">Factura {{ factura.numero }} emitida</div>
          <div class="text-body-2 text-medium-emphasis">El vendedor ya fue notificado en su móvil.</div>
          <div v-if="factura.metodo_pago === 'efectivo'" class="text-h4 mt-4">Cambio: {{ moneda(factura.cambio) }}</div>
        </v-card-text>
        <v-card-actions>
          <v-btn prepend-icon="mdi-file-pdf-box" @click="facturaPdf(factura, parametros.nombreTienda)">Descargar factura</v-btn>
          <v-spacer />
          <v-btn color="primary" variant="flat" @click="cerrar">Listo</v-btn>
        </v-card-actions>
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { usePedidosStore } from '../stores/pedidos';
import { useParametrosStore } from '../stores/parametros';
import { moneda } from '../utils/formato';
import { facturaPdf } from '../utils/pdf';

const abierto = defineModel();
const props = defineProps({ pedido: Object });
const pedidos = usePedidosStore();
const parametros = useParametrosStore();

const metodos = [
  { title: 'Efectivo', value: 'efectivo' },
  { title: 'Tarjeta', value: 'tarjeta' },
  { title: 'Transferencia', value: 'transferencia' }
];
const metodo = ref('efectivo');
const recibido = ref('');
const factura = ref(null);
const cobrando = ref(false);
const error = ref('');

// Cambio = dinero recibido - total (solo se muestra en efectivo)
const cambio = computed(() => Math.round(((Number(recibido.value) || 0) - (props.pedido?.total || 0)) * 100) / 100);
const valido = computed(() => metodo.value !== 'efectivo' || (recibido.value !== '' && cambio.value >= 0));

// Reinicia el formulario cada vez que se abre con un pedido distinto
watch(abierto, (v) => {
  if (v) { metodo.value = 'efectivo'; recibido.value = ''; factura.value = null; error.value = ''; }
});

async function cobrar() {
  cobrando.value = true;
  error.value = '';
  try {
    factura.value = await pedidos.cobrar({
      pedido_id: props.pedido.id,
      metodo_pago: metodo.value,
      recibido: metodo.value === 'efectivo' ? Number(recibido.value) : props.pedido.total
    });
  } catch (e) {
    error.value = e.message;
  } finally {
    cobrando.value = false;
  }
}

const cerrar = () => { abierto.value = false; };
</script>
