import { test, expect } from '@playwright/test';

test.describe('Admin Section', () => {
  test.describe('Dev-bypass mode (allowed access)', () => {
    test.beforeEach(async ({ page }) => {
      // Mock /config endpoint to enable dev-bypass
      await page.route('**/config', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            env: 'development',
            apiBaseUrl: 'http://localhost:8080',
            auth: {
              domain: null,
              audience: null,
              devBypass: true,
            },
            features: {
              otel: false,
              flags: [],
            },
          }),
        });
      });

      // Mock /v1/me endpoint to return dev user
      await page.route('**/v1/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            sub: 'dev-user',
            roles: ['dev'],
            features: [],
          }),
        });
      });
    });

    test('should allow access to /admin with DEV badge visible', async ({ page }) => {
      await page.goto('/admin');

      // Verify main heading is present
      const heading = page.locator('h1').filter({ hasText: 'Admin' });
      await expect(heading).toBeVisible();

      // Verify DEV badge is shown
      const devBadge = page.locator('.dev-badge');
      await expect(devBadge).toBeVisible();
      await expect(devBadge).toHaveText('ADMIN (DEV)');
    });

    test('should display admin navigation links', async ({ page }) => {
      await page.goto('/admin');

      // Verify all sub-nav links are present
      await expect(page.locator('a.nav-link:has-text("Overview")')).toBeVisible();
      await expect(page.locator('a.nav-link:has-text("Users")')).toBeVisible();
      await expect(page.locator('a.nav-link:has-text("Database")')).toBeVisible();
      await expect(page.locator('a.nav-link:has-text("Licenses")')).toBeVisible();
      await expect(page.locator('a.nav-link:has-text("Feature Flags")')).toBeVisible();
    });

    test('should display admin landing page cards', async ({ page }) => {
      await page.goto('/admin');

      // Verify all admin cards are present
      const usersCard = page.locator('.admin-card').filter({ hasText: 'Users' });
      await expect(usersCard).toBeVisible();
      await expect(usersCard).toContainText('Manage user accounts, roles, and permissions');

      const dbCard = page.locator('.admin-card').filter({ hasText: 'Database' });
      await expect(dbCard).toBeVisible();

      const licensesCard = page.locator('.admin-card').filter({ hasText: 'Licenses' });
      await expect(licensesCard).toBeVisible();

      const flagsCard = page.locator('.admin-card').filter({ hasText: 'Feature Flags' });
      await expect(flagsCard).toBeVisible();
    });

    test('should navigate to admin sub-pages via cards', async ({ page }) => {
      await page.goto('/admin');

      // Click on Users card
      const usersCard = page.locator('.admin-card').filter({ hasText: 'Users' });
      await usersCard.click();

      // Should navigate to /admin/users (even though it's a placeholder)
      await expect(page).toHaveURL(/\/admin\/users/);
    });
  });

  test.describe('Non-admin user (denied access)', () => {
    test.beforeEach(async ({ page }) => {
      // Mock /config endpoint with dev-bypass OFF
      await page.route('**/config', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            env: 'production',
            apiBaseUrl: 'http://localhost:8080',
            auth: {
              domain: 'auth.example.com',
              audience: 'api.example.com',
              devBypass: false,
            },
            features: {
              otel: false,
              flags: [],
            },
          }),
        });
      });

      // Mock /v1/me endpoint to return non-admin user
      await page.route('**/v1/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            sub: 'regular-user-123',
            roles: ['user', 'designer'],
            features: ['drc', 'analytics'],
          }),
        });
      });
    });

    test('should show 403 Forbidden page', async ({ page }) => {
      await page.goto('/admin');

      // Verify 403 error page is displayed
      const heading = page.locator('h1');
      await expect(heading).toHaveText('Forbidden');

      // Verify forbidden message is shown
      const errorMessage = page.locator('.error-message');
      await expect(errorMessage).toBeVisible();
    });

    test('should not show DEV badge on 403 page', async ({ page }) => {
      await page.goto('/admin');

      // DEV badge should not be present
      const devBadge = page.locator('.dev-badge');
      await expect(devBadge).not.toBeVisible();
    });

    test('should provide link back to home on 403 page', async ({ page }) => {
      await page.goto('/admin');

      // Verify "Back to Home" button exists and works
      const homeButton = page.locator('a.button-primary:has-text("Back to Home")');
      await expect(homeButton).toBeVisible();
      await expect(homeButton).toHaveAttribute('href', '/');
    });
  });

  test.describe('Error handling', () => {
    test('should show 403 when config is unavailable', async ({ page }) => {
      // Mock /config to fail
      await page.route('**/config', async (route) => {
        await route.abort('failed');
      });

      await page.goto('/admin');

      // Should show forbidden due to fail-closed behavior
      const heading = page.locator('h1');
      await expect(heading).toHaveText('Forbidden');
    });

    test('should show 403 when user data is unavailable', async ({ page }) => {
      // Mock /config to succeed
      await page.route('**/config', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            env: 'development',
            apiBaseUrl: 'http://localhost:8080',
            auth: { domain: null, audience: null, devBypass: false },
            features: { otel: false, flags: [] },
          }),
        });
      });

      // Mock /v1/me to fail
      await page.route('**/v1/me', async (route) => {
        await route.abort('failed');
      });

      await page.goto('/admin');

      // Should show forbidden due to fail-closed behavior
      const heading = page.locator('h1');
      await expect(heading).toHaveText('Forbidden');
    });
  });
});
