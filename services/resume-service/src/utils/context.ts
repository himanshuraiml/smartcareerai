import { AsyncLocalStorage } from 'async_hooks';

/**
 * AsyncLocalStorage to store the current user ID across the request lifecycle.
 * This allows the Prisma RLS extension to access the user ID without passing it through every function.
 */
export const userContext = new AsyncLocalStorage<string>();
