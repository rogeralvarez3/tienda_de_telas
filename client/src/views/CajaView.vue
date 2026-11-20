<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" lg="7">
        <div class="text-h6 mb-3">
          Pedidos por cobrar
          <v-chip class="ml-2" color="warning" size="small">{{ pedidos.pendientes.length }}</v-chip>
        </div>
        <div v-if="!pedidos.pendientes.length" class="text-medium-emphasis py-6">
          No hay pedidos pendientes. Los nuevos aparecerán aquí al instante.
        </div>
        <v-row>
          <v-col v-for="p in pedidos.pendientes" :key="p.id" cols="12" md="6">
            <PedidoCard :pedido="p" mostrar-vendedor>
              <v-btn color="primary" variant="flat" prepend-icon="mdi-cash" @click="abrirCobro(p)">Cobrar</v-btn>
              <v-spacer />
              <v-btn size="small" color="error" variant="text" @click="anular(p)">Anular</v-btn>
            </PedidoCard>
          </v-col>
        </v-row>
      </v-col>

      <v-col cols="12" lg="5">
        <div class="text-h6 mb-3">Cobrados hoy</div>
        <v-list border rounded="lg" lines="two">
          <v-list-item v-for="p in pedidos.cobrados" :key="p.id" :title="`${p.factura_numero} · ${p.cliente_nombre}`"
            :subtitle="`${hora(p.creado_en)} · ${p.vendedor_nombre}`">
            <template #append><span class="font-weight-medium">{{ moneda(p.total) }}</span></template>
          </v-list-item>
          <v-list-item v-if="!pedidos.cobrados.length" title="Todavía no hay cobros hoy" />
        </v-list>
        <div class="text-subtitle-1 mt-3">Total cobrado: {{ moneda(totalHoy) }}</div>
      </v-col>
    </v-row>

    <CobroDialog v-model="dialogo" :pedido="seleccionado" />
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import PedidoCard from '../components/PedidoCard.vue';
import CobroDialog from '../components/CobroDialog.vue';
import { usePedidosStore } from '../stores/pedidos';
import { useUiStore } from '../stores/ui';
import { moneda, hora } from '../utils/formato';

const pedidos = usePedidosStore();
const ui = useUiStore();
const dialogo = ref(false);
const seleccionado = ref(null);

onMounted(() => pedidos.cargar());

const totalHoy = computed(() => pedidos.cobrados.reduce((a, p) => a + p.total, 0));

function abrirCobro(p) {
  seleccionado.value = p;
  dialogo.value = true;
}

async function anular(p) {
  try { await pedidos.anular(p.id); ui.notificar(`Pedido #${p.id} anulado`); }
  catch (e) { ui.notificar(e.message, 'error'); }
}
</script>
