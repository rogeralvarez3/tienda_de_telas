import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { iniciarTiempoReal } from './realtime.js';
import authRoutes from './routes/auth.js';
import parametrosRoutes from './routes/parametros.js';
import empleadosRoutes from './routes/empleados.js';
import productosRoutes from './routes/productos.js';
import pedidosRoutes from './routes/pedidos.js';
import facturasRoutes from './routes/facturas.js';
import reportesRoutes from './routes/reportes.js';

const app = express();
const servidor = http.createServer(app);
iniciarTiempoReal(servidor);

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/parametros', parametrosRoutes);
app.use('/api/empleados', empleadosRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/facturas', facturasRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// En producción, el mismo servidor entrega el frontend compilado (client/dist)
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

// Manejador de errores central
app.use((e, req, res, next) => {
  if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe un registro con ese valor' });
  if (!e.status) console.error(e);
  res.status(e.status || 500).json({ error: e.status ? e.message : 'Error interno del servidor' });
});

const puerto = Number(process.env.PORT || 3000);
servidor.listen(puerto, '0.0.0.0', () => console.log(`Servidor listo en http://localhost:${puerto}`));
