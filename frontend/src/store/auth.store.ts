import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Singleton promise for refresh token rotation to prevent race conditions
let refreshPromise: Promise<boolean> | null = null;

interface User {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    isVerified: boolean;
    role?: string;
    hasGoogleAuth?: boolean;
    targetJobRoleId?: string | null;
    targetJobRole?: { id: string; title: string; category: string } | null;
    institutionId?: string | null;
    institution?: { id: string; name: string } | null;
}

interface AuthState {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<boolean>;
    googleLogin: (idToken: string) => Promise<boolean>;
    register: (email: string, password: string, name?: string, targetJobRoleId?: string, institutionId?: string) => Promise<boolean>;
    logout: () => void;
    refreshAccessToken: () => Promise<boolean>;
    clearError: () => void;
    updateTargetJobRole: (jobRoleId: string) => Promise<boolean>;
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isLoading: false,
            error: null,

            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`${API_URL}/auth/login`, {
                        method: 'POST',
                        credentials: 'include', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error?.message || 'Login failed');
                    }

                    set({
                        user: data.data.user,
                        isLoading: false
                    });

                    return true;
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Login failed',
                        isLoading: false
                    });
                    return false;
                }
            },

            googleLogin: async (idToken: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`${API_URL}/auth/google`, {
                        method: 'POST',
                        credentials: 'include', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ idToken })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error?.message || 'Google login failed');
                    }

                    set({
                        user: data.data.user,
                        isLoading: false
                    });

                    return true;
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Google login failed',
                        isLoading: false
                    });
                    return false;
                }
            },

            register: async (email: string, password: string, name?: string, targetJobRoleId?: string, institutionId?: string) => {
                set({ isLoading: true, error: null });
                try {
                    // Sanitize empty strings to undefined
                    const sanitizedJobRoleId = targetJobRoleId === '' || targetJobRoleId === 'other' ? undefined : targetJobRoleId;
                    const sanitizedInstId = institutionId === '' || institutionId === 'other' ? undefined : institutionId;

                    const response = await fetch(`${API_URL}/auth/register`, {
                        method: 'POST',
                        credentials: 'include', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email,
                            password,
                            name,
                            targetJobRoleId: sanitizedJobRoleId,
                            institutionId: sanitizedInstId
                        })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error?.message || 'Registration failed');
                    }

                    set({
                        user: data.data.user,
                        isLoading: false
                    });

                    return true;
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Registration failed',
                        isLoading: false
                    });
                    return false;
                }
            },

            logout: () => {
                // Call logout endpoint (cookies sent automatically)
                fetch(`${API_URL}/auth/logout`, {
                    method: 'POST',
                    credentials: 'include', headers: { 'Content-Type': 'application/json' }
                }).catch(() => { });

                set({ user: null });
            },

            refreshAccessToken: async () => {
                // If a refresh is already in progress, return the existing promise
                if (refreshPromise) {
                    return refreshPromise;
                }

                refreshPromise = (async () => {
                    try {
                        const response = await fetch(`${API_URL}/auth/refresh-token`, {
                            method: 'POST',
                            credentials: 'include', headers: { 'Content-Type': 'application/json' }
                        });

                        const data = await response.json();

                        if (!response.ok) {
                            if (response.status === 401 || response.status === 403) {
                                set({ user: null });
                            }
                            return false;
                        }

                        // Cookies updated automatically
                        return true;
                    } catch (error) {
                        // Network error - don't logout, just return false
                        console.error('[Auth] Network error during token refresh:', error);
                        return false;
                    } finally {
                        refreshPromise = null;
                    }
                })();

                return refreshPromise;
            },

            clearError: () => set({ error: null }),

            updateTargetJobRole: async (jobRoleId: string) => {
                const { user } = get();
                // Check user existence instead of token
                if (!user) return false;

                try {
                    const response = await fetch(`${API_URL}/users/me/target-role`, {
                        method: 'PUT',
                        credentials: 'include', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ targetJobRoleId: jobRoleId })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error?.message || 'Update failed');
                    }

                    set({
                        user: { ...user!, targetJobRoleId: jobRoleId, targetJobRole: data.data.targetJobRole }
                    });

                    return true;
                } catch (error) {
                    return false;
                }
            },

            // Hydration state
            _hasHydrated: false,
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state })
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            }
        }
    )
);

