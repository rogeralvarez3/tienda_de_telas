<template>
  <v-dialog v-model="abierto" max-width="520">
    <v-card :title="form.id ? 'Editar producto' : 'Nuevo producto'">
      <v-card-text>
        <v-row dense>
          <v-col cols="6"><v-text-field v-model="form.codigo" label="Código" /></v-col>
          <v-col cols="6"><v-text-field v-model="form.categoria" label="Categoría" /></v-col>
          <v-col cols="12"><v-text-field v-model="form.nombre" label="Nombre" /></v-col>
          <v-col cols="6"><v-select v-model="form.unidad" :items="['metro', 'unidad', 'rollo', 'par']" label="Se vende por" /></v-col>
          <v-col cols="6"><v-text-field v-model="form.precio" type="number" min="0" label="Precio por unidad" /></v-col>
          <v-col cols="6"><v-text-field v-model="form.stock_minimo" type="number" min="0" label="Stock mínimo" /></v-col>
          <v-col v-if="!form.id" cols="6"><v-text-field v-model="form.stock" type="number" min="0" label="Stock inicial" /></v-col>
        </v-row>
        <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="abierto = false">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" :loading="guardando" @click="guardar">Guardar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useProductosStore } from '../stores/productos';

const abierto = defineModel();
const props = defineProps({ producto: Object });
const productos = useProductosStore();
const vacio = () => ({ codigo: '', nombre: '', categoria: '', unidad: 'metro', precio: '', stock: 0, stock_minimo: 0 });
const form = ref(vacio());
const error = ref('');
const guardando = ref(false);

watch(abierto, (v) => {
  if (v) { form.value = props.producto ? { ...props.producto } : vacio(); error.value = ''; }
});

async function guardar() {
  guardando.value = true;
  try {
    await productos.guardar(form.value);
    abierto.value = false;
  } catch (e) {
    error.value = e.message;
  } finally {
    guardando.value = false;
  }
}
</script>
