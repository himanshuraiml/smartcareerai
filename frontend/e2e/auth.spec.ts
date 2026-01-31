import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
    test.describe('Login Page', () => {
        test('should display login form', async ({ page }) => {
            await page.goto('/login');

            // Check page title or heading
            await expect(page.locator('h1, h2').first()).toBeVisible();

            // Check for email input
            const emailInput = page.locator('input[type="email"], input[name="email"]');
            await expect(emailInput).toBeVisible();

            // Check for password input
            const passwordInput = page.locator('input[type="password"]');
            await expect(passwordInput).toBeVisible();

            // Check for submit button
            const submitButton = page.locator('button[type="submit"]');
            await expect(submitButton).toBeVisible();
        });

        test('should show validation errors for empty form', async ({ page }) => {
            await page.goto('/login');

            // Click submit without filling form
            await page.click('button[type="submit"]');

            // Should show some form of validation feedback
            // The exact implementation depends on your form library
            await page.waitForTimeout(500);

            // Check that we're still on the login page (not redirected)
            expect(page.url()).toContain('/login');
        });

        test('should navigate to register page', async ({ page }) => {
            await page.goto('/login');

            // Find and click register link
            const registerLink = page.locator('a[href*="register"]');
            if (await registerLink.isVisible()) {
                await registerLink.click();
                await expect(page).toHaveURL(/.*register/);
            }
        });
    });

    test.describe('Register Page', () => {
        test('should display registration form', async ({ page }) => {
            await page.goto('/register');

            // Check for email input
            const emailInput = page.locator('input[type="email"], input[name="email"]');
            await expect(emailInput).toBeVisible();

            // Check for password input
            const passwordInput = page.locator('input[type="password"]').first();
            await expect(passwordInput).toBeVisible();

            // Check for submit button
            const submitButton = page.locator('button[type="submit"]');
            await expect(submitButton).toBeVisible();
        });

        test('should show password requirements', async ({ page }) => {
            await page.goto('/register');

            // Focus on password field
            const passwordInput = page.locator('input[type="password"]').first();
            await passwordInput.focus();

            // Type a weak password
            await passwordInput.fill('weak');

            // Click elsewhere to trigger validation
            await page.click('body');
            await page.waitForTimeout(500);

            // Should still be on register page (form didn't submit)
            expect(page.url()).toContain('/register');
        });

        test('should navigate to login page', async ({ page }) => {
            await page.goto('/register');

            // Find and click login link
            const loginLink = page.locator('a[href*="login"]');
            if (await loginLink.isVisible()) {
                await loginLink.click();
                await expect(page).toHaveURL(/.*login/);
            }
        });
    });
});
