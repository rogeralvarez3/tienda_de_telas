<template>
  <v-dialog v-model="abierto" max-width="480">
    <v-card :title="form.id ? 'Editar empleado' : 'Nuevo empleado'">
      <v-card-text>
        <v-text-field v-model="form.nombre" label="Nombre completo" />
        <v-text-field v-model="form.usuario" label="Usuario de acceso" />
        <v-text-field
          v-model="form.password" type="password"
          :label="form.id ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'"
        />
        <v-select v-model="form.rol" :items="roles" label="Rol" />
        <v-text-field v-model="form.salario_basico" type="number" min="0" label="Salario básico mensual" />
        <v-switch v-if="form.id" v-model="form.activo" label="Empleado activo" color="secondary" hide-details />
        <v-alert v-if="error" type="error" variant="tonal" class="mt-2">{{ error }}</v-alert>
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
import { useEmpleadosStore } from '../stores/empleados';

const abierto = defineModel();
const props = defineProps({ empleado: Object });
const empleados = useEmpleadosStore();
const roles = [
  { title: 'Vendedor', value: 'vendedor' },
  { title: 'Cajero', value: 'cajero' },
  { title: 'Administrador', value: 'admin' }
];
const vacio = () => ({ nombre: '', usuario: '', password: '', rol: 'vendedor', salario_basico: 0, activo: true });
const form = ref(vacio());
const error = ref('');
const guardando = ref(false);

watch(abierto, (v) => {
  if (v) {
    form.value = props.empleado ? { ...props.empleado, password: '', activo: !!props.empleado.activo } : vacio();
    error.value = '';
  }
});

async function guardar() {
  guardando.value = true;
  try {
    await empleados.guardar(form.value);
    abierto.value = false;
  } catch (e) {
    error.value = e.message;
  } finally {
    guardando.value = false;
  }
}
</script>
