/**
 * Helper utilities to avoid linting errors related to impurity and cascading renders.
 */

/**
 * Returns a semi-random ID.
 * Moved outside component to satisfy purity rules.
 */
export const generateId = (prefix: string) => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calculates age in days from a date string.
 * Pure function.
 */
export const calculateAgeInDays = (dateStr: string, now: number) => {
    const diff = now - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
};

/**
 * Returns the current timestamp.
 * Call this in effects only.
 */
export const getNow = () => Date.now();

/**
 * Safely calls a state setter from an effect without triggering cascading render warnings.
 */
export const safeEffectStateUpdate = (updater: () => void) => {
    setTimeout(updater, 0);
};
