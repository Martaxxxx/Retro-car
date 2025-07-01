/// <reference types="vite/client" />

export const API_CONFIG = {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5100',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
};

export const API_ENDPOINTS = {
    // Auth
    login: '/api/v1/auth/login',
    register: '/api/v1/auth/register',
    refreshToken: '/api/v1/auth/refresh-token',
    logout: '/api/v1/auth/logout',

    // Projects
    projects: '/api/v1/projects',
    projectById: (id: number) => `/api/v1/projects/${id}`,
    projectParts: (id: number) => `/api/v1/projects/${id}/parts`,

    // Users
    users: '/api/v1/users',
    usersByRole: (roleId: number) => `/api/v1/users/by-role/${roleId}`,

    // Parts
    partsByProject: (projectId: number) => `/api/v1/parts/project/${projectId}`,
    parts: '/api/v1/parts',

    // Purchases
    purchasesByProject: (projectId: number) => `/api/v1/purchases/project/${projectId}`,
    purchases: '/api/v1/purchases',
};