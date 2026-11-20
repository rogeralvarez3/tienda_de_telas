# Tienda de Telas · Ventas, inventario, caja y planilla

Vue 3 + Vuetify + Vite + Pinia (cliente) · Node.js + Express + Socket.IO (servidor) · MySQL

## Puesta en marcha
1. Ten MySQL 5.0 o superior corriendo. Revisa `server/.env` (usuario `root` por defecto; cámbialo si usas otro).
   La app usa el paquete `mysql` (compatible con servidores antiguos). Si tu servidor usa contraseñas con hash
   moderno (MySQL 8) y falla el login, pon `DB_INSECURE_AUTH=false` y usa un usuario con `mysql_native_password`.
   Con MySQL 5.x verifica que InnoDB esté activo (`SHOW ENGINES;`): se necesita para las transacciones.
2. `npm run instalar`   (instala servidor y cliente)
3. `npm run seed`       (crea la base `tienda_telas`, tablas, usuarios y productos de ejemplo)
4. Desarrollo (dos terminales):
   - `npm run dev:server`  → API y tiempo real en :3000
   - `npm run dev:client`  → app en http://localhost:5173 (desde el móvil: `http://IP-DEL-PC:5173`)
5. Producción (un solo proceso): `npm run build` y luego `npm start` → http://IP-DEL-PC:3000

## Usuarios de ejemplo
| Usuario | Clave | Rol |
|---|---|---|
| admin | admin123 | Administrador (todo) |
| caja | caja123 | Cajero |
| vendedor1 / vendedor2 | venta123 | Vendedor |

Cambia las claves desde **Empleados** y el `JWT_SECRET` de `.env` antes de usarlo en serio.

## Flujo
1. El vendedor arma el pedido en el móvil (cliente + productos) y lo envía.
2. Caja lo recibe al instante (aviso sonoro), cobra indicando dinero recibido y ve el cambio.
3. Al cobrar se crea la factura, se descuenta el inventario y se calcula la comisión
   (`parametros.comision_porcentaje`). El móvil del vendedor se actualiza solo a "cobrado".
4. Admin: inventario, empleados, parámetros, reporte de ventas (día/semana/mes/intervalo) y planilla mensual
   (básico + comisiones por empleado y resumen), ambos con PDF.

## Estructura
- `server/schema.sql` tablas · `server/src/routes/*` API · `server/src/realtime.js` Socket.IO
- `client/src/stores` Pinia · `views` pantallas · `components` piezas reutilizables · `utils/pdf.js` PDF
