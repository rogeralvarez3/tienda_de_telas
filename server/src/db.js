import mysql from 'mysql';

// Se usa el paquete "mysql" porque funciona con servidores MySQL antiguos (5.0, 5.1, 5.5...)
const grupo = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'tienda_telas',
  charset: 'UTF8_GENERAL_CI',
  connectionLimit: 10,
  dateStrings: true, // las fechas llegan como 'YYYY-MM-DD HH:MM:SS'
  insecureAuth: process.env.DB_INSECURE_AUTH === 'true',
  // Los DECIMAL llegan como texto desde este driver; se convierten a número
  typeCast(campo, siguiente) {
    if (campo.type === 'DECIMAL' || campo.type === 'NEWDECIMAL') {
      const valor = campo.string();
      return valor === null ? null : Number(valor);
    }
    return siguiente();
  }
});

// Convierte el estilo callback en promesas y devuelve [filas, campos]
const consultar = (origen) => (sql, params) =>
  new Promise((ok, fallo) =>
    origen.query(sql, params, (e, filas, campos) => (e ? fallo(e) : ok([filas, campos]))));

// Conexión individual (para transacciones)
function envolver(c) {
  return {
    query: consultar(c),
    beginTransaction: () => new Promise((ok, fallo) => c.beginTransaction((e) => (e ? fallo(e) : ok()))),
    commit: () => new Promise((ok, fallo) => c.commit((e) => (e ? fallo(e) : ok()))),
    // Si el rollback falla no se tapa el error original que lo provocó
    rollback: () => new Promise((ok) => c.rollback(() => ok())),
    release: () => c.release()
  };
}

export const pool = {
  query: consultar(grupo),
  getConnection: () =>
    new Promise((ok, fallo) => grupo.getConnection((e, c) => (e ? fallo(e) : ok(envolver(c)))))
};
