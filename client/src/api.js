const BASE = import.meta.env.VITE_API_URL || 'https://waterline-api.onrender.com';

async function req(path, opts = {}) {
  const token = localStorage.getItem('wl_token');
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

export const api = {
  // Auth
  register: (body) => req('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => req('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => req('/api/auth/me'),
  updateMe: (body) => req('/api/auth/me', { method: 'PUT', body: JSON.stringify(body) }),
  forgotPassword: (body) => req('/api/auth/forgot', { method: 'POST', body: JSON.stringify(body) }),
  resetPassword: (body) => req('/api/auth/reset', { method: 'POST', body: JSON.stringify(body) }),

  // Boats
  createBoat: (body) => req('/api/boats', { method: 'POST', body: JSON.stringify(body) }),
  getBoat: (id) => req(`/api/boats/${id}`),
  updateBoat: (id, body) => req(`/api/boats/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  uploadCertificate: (id) => req(`/api/boats/${id}/upload-certificate`, { method: 'POST' }),
  updateLocation: (id, body) => req(`/api/boats/${id}/update-location`, { method: 'POST', body: JSON.stringify(body) }),

  // Products
  listProducts: (params = {}) => req(`/api/products?${new URLSearchParams(params)}`),
  getProduct: (id) => req(`/api/products/${id}`),
  createProduct: (body) => req('/api/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id, body) => req(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProduct: (id) => req(`/api/products/${id}`, { method: 'DELETE' }),
  favoriteProduct: (id) => req(`/api/products/${id}/favorite`, { method: 'POST' }),
  unfavoriteProduct: (id) => req(`/api/products/${id}/favorite`, { method: 'DELETE' }),

  // Messages
  sendMessage: (body) => req('/api/messages', { method: 'POST', body: JSON.stringify(body) }),
  sendHail: (body) => req('/api/messages/hail', { method: 'POST', body: JSON.stringify(body) }),
  inbox: (params = {}) => req(`/api/messages?${new URLSearchParams(params)}`),
  conversation: (userId) => req(`/api/messages/conversation/${userId}`),
  markRead: (id) => req(`/api/messages/${id}/read`, { method: 'PUT' }),

  // Hazards
  listHazards: (params) => req(`/api/hazards?${new URLSearchParams(params)}`),
  reportHazard: (body) => req('/api/hazards', { method: 'POST', body: JSON.stringify(body) }),
  confirmHazard: (id) => req(`/api/hazards/${id}/confirm`, { method: 'POST' }),
  resolveHazard: (id) => req(`/api/hazards/${id}/resolve`, { method: 'POST' }),

  // Logbook
  getLogbook: (boatId, params = {}) => req(`/api/logbooks/boat/${boatId}?${new URLSearchParams(params)}`),
  createLogEntry: (body) => req('/api/logbooks', { method: 'POST', body: JSON.stringify(body) }),
  updateLogEntry: (id, body) => req(`/api/logbooks/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteLogEntry: (id) => req(`/api/logbooks/${id}`, { method: 'DELETE' }),

  // Follows
  follow: (userId) => req(`/api/users/${userId}/follow`, { method: 'POST' }),
  unfollow: (userId) => req(`/api/users/${userId}/follow`, { method: 'DELETE' }),
  following: (userId) => req(`/api/users/${userId}/following`),
  followers: (userId) => req(`/api/users/${userId}/followers`),
  isFollowing: (userId) => req(`/api/users/${userId}/is-following`),
};
