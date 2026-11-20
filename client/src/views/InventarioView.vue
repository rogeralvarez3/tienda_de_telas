<template>
  <v-container fluid>
    <div class="d-flex align-center ga-3 mb-4 flex-wrap">
      <div class="text-h6">Inventario</div>
      <v-chip v-if="bajos" color="warning" size="small">{{ bajos }} con stock bajo</v-chip>
      <v-spacer />
      <v-text-field v-model="buscar" label="Buscar" prepend-inner-icon="mdi-magnify" hide-details clearable style="max-width: 260px" />
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="editar(null)">Nuevo producto</v-btn>
    </div>

    <v-data-table :headers="cabeceras" :items="productos.lista" :search="buscar" :loading="productos.cargando" items-per-page="25" border>
      <template #item.precio="{ item }">{{ moneda(item.precio) }}</template>
      <template #item.stock="{ item }">
        <v-chip :color="item.stock <= item.stock_minimo ? 'warning' : 'secondary'" size="small" variant="tonal">
          {{ item.stock }} {{ item.unidad }}
        </v-chip>
      </template>
      <template #item.acciones="{ item }">
        <v-btn icon="mdi-swap-vertical" size="small" variant="text" title="Ajustar stock" @click="ajustar(item)" />
        <v-btn icon="mdi-pencil-outline" size="small" variant="text" title="Editar" @click="editar(item)" />
        <v-btn icon="mdi-delete-outline" size="small" variant="text" color="error" title="Eliminar" @click="eliminar(item)" />
      </template>
    </v-data-table>

    <ProductoDialog v-model="dlgProducto" :producto="seleccionado" />
    <AjusteStockDialog v-model="dlgAjuste" :producto="seleccionado" />
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import ProductoDialog from '../components/ProductoDialog.vue';
import AjusteStockDialog from '../components/AjusteStockDialog.vue';
import { useProductosStore } from '../stores/productos';
import { useUiStore } from '../stores/ui';
import { moneda } from '../utils/formato';

const productos = useProductosStore();
const ui = useUiStore();
const buscar = ref('');
const dlgProducto = ref(false);
const dlgAjuste = ref(false);
const seleccionado = ref(null);

const cabeceras = [
  { title: 'Código', key: 'codigo' },
  { title: 'Producto', key: 'nombre' },
  { title: 'Categoría', key: 'categoria' },
  { title: 'Precio', key: 'precio', align: 'end' },
  { title: 'Stock', key: 'stock', align: 'end' },
  { title: '', key: 'acciones', sortable: false, align: 'end' }
];

const bajos = computed(() => productos.lista.filter((p) => p.stock <= p.stock_minimo).length);

onMounted(() => productos.cargar());

function editar(p) { seleccionado.value = p; dlgProducto.value = true; }
function ajustar(p) { seleccionado.value = p; dlgAjuste.value = true; }

async function eliminar(p) {
  if (!confirm(`¿Eliminar "${p.nombre}"? Se conservará su historial de ventas.`)) return;
  try { await productos.eliminar(p.id); ui.notificar('Producto eliminado'); }
  catch (e) { ui.notificar(e.message, 'error'); }
}
</script>
