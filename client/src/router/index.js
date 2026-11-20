import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const rutas = [
  { path: '/login', component: () => import('../views/LoginView.vue'), meta: { publica: true } },
  { path: '/', redirect: () => (useAuthStore().rol === 'vendedor' ? '/pedidos' : '/caja') },
  { path: '/pedidos', component: () => import('../views/VendedorView.vue'), meta: { roles: ['vendedor'] } },
  { path: '/caja', component: () => import('../views/CajaView.vue'), meta: { roles: ['cajero'] } },
  { path: '/inventario', component: () => import('../views/InventarioView.vue'), meta: { roles: ['admin'] } },
  { path: '/empleados', component: () => import('../views/EmpleadosView.vue'), meta: { roles: ['admin'] } },
  { path: '/planilla', component: () => import('../views/PlanillaView.vue'), meta: { roles: ['admin'] } },
  { path: '/ventas', component: () => import('../views/VentasView.vue'), meta: { roles: ['admin'] } },
  { path: '/parametros', component: () => import('../views/ParametrosView.vue'), meta: { roles: ['admin'] } },
  { path: '/:resto(.*)*', redirect: '/' }
];

const router = createRouter({ history: createWebHistory(), routes: rutas });

// Guardia: exige sesión y valida el rol de cada vista (admin entra a todo)
router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.publica) return auth.logueado ? '/' : true;
  if (!auth.logueado) return '/login';
  const roles = to.meta.roles;
  if (roles && auth.rol !== 'admin' && !roles.includes(auth.rol)) return '/';
  return true;
});

export default router;
