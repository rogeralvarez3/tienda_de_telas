<template>
  <v-dialog v-model="abierto" max-width="420">
    <v-card :title="`Ajustar stock: ${producto?.nombre ?? ''}`" :subtitle="`Stock actual: ${producto?.stock ?? 0} ${producto?.unidad ?? ''}`">
      <v-card-text>
        <v-select v-model="form.tipo" :items="tipos" label="Tipo de movimiento" />
        <v-text-field
          v-model="form.cantidad" type="number" min="0" step="any"
          :label="form.tipo === 'ajuste' ? 'Stock real contado' : 'Cantidad'"
        />
        <v-text-field v-model="form.motivo" label="Motivo (opcional)" />
        <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="abierto = false">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" :loading="guardando" :disabled="form.cantidad === ''" @click="guardar">Aplicar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useProductosStore } from '../stores/productos';
import { useUiStore } from '../stores/ui';

const abierto = defineModel();
const props = defineProps({ producto: Object });
const productos = useProductosStore();
const ui = useUiStore();
const tipos = [
  { title: 'Entrada (llegó mercancía)', value: 'entrada' },
  { title: 'Salida (merma / daño)', value: 'salida' },
  { title: 'Ajuste (fijar stock contado)', value: 'ajuste' }
];
const form = ref({ tipo: 'entrada', cantidad: '', motivo: '' });
const error = ref('');
const guardando = ref(false);

watch(abierto, (v) => { if (v) { form.value = { tipo: 'entrada', cantidad: '', motivo: '' }; error.value = ''; } });

async function guardar() {
  guardando.value = true;
  try {
    await productos.ajustar(props.producto.id, { ...form.value, cantidad: Number(form.value.cantidad) });
    ui.notificar('Inventario actualizado');
    abierto.value = false;
  } catch (e) {
    error.value = e.message;
  } finally {
    guardando.value = false;
  }
}
</script>
