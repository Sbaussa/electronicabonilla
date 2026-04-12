import api from './api';

// ——— AUTH ———
export const authService = {
  login:  (data)          => api.post('/auth/login', data).then(r => r.data),
  me:     ()              => api.get('/auth/me').then(r => r.data),
};

// ——— PRODUCTS ———
export const productService = {
  getAll:       (params)  => api.get('/products', { params }).then(r => r.data),
  getById:      (id)      => api.get(`/products/${id}`).then(r => r.data),
  create:       (data)    => api.post('/products', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  update:       (id, data)=> api.put(`/products/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  adjustStock:  (id, data)=> api.patch(`/products/${id}/stock`, data).then(r => r.data),
  delete:       (id)      => api.delete(`/products/${id}`).then(r => r.data),
};

// ——— CATEGORIES ———
export const categoryService = {
  getAll:  ()             => api.get('/categories').then(r => r.data),
  create:  (data)         => api.post('/categories', data).then(r => r.data),
  update:  (id, data)     => api.put(`/categories/${id}`, data).then(r => r.data),
  delete:  (id)           => api.delete(`/categories/${id}`).then(r => r.data),
};

// ——— CLIENTS ———
export const clientService = {
  getAll:  (params)       => api.get('/clients', { params }).then(r => r.data),
  getById: (id)           => api.get(`/clients/${id}`).then(r => r.data),
  create:  (data)         => api.post('/clients', data).then(r => r.data),
  update:  (id, data)     => api.put(`/clients/${id}`, data).then(r => r.data),
  delete:  (id)           => api.delete(`/clients/${id}`).then(r => r.data),
};

// ——— SALES ———
export const saleService = {
  getAll:  (params)       => api.get('/sales', { params }).then(r => r.data),
  getById: (id)           => api.get(`/sales/${id}`).then(r => r.data),
  create:  (data)         => api.post('/sales', data).then(r => r.data),
  cancel:  (id)           => api.patch(`/sales/${id}/cancel`).then(r => r.data),
};

// ——— REPAIRS ———
export const repairService = {
  getAll:        (params) => api.get('/repairs', { params }).then(r => r.data),
  getById:       (id)     => api.get(`/repairs/${id}`).then(r => r.data),
  create:        (data)   => api.post('/repairs', data).then(r => r.data),
  update:        (id, data)=> api.put(`/repairs/${id}`, data).then(r => r.data),
  changeStatus:  (id, data)=> api.patch(`/repairs/${id}/status`, data).then(r => r.data),
};

// ——— SUPPLIERS ———
export const supplierService = {
  getAll:  ()             => api.get('/suppliers').then(r => r.data),
  create:  (data)         => api.post('/suppliers', data).then(r => r.data),
  update:  (id, data)     => api.put(`/suppliers/${id}`, data).then(r => r.data),
  delete:  (id)           => api.delete(`/suppliers/${id}`).then(r => r.data),
};

// ——— USERS ———
export const userService = {
  getAll:          ()          => api.get('/users').then(r => r.data),
  create:          (data)      => api.post('/users', data).then(r => r.data),
  update:          (id, data)  => api.put(`/users/${id}`, data).then(r => r.data),
  changePassword:  (id, data)  => api.patch(`/users/${id}/password`, data).then(r => r.data),
};

// ——— REPORTS ———
export const reportService = {
  dashboard:  ()         => api.get('/reports/dashboard').then(r => r.data),
  sales:      (params)   => api.get('/reports/sales', { params }).then(r => r.data),
  inventory:  ()         => api.get('/reports/inventory').then(r => r.data),
  repairs:    (params)   => api.get('/reports/repairs', { params }).then(r => r.data),
};
