const fakeUsers = [
  { username: 'admin', password: 'admin', role: 'admin' },
  { username: 'manager', password: 'manager', role: 'manager' },
  { username: 'user', password: 'user', role: 'user' }
];

export const fakeApi = {
  login: async (username, password) => {
    await new Promise(r => setTimeout(r, 400));
    const u = fakeUsers.find(x => x.username === username && x.password === password);
    if (!u) throw new Error('Credenciales inválidas');
    const token = btoa(JSON.stringify({ username: u.username, role: u.role, iat: Date.now() }));
    return { token, user: { username: u.username, role: u.role } };
  },

  validateToken: async (token) => {
    try {
      const decoded = JSON.parse(atob(token));
      return { valid: true, user: { username: decoded.username, role: decoded.role } };
    } catch {
      return { valid: false };
    }
  }
};
