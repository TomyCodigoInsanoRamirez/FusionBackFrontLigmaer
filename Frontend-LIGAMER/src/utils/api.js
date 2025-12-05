// Utilidad simple para conectar con el backend usando fetch.
// Usa rutas relativas (/api/...) para aprovechar el proxy de Vite en desarrollo.
const API = {
  baseUrl: "http://localhost:8080", // URL de tu back-end // si está vacía usará rutas relativas

  async request(path, options = {}) {
    const headers = options.headers || {};
    if (options.json !== false) headers['Content-Type'] = 'application/json';

    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch((this.baseUrl || '') + path, {
      ...options,
      headers,
      body: options.body && options.json !== false ? JSON.stringify(options.body) : options.body,
    });

    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }

    if (!res.ok) {
      const err = (data && data.message) || data || text || res.statusText;
      throw new Error(err);
    }
    return data;
  },

  // POST /api/auth/login -> { accessToken }
  async login(email, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    // backend devuelve { accessToken }
    return data;
  },

  // GET /api/profile -> perfil del usuario (protegido)
  async getProfile() {
    return await this.request('/api/profile', { method: 'GET', json: false });
  },

  setToken(token) {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  },

  logout() {
    localStorage.removeItem('token');
  }
};

export default API;
