<template>
  <v-dialog v-model="abierto" max-width="460">
    <v-card title="Reporte de ventas">
      <v-card-text>
        <v-radio-group v-model="tipo" inline hide-details class="mb-3">
          <v-radio label="Día" value="dia" />
          <v-radio label="Semana" value="semana" />
          <v-radio label="Mes" value="mes" />
          <v-radio label="Intervalo" value="intervalo" />
        </v-radio-group>

        <v-text-field v-if="tipo === 'dia'" v-model="fecha" type="date" label="Día" />
        <v-text-field v-else-if="tipo === 'semana'" v-model="fecha" type="date" label="Cualquier día de la semana (lunes a domingo)" />
        <v-text-field v-else-if="tipo === 'mes'" v-model="mes" type="month" label="Mes" />
        <v-row v-else dense>
          <v-col cols="6"><v-text-field v-model="desde" type="date" label="Desde" /></v-col>
          <v-col cols="6"><v-text-field v-model="hasta" type="date" label="Hasta" /></v-col>
        </v-row>

        <div class="text-caption text-medium-emphasis">Se incluirán las ventas del {{ rango[0] }} al {{ rango[1] }}.</div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="abierto = false">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" :disabled="!rangoValido" @click="generar">Generar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import { hoyISO, mesActual, rangoSemana, rangoMes } from '../utils/formato';

const abierto = defineModel();
const emit = defineEmits(['generar']);

const tipo = ref('dia');
const fecha = ref(hoyISO());
const mes = ref(mesActual());
const desde = ref(hoyISO());
const hasta = ref(hoyISO());

// Calcula el rango de fechas según la opción elegida
const rango = computed(() => {
  if (tipo.value === 'dia') return [fecha.value, fecha.value];
  if (tipo.value === 'semana') return fecha.value ? rangoSemana(fecha.value) : ['', ''];
  if (tipo.value === 'mes') return mes.value ? rangoMes(mes.value) : ['', ''];
  return [desde.value, hasta.value];
});
const rangoValido = computed(() => rango.value[0] && rango.value[1] && rango.value[0] <= rango.value[1]);
const etiquetas = { dia: 'Ventas del día', semana: 'Ventas de la semana', mes: 'Ventas del mes', intervalo: 'Ventas por intervalo' };

function generar() {
  emit('generar', { desde: rango.value[0], hasta: rango.value[1], etiqueta: etiquetas[tipo.value] });
  abierto.value = false;
}
</script>
