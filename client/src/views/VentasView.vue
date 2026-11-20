<template>
  <v-container fluid>
    <div class="d-flex align-center ga-3 mb-4 flex-wrap">
      <div class="text-h6">Reporte de ventas</div>
      <v-spacer />
      <v-btn v-if="datos" prepend-icon="mdi-file-pdf-box" @click="ventasPdf(datos, etiqueta, parametros.nombreTienda)">Descargar PDF</v-btn>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-calendar-search" @click="dialogo = true">Elegir periodo</v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>
    <div v-if="!datos && !error" class="text-medium-emphasis py-8 text-center">
      Elige un día, semana, mes o intervalo para generar el reporte.
    </div>

    <template v-if="datos">
      <div class="text-subtitle-1 mb-3">{{ etiqueta }} · {{ datos.desde }} a {{ datos.hasta }}</div>
      <v-row class="mb-2">
        <v-col cols="12" sm="4"><v-card variant="flat" border><v-card-text><div class="text-caption">Total vendido</div><div class="text-h5">{{ moneda(datos.resumen.total) }}</div></v-card-text></v-card></v-col>
        <v-col cols="12" sm="4"><v-card variant="flat" border><v-card-text><div class="text-caption">Facturas</div><div class="text-h5">{{ datos.resumen.facturas }}</div></v-card-text></v-card></v-col>
        <v-col cols="12" sm="4"><v-card variant="flat" border><v-card-text><div class="text-caption">Comisiones generadas</div><div class="text-h5">{{ moneda(datos.resumen.comisiones) }}</div></v-card-text></v-card></v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="6">
          <div class="text-subtitle-2 mb-2">Por vendedor</div>
          <v-data-table :headers="hVendedor" :items="datos.porVendedor" hide-default-footer border>
            <template #item.total="{ item }">{{ moneda(item.total) }}</template>
            <template #item.comision="{ item }">{{ moneda(item.comision) }}</template>
          </v-data-table>
        </v-col>
        <v-col cols="12" md="6">
          <div class="text-subtitle-2 mb-2">Por día</div>
          <v-data-table :headers="hDia" :items="datos.porDia" items-per-page="10" border>
            <template #item.total="{ item }">{{ moneda(item.total) }}</template>
          </v-data-table>
        </v-col>
      </v-row>

      <div class="text-subtitle-2 my-2">Detalle de facturas</div>
      <v-data-table :headers="hFactura" :items="datos.facturas" items-per-page="10" border>
        <template #item.creada_en="{ item }">{{ fechaHora(item.creada_en) }}</template>
        <template #item.total="{ item }">{{ moneda(item.total) }}</template>
      </v-data-table>
    </template>

    <ReporteVentasDialog v-model="dialogo" @generar="generar" />
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import ReporteVentasDialog from '../components/ReporteVentasDialog.vue';
import { api } from '../services/api';
import { useParametrosStore } from '../stores/parametros';
import { fechaHora, moneda } from '../utils/formato';
import { ventasPdf } from '../utils/pdf';

const parametros = useParametrosStore();
const dialogo = ref(false);
const datos = ref(null);
const etiqueta = ref('');
const error = ref('');

const hVendedor = [
  { title: 'Vendedor', key: 'nombre' },
  { title: 'Facturas', key: 'facturas', align: 'end' },
  { title: 'Ventas', key: 'total', align: 'end' },
  { title: 'Comisión', key: 'comision', align: 'end' }
];
const hDia = [
  { title: 'Día', key: 'fecha' },
  { title: 'Facturas', key: 'facturas', align: 'end' },
  { title: 'Total', key: 'total', align: 'end' }
];
const hFactura = [
  { title: 'Factura', key: 'numero' },
  { title: 'Fecha', key: 'creada_en' },
  { title: 'Cliente', key: 'cliente_nombre' },
  { title: 'Vendedor', key: 'vendedor' },
  { title: 'Pago', key: 'metodo_pago' },
  { title: 'Total', key: 'total', align: 'end' }
];

async function generar({ desde, hasta, etiqueta: texto }) {
  error.value = '';
  try {
    datos.value = await api(`/reportes/ventas?desde=${desde}&hasta=${hasta}`);
    etiqueta.value = texto;
  } catch (e) {
    error.value = e.message;
  }
}
</script>
