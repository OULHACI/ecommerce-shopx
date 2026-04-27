const BASE_URL = 'http://localhost:5000/api';

function getHeaders() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const headers = { 'Content-Type': 'application/json' };
  if (user) {
    headers['X-User-Id'] = user.id;
    headers['X-User-Role'] = user.role;
  }
  return headers;
}

async function request(method, path, body = null) {
  const opts = { method, headers: getHeaders() };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE_URL + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  register: (name, email, password, role) => request('POST', '/auth/register', { name, email, password, role }),

  // Products
  getProducts: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', `/products/?${q}`);
  },
  getProduct: (id) => request('GET', `/products/${id}`),
  createProduct: (data) => request('POST', '/products/', data),
  updateProduct: (id, data) => request('PUT', `/products/${id}`, data),
  deleteProduct: (id) => request('DELETE', `/products/${id}`),
  approveProduct: (id) => request('POST', `/products/${id}/approve`),
  rejectProduct: (id) => request('POST', `/products/${id}/reject`),
  getCategories: () => request('GET', '/products/categories'),
  getFavorites: () => request('GET', '/products/favorites'),
  toggleFavorite: (id) => request('POST', `/products/${id}/favorite`),

  // Orders
  placeOrder: (data) => request('POST', '/orders/', data),
  getMyOrders: () => request('GET', '/orders/my'),
  getAllOrders: () => request('GET', '/orders/all'),
  getSellerOrders: () => request('GET', '/orders/seller'),
  updateOrderStatus: (id, status) => request('PUT', `/orders/${id}/status`, { status }),
  confirmDelivery: (id) => request('POST', `/orders/${id}/confirm`),

  // Users (admin)
  getUsers: () => request('GET', '/users/'),
  updateUserRole: (id, role) => request('PUT', `/users/${id}/role`, { role }),
  toggleUserStatus: (id) => request('PUT', `/users/${id}/toggle-status`),

  // Notifications
  getNotifications: () => request('GET', '/notifications/'),
  markRead: (id) => request('PUT', `/notifications/${id}/read`),
  markAllRead: () => request('PUT', '/notifications/read-all'),

  // Admin
  getAnalytics: () => request('GET', '/admin/analytics'),
  sendNotification: (user_id, message) => request('POST', '/admin/notify', { user_id, message }),
};
