const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
let authToken = null;

export const setApiToken = (token) => {
  authToken = token;
};

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed.' }));
    throw new Error(error.message || 'Request failed.');
  }

  return response.status === 204 ? null : response.json();
};

export const api = {
  bootstrap: () => request('/bootstrap'),
  list: (resource) => request(`/${resource}`),
  create: (resource, payload) =>
    request(`/${resource}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (resource, id, payload) =>
    request(`/${resource}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  remove: (resource, id) =>
    request(`/${resource}/${id}`, {
      method: 'DELETE',
    }),
  updateReviewStatus: (id, status) =>
    request(`/reviews/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  updateUserRole: (id, role) =>
    request(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
  updateSubmissionStatus: (id, status, reviewerNote = '') =>
    request(`/recipeSubmissions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reviewerNote }),
    }),
  updateMessageStatus: (id, status) =>
    request(`/contactMessages/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  subscribe: (email) =>
    request('/subscribers', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  submitContactMessage: (payload) =>
    request('/contactMessages', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  submitRecipeIdea: (payload) =>
    request('/recipeSubmissions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  saveRecipeNote: (payload) =>
    request('/recipeNotes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteRecipeNote: (recipeId) =>
    request(`/recipeNotes/by-recipe/${recipeId}`, {
      method: 'DELETE',
    }),
  me: () => request('/auth/me'),
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};
