<template>
  <v-container fluid>
    <div class="d-flex align-center mb-4">
      <div class="text-h6">Empleados</div>
      <v-spacer />
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="editar(null)">Nuevo empleado</v-btn>
    </div>

    <v-data-table :headers="cabeceras" :items="empleados.lista" items-per-page="25" border>
      <template #item.salario_basico="{ item }">{{ moneda(item.salario_basico) }}</template>
      <template #item.activo="{ item }">
        <v-chip :color="item.activo ? 'secondary' : 'grey'" size="small" variant="tonal">{{ item.activo ? 'Activo' : 'Inactivo' }}</v-chip>
      </template>
      <template #item.acciones="{ item }">
        <v-btn icon="mdi-pencil-outline" size="small" variant="text" @click="editar(item)" />
      </template>
    </v-data-table>

    <EmpleadoDialog v-model="dialogo" :empleado="seleccionado" />
  </v-container>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import EmpleadoDialog from '../components/EmpleadoDialog.vue';
import { useEmpleadosStore } from '../stores/empleados';
import { moneda } from '../utils/formato';

const empleados = useEmpleadosStore();
const dialogo = ref(false);
const seleccionado = ref(null);

const cabeceras = [
  { title: 'Nombre', key: 'nombre' },
  { title: 'Usuario', key: 'usuario' },
  { title: 'Rol', key: 'rol' },
  { title: 'Salario básico', key: 'salario_basico', align: 'end' },
  { title: 'Estado', key: 'activo' },
  { title: '', key: 'acciones', sortable: false, align: 'end' }
];

onMounted(() => empleados.cargar());
function editar(e) { seleccionado.value = e; dialogo.value = true; }
</script>
