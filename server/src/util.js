// Envuelve handlers async para que los errores lleguen al manejador de Express
export const ah = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Crea un error HTTP con código de estado
export const err = (status, mensaje) =>
  Object.assign(new Error(mensaje), { status });

// Redondeo a 2 decimales para montos de dinero
export const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
