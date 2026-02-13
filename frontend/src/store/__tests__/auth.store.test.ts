import { act } from '@testing-library/react';
import { useAuthStore } from '../auth.store';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Helper to reset store between tests
const resetStore = () => {
    const initialState = useAuthStore.getState();
    useAuthStore.setState({
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: null,
        _hasHydrated: false});
};

describe('AuthStore', () => {
    beforeEach(() => {
        resetStore();
        mockFetch.mockClear();
    });

    describe('Initial state', () => {
        it('has correct initial values', () => {
            const state = useAuthStore.getState();
            expect(state.user).toBeNull();
            expect(state.accessToken).toBeNull();
            expect(state.refreshToken).toBeNull();
            expect(state.isLoading).toBe(false);
            expect(state.error).toBeNull();
        });
    });

    describe('login', () => {
        it('successfully logs in user', async () => {
            const mockUser = {
                id: '123',
                email: 'test@example.com',
                name: 'Test User',
                avatarUrl: null,
                isVerified: true};

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    data: {
                        user: mockUser,
                        accessToken: 'mock-access-token',
                        refreshToken: 'mock-refresh-token'}})});

            const { login } = useAuthStore.getState();
            const result = await act(async () => {
                return await login('test@example.com', 'password123');
            });

            expect(result).toBe(true);

            const state = useAuthStore.getState();
            expect(state.user).toEqual(mockUser);
            expect(state.accessToken).toBe('mock-access-token');
            expect(state.refreshToken).toBe('mock-refresh-token');
            expect(state.isLoading).toBe(false);
            expect(state.error).toBeNull();
        });

        it('handles login failure', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({
                    error: { message: 'Invalid credentials' }})});

            const { login } = useAuthStore.getState();
            const result = await act(async () => {
                return await login('test@example.com', 'wrongpassword');
            });

            expect(result).toBe(false);

            const state = useAuthStore.getState();
            expect(state.user).toBeNull();
            expect(state.accessToken).toBeNull();
            expect(state.error).toBe('Invalid credentials');
            expect(state.isLoading).toBe(false);
        });

        it('handles network error', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const { login } = useAuthStore.getState();
            const result = await act(async () => {
                return await login('test@example.com', 'password123');
            });

            expect(result).toBe(false);

            const state = useAuthStore.getState();
            expect(state.error).toBe('Network error');
        });

        it('sets loading state during login', async () => {
            let resolvePromise: (value: any) => void;
            const promise = new Promise((resolve) => {
                resolvePromise = resolve;
            });

            mockFetch.mockReturnValueOnce(promise);

            const { login } = useAuthStore.getState();

            // Start login without awaiting
            const loginPromise = login('test@example.com', 'password123');

            // Check loading is true
            expect(useAuthStore.getState().isLoading).toBe(true);

            // Resolve the promise
            resolvePromise!({
                ok: true,
                json: () => Promise.resolve({
                    data: { user: null, accessToken: 'token', refreshToken: 'refresh' }})});

            await loginPromise;

            // Check loading is false
            expect(useAuthStore.getState().isLoading).toBe(false);
        });
    });

    describe('register', () => {
        it('successfully registers user', async () => {
            const mockUser = {
                id: '456',
                email: 'new@example.com',
                name: 'New User',
                avatarUrl: null,
                isVerified: false};

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    data: {
                        user: mockUser,
                        accessToken: 'new-access-token',
                        refreshToken: 'new-refresh-token'}})});

            const { register } = useAuthStore.getState();
            const result = await act(async () => {
                return await register('new@example.com', 'password123', 'New User');
            });

            expect(result).toBe(true);

            const state = useAuthStore.getState();
            expect(state.user).toEqual(mockUser);
            expect(state.accessToken).toBe('new-access-token');
        });

        it('handles registration failure', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({
                    error: { message: 'Email already exists' }})});

            const { register } = useAuthStore.getState();
            const result = await act(async () => {
                return await register('existing@example.com', 'password123');
            });

            expect(result).toBe(false);
            expect(useAuthStore.getState().error).toBe('Email already exists');
        });
    });

    describe('logout', () => {
        it('clears user data on logout', async () => {
            // Set up logged in state
            useAuthStore.setState({
                user: { id: '123', email: 'test@example.com', name: 'Test', avatarUrl: null, isVerified: true },
                accessToken: 'token',
                refreshToken: 'refresh'});

            mockFetch.mockResolvedValueOnce({ ok: true });

            const { logout } = useAuthStore.getState();
            await act(async () => {
                logout();
            });

            const state = useAuthStore.getState();
            expect(state.user).toBeNull();
            expect(state.accessToken).toBeNull();
            expect(state.refreshToken).toBeNull();
        });

        it('makes API call to logout endpoint', async () => {
            useAuthStore.setState({
                user: { id: '123', email: 'test@example.com', name: 'Test', avatarUrl: null, isVerified: true },
                accessToken: 'test-token',
                refreshToken: 'test-refresh'});

            mockFetch.mockResolvedValueOnce({ ok: true });

            const { logout } = useAuthStore.getState();
            logout();

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/auth/logout'),
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer test-token'})})
            );
        });
    });

    describe('refreshAccessToken', () => {
        it('successfully refreshes token', async () => {
            useAuthStore.setState({
                refreshToken: 'old-refresh-token'});

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    data: {
                        accessToken: 'new-access-token',
                        refreshToken: 'new-refresh-token'}})});

            const { refreshAccessToken } = useAuthStore.getState();
            const result = await act(async () => {
                return await refreshAccessToken();
            });

            expect(result).toBe(true);

            const state = useAuthStore.getState();
            expect(state.accessToken).toBe('new-access-token');
            expect(state.refreshToken).toBe('new-refresh-token');
        });

        it('returns false when no refresh token exists', async () => {
            useAuthStore.setState({ refreshToken: null });

            const { refreshAccessToken } = useAuthStore.getState();
            const result = await refreshAccessToken();

            expect(result).toBe(false);
        });

        it('clears user data on refresh failure', async () => {
            useAuthStore.setState({
                user: { id: '123', email: 'test@example.com', name: 'Test', avatarUrl: null, isVerified: true },
                accessToken: 'old-token',
                refreshToken: 'old-refresh'});

            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({ error: 'Token expired' })});

            const { refreshAccessToken } = useAuthStore.getState();
            const result = await act(async () => {
                return await refreshAccessToken();
            });

            expect(result).toBe(false);

            const state = useAuthStore.getState();
            expect(state.user).toBeNull();
            expect(state.accessToken).toBeNull();
            expect(state.refreshToken).toBeNull();
        });
    });

    describe('clearError', () => {
        it('clears error state', () => {
            useAuthStore.setState({ error: 'Some error message' });

            const { clearError } = useAuthStore.getState();
            clearError();

            expect(useAuthStore.getState().error).toBeNull();
        });
    });

    describe('updateTargetJobRole', () => {
        it('successfully updates target job role', async () => {
            useAuthStore.setState({
                user: { id: '123', email: 'test@example.com', name: 'Test', avatarUrl: null, isVerified: true },
                accessToken: 'test-token'});

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    data: {
                        targetJobRole: { id: 'role-1', title: 'Software Engineer', category: 'Engineering' }}})});

            const { updateTargetJobRole } = useAuthStore.getState();
            const result = await act(async () => {
                return await updateTargetJobRole('role-1');
            });

            expect(result).toBe(true);

            const state = useAuthStore.getState();
            expect(state.user?.targetJobRoleId).toBe('role-1');
            expect(state.user?.targetJobRole?.title).toBe('Software Engineer');
        });

        it('returns false when no access token', async () => {
            useAuthStore.setState({ accessToken: null });

            const { updateTargetJobRole } = useAuthStore.getState();
            const result = await updateTargetJobRole('role-1');

            expect(result).toBe(false);
        });
    });

    describe('hydration', () => {
        it('setHasHydrated updates hydration state', () => {
            const { setHasHydrated } = useAuthStore.getState();

            expect(useAuthStore.getState()._hasHydrated).toBe(false);

            setHasHydrated(true);

            expect(useAuthStore.getState()._hasHydrated).toBe(true);
        });
    });
});

