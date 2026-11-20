<template>
  <v-container fluid>
    <div class="d-flex align-center ga-3 mb-4 flex-wrap">
      <div class="text-h6">Planilla de empleados</div>
      <v-spacer />
      <v-text-field v-model="periodo" type="month" label="Mes" hide-details style="max-width: 200px" />
      <v-btn color="primary" variant="flat" prepend-icon="mdi-file-pdf-box" :disabled="!datos" @click="planillaPdf(datos, parametros.nombreTienda)">
        Descargar PDF
      </v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>

    <template v-if="datos">
      <v-data-table :headers="cabeceras" :items="datos.empleados" :loading="cargando" items-per-page="50" border>
        <template #item.salario_basico="{ item }">{{ moneda(item.salario_basico) }}</template>
        <template #item.ventas="{ item }">{{ moneda(item.ventas) }}</template>
        <template #item.comisiones="{ item }">{{ moneda(item.comisiones) }}</template>
        <template #item.total="{ item }"><strong>{{ moneda(item.total) }}</strong></template>
      </v-data-table>

      <v-card variant="flat" border class="mt-4" max-width="460">
        <v-card-title class="text-subtitle-1">Resumen de la planilla</v-card-title>
        <v-card-text>
          <div v-for="[txt, val] in resumen" :key="txt" class="d-flex justify-space-between py-1">
            <span>{{ txt }}</span><span>{{ val }}</span>
          </div>
        </v-card-text>
      </v-card>
    </template>
  </v-container>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { api } from '../services/api';
import { useParametrosStore } from '../stores/parametros';
import { mesActual, moneda } from '../utils/formato';
import { planillaPdf } from '../utils/pdf';

const parametros = useParametrosStore();
const periodo = ref(mesActual());
const datos = ref(null);
const cargando = ref(false);
const error = ref('');

const cabeceras = [
  { title: 'Empleado', key: 'nombre' },
  { title: 'Rol', key: 'rol' },
  { title: 'Básico', key: 'salario_basico', align: 'end' },
  { title: 'Facturas', key: 'facturas', align: 'end' },
  { title: 'Ventas', key: 'ventas', align: 'end' },
  { title: 'Comisiones', key: 'comisiones', align: 'end' },
  { title: 'Total a pagar', key: 'total', align: 'end' }
];

const resumen = computed(() => !datos.value ? [] : [
  ['Empleados', datos.value.resumen.empleados],
  ['Total salarios básicos', moneda(datos.value.resumen.basico)],
  ['Total ventas', moneda(datos.value.resumen.ventas)],
  ['Total comisiones', moneda(datos.value.resumen.comisiones)],
  ['Total planilla a pagar', moneda(datos.value.resumen.total)]
]);

// Recalcula la planilla cada vez que cambia el mes
watch(periodo, async (v) => {
  if (!v) return;
  const [anio, mes] = v.split('-');
  cargando.value = true;
  error.value = '';
  try { datos.value = await api(`/reportes/planilla?anio=${anio}&mes=${Number(mes)}`); }
  catch (e) { error.value = e.message; }
  finally { cargando.value = false; }
}, { immediate: true });
</script>
