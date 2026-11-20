import { Router } from 'express';
import { pool } from '../db.js';
import { requiereAuth } from '../auth.js';
import { ah, err, r2 } from '../util.js';

const r = Router();
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

// Reporte de ventas entre dos fechas (sirve para día, semana, mes o intervalo)
r.get('/ventas', requiereAuth('admin'), ah(async (req, res) => {
  const { desde, hasta } = req.query;
  if (!FECHA.test(desde) || !FECHA.test(hasta)) throw err(400, 'Fechas inválidas (use AAAA-MM-DD)');
  if (desde > hasta) throw err(400, 'La fecha inicial no puede ser mayor que la final');

  const [porVendedor] = await pool.query(
    `SELECT v.id, v.nombre, COUNT(*) AS facturas, SUM(f.total) AS total, SUM(f.comision_monto) AS comision
     FROM facturas f JOIN usuarios v ON v.id = f.vendedor_id
     WHERE DATE(f.creada_en) BETWEEN ? AND ?
     GROUP BY v.id, v.nombre ORDER BY total DESC`, [desde, hasta]);

  const [porDia] = await pool.query(
    `SELECT DATE(f.creada_en) AS fecha, COUNT(*) AS facturas, SUM(f.total) AS total
     FROM facturas f WHERE DATE(f.creada_en) BETWEEN ? AND ?
     GROUP BY DATE(f.creada_en) ORDER BY fecha`, [desde, hasta]);

  const [facturas] = await pool.query(
    `SELECT f.numero, f.creada_en, f.cliente_nombre, v.nombre AS vendedor, f.total, f.metodo_pago
     FROM facturas f JOIN usuarios v ON v.id = f.vendedor_id
     WHERE DATE(f.creada_en) BETWEEN ? AND ? ORDER BY f.id`, [desde, hasta]);

  const resumen = {
    facturas: porVendedor.reduce((a, x) => a + x.facturas, 0),
    total: r2(porVendedor.reduce((a, x) => a + x.total, 0)),
    comisiones: r2(porVendedor.reduce((a, x) => a + x.comision, 0))
  };
  res.json({ desde, hasta, resumen, porVendedor, porDia, facturas });
}));

// Planilla mensual: salario básico + comisiones de cada empleado
r.get('/planilla', requiereAuth('admin'), ah(async (req, res) => {
  const anio = Number(req.query.anio);
  const mes = Number(req.query.mes);
  if (!(anio >= 2000) || !(mes >= 1 && mes <= 12)) throw err(400, 'Periodo inválido');

  const pad = (n) => String(n).padStart(2, '0');
  const desde = `${anio}-${pad(mes)}-01`;
  const siguiente = mes === 12 ? `${anio + 1}-01-01` : `${anio}-${pad(mes + 1)}-01`;

  const [filas] = await pool.query(
    `SELECT u.id, u.nombre, u.rol, u.salario_basico,
            COUNT(f.id) AS facturas,
            COALESCE(SUM(f.total), 0) AS ventas,
            COALESCE(SUM(f.comision_monto), 0) AS comisiones
     FROM usuarios u
     LEFT JOIN facturas f ON f.vendedor_id = u.id AND f.creada_en >= ? AND f.creada_en < ?
     WHERE u.activo = 1 OR f.id IS NOT NULL
     GROUP BY u.id, u.nombre, u.rol, u.salario_basico
     ORDER BY u.nombre`, [desde, siguiente]);

  const empleados = filas.map((e) => ({ ...e, total: r2(e.salario_basico + e.comisiones) }));
  const suma = (campo) => r2(empleados.reduce((a, e) => a + e[campo], 0));
  res.json({
    periodo: `${anio}-${pad(mes)}`,
    empleados,
    resumen: {
      empleados: empleados.length,
      basico: suma('salario_basico'),
      ventas: suma('ventas'),
      comisiones: suma('comisiones'),
      total: suma('total')
    }
  });
}));

export default r;
