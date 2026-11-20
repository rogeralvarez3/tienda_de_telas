// Cliente HTTP mínimo (fetch) que añade el token y normaliza los errores
export async function api(ruta, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`/api${ruta}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Sesión vencida: la app cierra sesión y vuelve al login
    if (res.status === 401 && token) window.dispatchEvent(new Event('sesion-expirada'));
    throw new Error(datos.error || 'Error de comunicación con el servidor');
  }
  return datos;
}
