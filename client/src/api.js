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
  // Read as text first so non-JSON responses (HTML error pages, 413, etc.) give clear errors
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; }
  catch {
    if (res.status === 413) throw new Error('Upload too large — try a smaller image.');
    throw new Error(`Server error (${res.status}). Please try again.`);
  }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  // Auth
  register: (body) => req('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => req('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => req('/api/auth/me'),
  updateMe: (body) => req('/api/auth/me', { method: 'PUT', body: JSON.stringify(body) }),
  checkUsername: (username) => req(`/api/auth/check-username?username=${encodeURIComponent(username)}`),
  deleteAccount: () => req('/api/auth/me', { method: 'DELETE' }),
  forgotPassword: (body) => req('/api/auth/forgot', { method: 'POST', body: JSON.stringify(body) }),
  resetPassword: (body) => req('/api/auth/reset', { method: 'POST', body: JSON.stringify(body) }),

  // Boats
  createBoat: (body) => req('/api/boats', { method: 'POST', body: JSON.stringify(body) }),
  getBoat: (id) => req(`/api/boats/${id}`),
  updateBoat: (id, body) => req(`/api/boats/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  uploadCertificate: (id, body = {}) => req(`/api/boats/${id}/upload-certificate`, { method: 'POST', body: JSON.stringify(body) }),
  deleteBoat: (id) => req(`/api/boats/${id}`, { method: 'DELETE' }),
  updateLocation: (id, body) => req(`/api/boats/${id}/update-location`, { method: 'POST', body: JSON.stringify(body) }),

  // Products
  listProducts: (params = {}) => req(`/api/products?${new URLSearchParams(params)}`),
  getProduct: (id) => req(`/api/products/${id}`),
  createProduct: (body) => req('/api/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id, body) => req(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProduct: (id) => req(`/api/products/${id}`, { method: 'DELETE' }),
  removeProduct: (id, reason) => req(`/api/products/${id}/remove`, { method: 'POST', body: JSON.stringify({ reason }) }),
  recordProductView: (id) => req(`/api/products/${id}/view`, { method: 'POST' }),
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

  // Admin
  adminStats: () => req('/api/admin/stats'),
  adminUsers: () => req('/api/admin/users'),
  adminListings: () => req('/api/admin/listings'),
  adminRemovals: () => req('/api/admin/analytics/removals'),
  adminPromote: (email) => req('/api/admin/promote', { method: 'POST', body: JSON.stringify({ email }) }),
  adminPendingCerts: () => req('/api/admin/certifications/pending'),
  adminApproveCert: (boatId) => req(`/api/admin/certifications/${boatId}/approve`, { method: 'POST' }),
  adminRejectCert: (boatId, reason) => req(`/api/admin/certifications/${boatId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Posts (chat feed)
  listPosts: (params = {}) => req(`/api/posts?${new URLSearchParams(params)}`),
  createPost: (body) => req('/api/posts', { method: 'POST', body: JSON.stringify(body) }),
  deletePost: (id) => req(`/api/posts/${id}`, { method: 'DELETE' }),
  trendingTags: () => req('/api/posts/_/tags/trending'),
  searchTags: (q) => req(`/api/posts/_/tags/search?q=${encodeURIComponent(q)}`),
  getPost: (id) => req(`/api/posts/${id}`),
  replyToPost: (id, body) => req(`/api/posts/${id}/reply`, { method: 'POST', body: JSON.stringify({ body }) }),
  reportPost: (id, reason) => req(`/api/posts/${id}/report`, { method: 'POST', body: JSON.stringify({ reason }) }),
  likePost: (id) => req(`/api/posts/${id}/like`, { method: 'POST' }),

  // Follows
  searchUsers: (q) => req(`/api/users/_search?q=${encodeURIComponent(q)}`),
  getPublicProfile: (userId) => req(`/api/users/${userId}`),
  follow: (userId) => req(`/api/users/${userId}/follow`, { method: 'POST' }),
  unfollow: (userId) => req(`/api/users/${userId}/follow`, { method: 'DELETE' }),
  following: (userId) => req(`/api/users/${userId}/following`),
  followers: (userId) => req(`/api/users/${userId}/followers`),
  isFollowing: (userId) => req(`/api/users/${userId}/is-following`),

  // Friends
  myFriends: () => req('/api/users/me/friends'),
  myFriendRequests: () => req('/api/users/me/friend-requests'),
  friendStatus: (userId) => req(`/api/users/${userId}/friend-status`),
  sendFriendRequest: (userId) => req(`/api/users/${userId}/friend-request`, { method: 'POST' }),
  acceptFriendRequest: (userId) => req(`/api/users/${userId}/friend-request/accept`, { method: 'PUT' }),
  declineFriendRequest: (userId) => req(`/api/users/${userId}/friend-request/decline`, { method: 'PUT' }),
  removeFriend: (userId) => req(`/api/users/${userId}/friend`, { method: 'DELETE' }),
};
