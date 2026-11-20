import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { moneda, fechaHora } from './formato';

const COLOR = [43, 58, 103];
const DER = { halign: 'right' };

function encabezado(doc, tienda, titulo, subtitulo) {
  doc.setFontSize(16);
  doc.text(tienda, 14, 16);
  doc.setFontSize(12);
  doc.text(titulo, 14, 24);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(subtitulo, 14, 30);
  doc.setTextColor(0);
}

// Planilla por empleado + resumen general del periodo
export function planillaPdf(d, tienda) {
  const doc = new jsPDF();
  encabezado(doc, tienda, 'Planilla de empleados', `Periodo: ${d.periodo}`);

  autoTable(doc, {
    startY: 36,
    head: [['Empleado', 'Rol', 'Básico', 'Facturas', 'Ventas', 'Comisiones', 'Total a pagar']],
    body: d.empleados.map((e) => [
      e.nombre, e.rol, moneda(e.salario_basico), e.facturas,
      moneda(e.ventas), moneda(e.comisiones), moneda(e.total)
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: COLOR },
    columnStyles: { 2: DER, 3: DER, 4: DER, 5: DER, 6: DER }
  });

  const y = doc.lastAutoTable.finalY + 12;
  doc.setFontSize(12);
  doc.text('Resumen de la planilla', 14, y);
  autoTable(doc, {
    startY: y + 4,
    theme: 'plain',
    tableWidth: 100,
    styles: { fontSize: 10 },
    columnStyles: { 1: DER },
    body: [
      ['Empleados', d.resumen.empleados],
      ['Total salarios básicos', moneda(d.resumen.basico)],
      ['Total ventas', moneda(d.resumen.ventas)],
      ['Total comisiones', moneda(d.resumen.comisiones)],
      ['Total planilla a pagar', moneda(d.resumen.total)]
    ]
  });
  doc.save(`planilla-${d.periodo}.pdf`);
}

// Reporte de ventas del rango elegido
export function ventasPdf(d, etiqueta, tienda) {
  const doc = new jsPDF();
  encabezado(doc, tienda, 'Reporte de ventas', `${etiqueta} (${d.desde} a ${d.hasta})`);

  autoTable(doc, {
    startY: 36,
    theme: 'plain',
    tableWidth: 100,
    styles: { fontSize: 10 },
    columnStyles: { 1: DER },
    body: [
      ['Facturas emitidas', d.resumen.facturas],
      ['Total vendido', moneda(d.resumen.total)],
      ['Comisiones generadas', moneda(d.resumen.comisiones)]
    ]
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Vendedor', 'Facturas', 'Ventas', 'Comisión']],
    body: d.porVendedor.map((v) => [v.nombre, v.facturas, moneda(v.total), moneda(v.comision)]),
    headStyles: { fillColor: COLOR },
    styles: { fontSize: 9 },
    columnStyles: { 1: DER, 2: DER, 3: DER }
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Día', 'Facturas', 'Total']],
    body: d.porDia.map((x) => [x.fecha, x.facturas, moneda(x.total)]),
    headStyles: { fillColor: COLOR },
    styles: { fontSize: 9 },
    columnStyles: { 1: DER, 2: DER }
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Factura', 'Fecha', 'Cliente', 'Vendedor', 'Pago', 'Total']],
    body: d.facturas.map((f) => [f.numero, fechaHora(f.creada_en), f.cliente_nombre, f.vendedor, f.metodo_pago, moneda(f.total)]),
    headStyles: { fillColor: COLOR },
    styles: { fontSize: 8 },
    columnStyles: { 5: DER }
  });
  doc.save(`ventas-${d.desde}_${d.hasta}.pdf`);
}

// Factura en formato ticket (80 mm) con dinero recibido y cambio
export function facturaPdf(f, tienda) {
  const doc = new jsPDF({ unit: 'mm', format: [80, 95 + f.items.length * 9] });
  let y = 8;
  doc.setFontSize(12);
  doc.text(tienda, 40, y, { align: 'center' });
  doc.setFontSize(8);
  y += 6; doc.text(`Factura ${f.numero}`, 40, y, { align: 'center' });
  y += 4; doc.text(fechaHora(f.creada_en), 40, y, { align: 'center' });
  y += 6; doc.text(`Cliente: ${f.cliente_nombre}`, 4, y);
  y += 4; doc.text(`Vendedor: ${f.vendedor_nombre}`, 4, y);
  y += 4; doc.text(`Cajero: ${f.cajero_nombre}`, 4, y);
  y += 4; doc.line(4, y, 76, y);
  y += 5;
  for (const i of f.items) {
    doc.text(String(i.nombre).slice(0, 38), 4, y);
    y += 4;
    doc.text(`${i.cantidad} ${i.unidad} x ${moneda(i.precio_unitario)}`, 4, y);
    doc.text(moneda(i.subtotal), 76, y, { align: 'right' });
    y += 5;
  }
  doc.line(4, y, 76, y);
  y += 5;
  const fila = (txt, val, negrita) => {
    doc.setFont(undefined, negrita ? 'bold' : 'normal');
    doc.text(txt, 4, y);
    doc.text(val, 76, y, { align: 'right' });
    y += 5;
  };
  fila('TOTAL', moneda(f.total), true);
  fila(`Pago (${f.metodo_pago})`, moneda(f.recibido));
  fila('Cambio devuelto', moneda(f.cambio));
  doc.setFont(undefined, 'normal');
  y += 3;
  doc.text('¡Gracias por su compra!', 40, y, { align: 'center' });
  doc.save(`factura-${f.numero}.pdf`);
}
