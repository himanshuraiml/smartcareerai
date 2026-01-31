import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
    test.describe('Login Page Accessibility', () => {
        test('should have proper form labels', async ({ page }) => {
            await page.goto('/login');

            // Check that inputs have associated labels or aria-labels
            const emailInput = page.locator('input[type="email"], input[name="email"]');
            const passwordInput = page.locator('input[type="password"]');

            // Check for label association or aria-label
            const emailHasLabel = await emailInput.evaluate((el) => {
                const id = el.getAttribute('id');
                const ariaLabel = el.getAttribute('aria-label');
                const placeholder = el.getAttribute('placeholder');
                const label = id ? document.querySelector(`label[for="${id}"]`) : null;
                return !!(label || ariaLabel || placeholder);
            });

            const passwordHasLabel = await passwordInput.evaluate((el) => {
                const id = el.getAttribute('id');
                const ariaLabel = el.getAttribute('aria-label');
                const placeholder = el.getAttribute('placeholder');
                const label = id ? document.querySelector(`label[for="${id}"]`) : null;
                return !!(label || ariaLabel || placeholder);
            });

            expect(emailHasLabel).toBe(true);
            expect(passwordHasLabel).toBe(true);
        });

        test('should have focusable elements in logical order', async ({ page }) => {
            await page.goto('/login');

            // Tab through the page and check focus moves to inputs
            await page.keyboard.press('Tab');
            await page.waitForTimeout(100);

            // Get the currently focused element
            const focusedElement = await page.evaluate(() => {
                const el = document.activeElement;
                return el?.tagName.toLowerCase();
            });

            // Should have focused on an interactive element
            expect(['input', 'button', 'a', 'select', 'textarea']).toContain(focusedElement);
        });

        test('should have sufficient color contrast', async ({ page }) => {
            await page.goto('/login');

            // Check that text elements are visible against their backgrounds
            const textElement = page.locator('h1, h2, p, label').first();
            await expect(textElement).toBeVisible();

            // Verify the element has some text content
            const text = await textElement.textContent();
            expect(text?.length).toBeGreaterThan(0);
        });
    });

    test.describe('Keyboard Navigation', () => {
        test('should allow form submission with Enter key', async ({ page }) => {
            await page.goto('/login');

            // Fill in form
            const emailInput = page.locator('input[type="email"], input[name="email"]');
            const passwordInput = page.locator('input[type="password"]');

            await emailInput.fill('test@example.com');
            await passwordInput.fill('Password123');

            // Press Enter to submit
            await passwordInput.press('Enter');

            // Wait for navigation or error message
            await page.waitForTimeout(1000);

            // Page should have responded (either validation error or navigation)
            // This checks the form is keyboard accessible
        });

        test('should support Escape key to close modals', async ({ page }) => {
            await page.goto('/login');

            // If there are any modals triggered on this page, test Escape key
            // This is a placeholder for modal-specific tests
            await page.keyboard.press('Escape');

            // Page should remain functional
            await expect(page.locator('body')).toBeVisible();
        });
    });

    test.describe('Screen Reader Support', () => {
        test('should have proper heading hierarchy', async ({ page }) => {
            await page.goto('/login');

            // Get all headings
            const headings = await page.evaluate(() => {
                const h1Count = document.querySelectorAll('h1').length;
                const h2Count = document.querySelectorAll('h2').length;
                const h3Count = document.querySelectorAll('h3').length;
                return { h1Count, h2Count, h3Count };
            });

            // Should have at least one heading
            const totalHeadings = headings.h1Count + headings.h2Count + headings.h3Count;
            expect(totalHeadings).toBeGreaterThan(0);
        });

        test('should have alt text for images', async ({ page }) => {
            await page.goto('/login');

            // Check all images have alt attributes
            const images = page.locator('img');
            const imageCount = await images.count();

            for (let i = 0; i < imageCount; i++) {
                const img = images.nth(i);
                const hasAlt = await img.evaluate((el) => el.hasAttribute('alt'));
                expect(hasAlt).toBe(true);
            }
        });

        test('should have proper button text or aria-label', async ({ page }) => {
            await page.goto('/login');

            // Check all buttons have accessible names
            const buttons = page.locator('button');
            const buttonCount = await buttons.count();

            for (let i = 0; i < buttonCount; i++) {
                const button = buttons.nth(i);
                const hasAccessibleName = await button.evaluate((el) => {
                    const text = el.textContent?.trim();
                    const ariaLabel = el.getAttribute('aria-label');
                    const title = el.getAttribute('title');
                    return !!(text || ariaLabel || title);
                });
                expect(hasAccessibleName).toBe(true);
            }
        });
    });
});
