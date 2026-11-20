let simbolo = '$';
export const fijarSimbolo = (s) => { simbolo = s || '$'; };

export const moneda = (n) =>
  `${simbolo} ${Number(n || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Las fechas del servidor llegan como 'AAAA-MM-DD HH:MM:SS'
export const fechaHora = (s) => (s ? s.slice(0, 16) : '');
export const hora = (s) => (s ? s.slice(11, 16) : '');

const aISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const hoyISO = () => aISO(new Date());
export const mesActual = () => hoyISO().slice(0, 7);

// Semana de lunes a domingo que contiene la fecha indicada
export function rangoSemana(iso) {
  const d = new Date(`${iso}T00:00:00`);
  const inicio = new Date(d);
  inicio.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const fin = new Date(inicio);
  fin.setDate(inicio.getDate() + 6);
  return [aISO(inicio), aISO(fin)];
}

// Primer y último día de un mes 'AAAA-MM'
export function rangoMes(ym) {
  const [a, m] = ym.split('-').map(Number);
  return [`${ym}-01`, aISO(new Date(a, m, 0))];
}
