const API_BASE = (import.meta as any).env?.PUBLIC_API_BASE || 'http://localhost:8080/api';

// Auth token management
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('helpdesk_token');
}

export function setToken(token: string): void {
  localStorage.setItem('helpdesk_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('helpdesk_token');
}

export function getUser(): any | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('helpdesk_user');
  return data ? JSON.parse(data) : null;
}

export function setUser(user: any): void {
  localStorage.setItem('helpdesk_user', JSON.stringify(user));
}

export function removeUser(): void {
  localStorage.removeItem('helpdesk_user');
}

export function logout(): void {
  removeToken();
  removeUser();
  window.location.href = '/';
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// HTTP helpers
async function request(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    logout();
    throw new Error('Session expired. Please log in again.');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }

  return data;
}

// Auth API
export async function login(email: string, password: string) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  setUser(data.user);
  return data;
}

// Ticket API
export async function createTicket(ticket: {
  title: string;
  description: string;
  category: string;
  priority: string;
}) {
  return request('/tickets', {
    method: 'POST',
    body: JSON.stringify(ticket),
  });
}

export async function getMyTickets() {
  return request('/tickets/my');
}

export async function getAllTickets(filters?: {
  status?: string;
  priority?: string;
  category?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.priority) params.set('priority', filters.priority);
  if (filters?.category) params.set('category', filters.category);
  const qs = params.toString();
  return request(`/tickets${qs ? `?${qs}` : ''}`);
}

export async function getTicket(id: number) {
  return request(`/tickets/${id}`);
}

export async function updateTicket(id: number, data: { status?: string; assignedTo?: number }) {
  return request(`/tickets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function getTicketHistory(id: number) {
  return request(`/tickets/${id}/history`);
}

export async function getDashboardMetrics() {
  return request('/tickets/dashboard/metrics');
}

// User API
export async function getCurrentUser() {
  return request('/users/me');
}

export async function getTechnicians() {
  return request('/users/technicians');
}
