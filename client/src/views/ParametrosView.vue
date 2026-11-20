<template>
  <v-container style="max-width: 760px">
    <div class="text-h6 mb-1">Parámetros</div>
    <div class="text-body-2 text-medium-emphasis mb-4">
      El porcentaje de comisión se aplica a las ventas que se cobren desde ahora; las facturas anteriores conservan el porcentaje con el que se emitieron.
    </div>

    <v-card v-for="p in editables" :key="p.clave" variant="flat" border class="mb-3">
      <v-card-text class="d-flex align-center ga-3">
        <div class="flex-grow-1">
          <div class="font-weight-medium">{{ p.clave }}</div>
          <div class="text-caption text-medium-emphasis">{{ p.descripcion }}</div>
        </div>
        <v-text-field v-model="p.valor" hide-details style="max-width: 200px" :suffix="p.clave === 'comision_porcentaje' ? '%' : ''" />
        <v-btn color="primary" variant="flat" :loading="guardando === p.clave" @click="guardar(p)">Guardar</v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, watchEffect } from 'vue';
import { useParametrosStore } from '../stores/parametros';
import { useUiStore } from '../stores/ui';

const parametros = useParametrosStore();
const ui = useUiStore();
const editables = ref([]);
const guardando = ref('');

// Copia local editable de los parámetros guardados
watchEffect(() => { editables.value = parametros.lista.map((p) => ({ ...p })); });

async function guardar(p) {
  guardando.value = p.clave;
  try {
    await parametros.guardar(p.clave, p.valor);
    ui.notificar('Parámetro guardado');
  } catch (e) {
    ui.notificar(e.message, 'error');
  } finally {
    guardando.value = '';
  }
}
</script>
