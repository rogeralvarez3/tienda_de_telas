<template>
  <v-container style="max-width: 760px">
    <v-tabs v-model="tab" color="primary" grow class="mb-4">
      <v-tab value="nuevo">Nuevo pedido</v-tab>
      <v-tab value="mios">
        Mis pedidos
        <v-badge v-if="pedidos.pendientes.length" :content="pedidos.pendientes.length" color="warning" inline />
      </v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="nuevo">
        <ProductoBuscador class="mb-4" @agregar="carrito.agregar" />
        <CarritoPedido @enviado="tab = 'mios'" />
      </v-window-item>

      <v-window-item value="mios">
        <div v-if="!pedidos.recientes.length" class="text-center text-medium-emphasis py-8">
          Aún no has enviado pedidos hoy.
        </div>
        <div class="d-flex flex-column ga-3">
          <PedidoCard v-for="p in pedidos.recientes" :key="p.id" :pedido="p" mostrar-comision>
            <v-btn v-if="p.estado === 'pendiente'" size="small" color="error" variant="text" @click="anular(p)">Anular pedido</v-btn>
          </PedidoCard>
        </div>
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import ProductoBuscador from '../components/ProductoBuscador.vue';
import CarritoPedido from '../components/CarritoPedido.vue';
import PedidoCard from '../components/PedidoCard.vue';
import { usePedidosStore } from '../stores/pedidos';
import { useCarritoStore } from '../stores/carrito';
import { useProductosStore } from '../stores/productos';
import { useUiStore } from '../stores/ui';

const pedidos = usePedidosStore();
const carrito = useCarritoStore();
const productos = useProductosStore();
const ui = useUiStore();
const tab = ref('nuevo');

onMounted(() => { pedidos.cargar(); productos.cargar(); });

async function anular(p) {
  try { await pedidos.anular(p.id); ui.notificar(`Pedido #${p.id} anulado`); }
  catch (e) { ui.notificar(e.message, 'error'); }
}
</script>
