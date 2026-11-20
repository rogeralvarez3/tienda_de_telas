<template>
  <div>
    <v-text-field
      v-model="q" label="Buscar tela o accesorio" prepend-inner-icon="mdi-magnify"
      clearable hide-details
    />
    <v-list v-if="q" lines="two" class="mt-1 rounded-lg border" max-height="320" style="overflow-y: auto">
      <v-list-item
        v-for="p in resultados" :key="p.id" :title="p.nombre" :disabled="p.stock <= 0"
        :subtitle="`${p.codigo} · ${moneda(p.precio)} por ${p.unidad} · Stock: ${p.stock}`"
        @click="elegir(p)"
      >
        <template #append><v-icon color="secondary">mdi-plus-circle</v-icon></template>
      </v-list-item>
      <v-list-item v-if="!resultados.length" title="Sin resultados para esa búsqueda" />
    </v-list>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useProductosStore } from '../stores/productos';
import { moneda } from '../utils/formato';

const emit = defineEmits(['agregar']);
const productos = useProductosStore();
const q = ref('');

// Filtra por nombre o código; muestra máximo 15 resultados
const resultados = computed(() => {
  const t = (q.value || '').toLowerCase().trim();
  return productos.lista
    .filter((p) => p.nombre.toLowerCase().includes(t) || p.codigo.toLowerCase().includes(t))
    .slice(0, 15);
});

function elegir(p) {
  emit('agregar', p);
  q.value = '';
}
</script>
