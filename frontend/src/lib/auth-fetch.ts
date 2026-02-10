'use client';

import { useAuthStore } from '@/store/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface FetchOptions extends RequestInit {
    skipAuth?: boolean;
    skipRefresh?: boolean;
}

/**
 * Authenticated fetch wrapper that automatically handles token refresh on 401 errors.
 * 
 * @param url - The API endpoint (can be relative like '/users/me' or full URL)
 * @param options - Fetch options with optional skipAuth and skipRefresh flags
 * @returns Promise with the fetch response
 */
export async function authFetch(
    url: string,
    options: FetchOptions = {}
): Promise<Response> {
    const { skipAuth = false, skipRefresh = false, ...fetchOptions } = options;

    // Build full URL if relative path provided
    const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;

    // Get current access token
    const { accessToken, refreshAccessToken, logout } = useAuthStore.getState();

    // Add authorization header if not skipping auth
    const headers = new Headers(fetchOptions.headers);
    if (!skipAuth && accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
    }

    // Make the initial request
    let response = await fetch(fullUrl, {
        ...fetchOptions,
        headers,
    });

    // If we get a 401 and haven't skipped refresh, try to refresh the token
    if (response.status === 401 && !skipRefresh && !skipAuth) {
        const refreshed = await refreshAccessToken();

        if (refreshed) {
            // Get the new access token after refresh
            const { accessToken: newToken } = useAuthStore.getState();

            // Retry the original request with new token
            headers.set('Authorization', `Bearer ${newToken}`);
            response = await fetch(fullUrl, {
                ...fetchOptions,
                headers,
            });
        } else {
            // Refresh failed, logout the user
            logout();
        }
    }

    return response;
}

/**
 * Helper to make authenticated JSON requests
 */
export async function authFetchJson<T = any>(
    url: string,
    options: FetchOptions = {}
): Promise<{ data: T | null; error: string | null; response: Response }> {
    try {
        const response = await authFetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        const json = await response.json();

        if (!response.ok) {
            return {
                data: null,
                error: json.error?.message || json.message || 'Request failed',
                response,
            };
        }

        return {
            data: json.data || json,
            error: null,
            response,
        };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Network error',
            response: new Response(null, { status: 0 }),
        };
    }
}
