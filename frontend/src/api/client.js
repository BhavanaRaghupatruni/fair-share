const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    const detail = error.detail;
    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg || JSON.stringify(item)).join(', ')
      : detail || 'Request failed';
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  listGroups: () => request('/groups'),
  createGroup: (data) => request('/groups', { method: 'POST', body: JSON.stringify(data) }),
  getGroup: (groupId) => request(`/groups/${groupId}`),
  listGroupEvents: (groupId) => request(`/groups/${groupId}/events`),
  createEvent: (groupId, data) =>
    request(`/groups/${groupId}/events`, { method: 'POST', body: JSON.stringify(data) }),
  listDeposits: (groupId) => request(`/groups/${groupId}/deposits`),
  createDeposit: (groupId, data) =>
    request(`/groups/${groupId}/deposits`, { method: 'POST', body: JSON.stringify(data) }),
  getEvent: (eventId) => request(`/events/${eventId}`),
  addParticipant: (eventId, data) =>
    request(`/events/${eventId}/participants`, { method: 'POST', body: JSON.stringify(data) }),
  removeParticipant: (eventId, participantId) =>
    request(`/events/${eventId}/participants/${participantId}`, { method: 'DELETE' }),
  listExpenses: (eventId) => request(`/events/${eventId}/expenses`),
  createExpense: (eventId, data) =>
    request(`/events/${eventId}/expenses`, { method: 'POST', body: JSON.stringify(data) }),
  previewSplit: (eventId, data) =>
    request(`/events/${eventId}/expenses/preview-split`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export function formatCurrency(value) {
  return `$${Number(value).toFixed(2)}`;
}
