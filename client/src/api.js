import { supabase } from './supabase';

const rawApiBase = import.meta.env.VITE_API_BASE_URL;

if (!rawApiBase) {
    throw new Error('Missing VITE_API_BASE_URL. Set it in client/.env');
}

const API_BASE = rawApiBase.replace(/\/$/, '');

function qs(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') q.set(key, value);
    });
    const s = q.toString();
    return s ? `?${s}` : '';
}

async function getToken() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
        return null;
    }
    return data.session?.access_token ?? null;
}

async function request(path, options = {}) {
    const token = await getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
    });

    if (res.status === 401) {
        await supabase.auth.signOut();
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Request failed (${res.status})`);
    }

    if (res.status === 204) return null;
    return res.json();
}

export const api = {
    // Auth
    getMe: () => request('/auth/me'),
    clearPasswordChanged: () => request('/auth/password-changed', { method: 'POST' }),

    // Users
    getUsers: () => request('/users/'),
    createUser: (data) => request('/users/', { method: 'POST', body: JSON.stringify(data) }),
    updateUser: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),

    // Projects
    getProjects: () => request('/projects/'),
    getProject: (id) => request(`/projects/${id}`),
    createProject: (data) => request('/projects/', { method: 'POST', body: JSON.stringify(data) }),
    updateProject: (id, data) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),

    // Tasks
    getTasks: (params = {}) => request(`/tasks/${qs(params)}`),
    createTask: (data) => request('/tasks/', { method: 'POST', body: JSON.stringify(data) }),
    updateTask: (id, data) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),

    // Comments
    getComments: (taskId) => request(`/tasks/${taskId}/comments`),
    createComment: (taskId, data) =>
        request(`/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify(data) }),

    // Notifications
    getNotifications: () => request('/notifications/'),
    markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'POST' }),
    markAllNotificationsRead: () => request('/notifications/read-all', { method: 'POST' }),

    // Dashboard
    getDashboardStats: () => request('/dashboard/stats'),
    getActivity: (params = {}) => request(`/dashboard/activity${qs(params)}`),

    // Agent
    agentChat: (data) => request('/agent/chat', { method: 'POST', body: JSON.stringify(data) }),
};
