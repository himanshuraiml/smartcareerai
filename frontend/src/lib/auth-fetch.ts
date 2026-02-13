'use client';

import { useAuthStore } from '@/store/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface FetchOptions extends RequestInit {
    skipAuth?: boolean;
    skipRefresh?: boolean;
}

/**
 * Adds the Authorization header from the auth store to the headers object.
 */
function applyAuthHeader(headers: Headers): void {
    const { accessToken } = useAuthStore.getState();
    if (accessToken && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${accessToken}`);
    }
}

/**
 * Authenticated fetch wrapper that automatically handles token refresh on 401 errors.
 */
export async function authFetch(
    url: string,
    options: FetchOptions = {}
): Promise<Response> {
    const { skipAuth = false, skipRefresh = false, ...fetchOptions } = options;

    // Build full URL if relative path provided
    const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;

    // Get auth actions
    const { refreshAccessToken, logout } = useAuthStore.getState();

    // Default headers
    const headers = new Headers(fetchOptions.headers);

    // Add Authorization header from stored token
    if (!skipAuth) {
        applyAuthHeader(headers);
    }

    // Make the initial request
    let response = await fetch(fullUrl, {
        ...fetchOptions,
        headers,
        credentials: 'include',
    });

    // If we get a 401 and haven't skipped refresh, try to refresh the token
    if (response.status === 401 && !skipRefresh && !skipAuth) {
        const refreshed = await refreshAccessToken();

        if (refreshed) {
            // Re-apply the new access token header
            const retryHeaders = new Headers(fetchOptions.headers);
            applyAuthHeader(retryHeaders);

            response = await fetch(fullUrl, {
                ...fetchOptions,
                headers: retryHeaders,
                credentials: 'include',
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
