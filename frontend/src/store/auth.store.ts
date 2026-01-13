import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface User {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    isVerified: boolean;
    role?: string;
    targetJobRoleId?: string | null;
    targetJobRole?: { id: string; title: string; category: string } | null;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<boolean>;
    register: (email: string, password: string, name?: string, targetJobRoleId?: string) => Promise<boolean>;
    logout: () => void;
    refreshAccessToken: () => Promise<boolean>;
    clearError: () => void;
    updateTargetJobRole: (jobRoleId: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isLoading: false,
            error: null,

            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`${API_URL}/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password }),
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error?.message || 'Login failed');
                    }

                    set({
                        user: data.data.user,
                        accessToken: data.data.accessToken,
                        refreshToken: data.data.refreshToken,
                        isLoading: false,
                    });

                    return true;
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Login failed',
                        isLoading: false,
                    });
                    return false;
                }
            },

            register: async (email: string, password: string, name?: string, targetJobRoleId?: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`${API_URL}/auth/register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password, name, targetJobRoleId }),
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error?.message || 'Registration failed');
                    }

                    set({
                        user: data.data.user,
                        accessToken: data.data.accessToken,
                        refreshToken: data.data.refreshToken,
                        isLoading: false,
                    });

                    return true;
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Registration failed',
                        isLoading: false,
                    });
                    return false;
                }
            },

            logout: () => {
                const { accessToken, refreshToken } = get();

                // Call logout endpoint
                if (accessToken) {
                    fetch(`${API_URL}/auth/logout`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accessToken}`,
                        },
                        body: JSON.stringify({ refreshToken }),
                    }).catch(() => {
                        // Ignore errors during logout
                    });
                }

                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                });
            },

            refreshAccessToken: async () => {
                const { refreshToken } = get();
                if (!refreshToken) return false;

                try {
                    const response = await fetch(`${API_URL}/auth/refresh-token`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refreshToken }),
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error('Token refresh failed');
                    }

                    set({
                        accessToken: data.data.accessToken,
                        refreshToken: data.data.refreshToken,
                    });

                    return true;
                } catch (error) {
                    set({
                        user: null,
                        accessToken: null,
                        refreshToken: null,
                    });
                    return false;
                }
            },

            clearError: () => set({ error: null }),

            updateTargetJobRole: async (jobRoleId: string) => {
                const { accessToken, user } = get();
                if (!accessToken) return false;

                try {
                    const response = await fetch(`${API_URL}/users/me/target-role`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accessToken}`,
                        },
                        body: JSON.stringify({ targetJobRoleId: jobRoleId }),
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error?.message || 'Update failed');
                    }

                    set({
                        user: { ...user!, targetJobRoleId: jobRoleId, targetJobRole: data.data.targetJobRole },
                    });

                    return true;
                } catch (error) {
                    return false;
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
            }),
        }
    )
);
