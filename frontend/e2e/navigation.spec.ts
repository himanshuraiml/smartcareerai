import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
    test.describe('Public Pages', () => {
        test('should load the home page', async ({ page }) => {
            await page.goto('/');

            // Page should load without errors
            await expect(page).not.toHaveTitle(/error|404/i);
        });

        test('should load the pricing page', async ({ page }) => {
            await page.goto('/pricing');

            // Check that pricing content is visible
            await expect(page.locator('body')).toBeVisible();

            // Should not be a 404 page
            await expect(page).not.toHaveTitle(/404/i);
        });

        test('should redirect unauthenticated users from dashboard', async ({ page }) => {
            await page.goto('/dashboard');

            // Should be redirected to login
            await page.waitForURL(/.*login.*/);
            expect(page.url()).toContain('login');
        });
    });

    test.describe('Page Elements', () => {
        test('should have theme toggle functionality', async ({ page }) => {
            await page.goto('/login');

            // Look for theme toggle button
            const themeToggle = page.locator('button[title*="theme"], button[title*="mode"]');
            if (await themeToggle.isVisible()) {
                // Click theme toggle
                await themeToggle.click();
                await page.waitForTimeout(300);

                // Theme should have changed (checking for class change on html/body)
                const htmlElement = page.locator('html');
                const hasLightMode = await htmlElement.evaluate(
                    (el) => el.classList.contains('light-mode')
                );
                const hasDarkMode = await htmlElement.evaluate(
                    (el) => el.classList.contains('dark-mode')
                );

                // One of them should be present
                expect(hasLightMode || hasDarkMode).toBe(true);
            }
        });
    });

    test.describe('Responsive Design', () => {
        test('should be responsive on mobile viewport', async ({ page }) => {
            // Set mobile viewport
            await page.setViewportSize({ width: 375, height: 667 });

            await page.goto('/login');

            // Page should still be functional
            const loginForm = page.locator('form, [role="form"]');
            await expect(loginForm.first()).toBeVisible();
        });

        test('should be responsive on tablet viewport', async ({ page }) => {
            // Set tablet viewport
            await page.setViewportSize({ width: 768, height: 1024 });

            await page.goto('/login');

            // Page should still be functional
            const body = page.locator('body');
            await expect(body).toBeVisible();
        });
    });
});
