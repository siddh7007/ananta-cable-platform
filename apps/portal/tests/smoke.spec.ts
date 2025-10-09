import { test, expect } from '@playwright/test';

/**
 * Smoke Tests for Portal
 * 
 * These tests verify basic functionality of the portal
 * without requiring full backend infrastructure.
 */

// Configuration
const BASE_URL = process.env.PORTAL_URL || 'http://localhost:5173';

test.describe('Portal Smoke Tests', () => {
  test.describe('Home Page', () => {
    test('should load home page and display main heading', async ({ page }) => {
      await page.goto(BASE_URL);

      // Check that page loaded
      await expect(page).toHaveTitle(/Cable Platform Portal/i);

      // Verify main heading is present
      const h1 = page.locator('h1#main');
      await expect(h1).toBeVisible();
      await expect(h1).toContainText(/Welcome to Cable Platform/i);
    });

    test('should display navigation cards', async ({ page }) => {
      await page.goto(BASE_URL);

      // Check for DRC card
      const drcCard = page.locator('a[href="/drc"]').first();
      await expect(drcCard).toBeVisible();
      await expect(drcCard).toContainText(/Design Rule Check/i);

      // Check for Synthesis card
      const synthesisCard = page.locator('a[href="/synthesis"]').first();
      await expect(synthesisCard).toBeVisible();
      await expect(synthesisCard).toContainText(/Synthesis/i);

      // Check for Drawing Generation demo card
      const demoCard = page.locator('.demo-card');
      await expect(demoCard).toBeVisible();
      await expect(demoCard).toContainText(/Drawing Generation/i);
    });

    test('should have skip to content link', async ({ page }) => {
      await page.goto(BASE_URL);

      // Skip link should be in the DOM (even if visually hidden)
      const skipLink = page.locator('a.skip-link');
      await expect(skipLink).toHaveAttribute('href', '#main');
      await expect(skipLink).toContainText(/Skip to content/i);
    });

    test('should navigate to DRC page when clicking card', async ({ page }) => {
      await page.goto(BASE_URL);

      // Click on DRC card
      await page.locator('a[href="/drc"]').first().click();

      // Should navigate to DRC page
      await expect(page).toHaveURL(/\/drc/);
      await expect(page.locator('h1')).toContainText(/Design Rule Check/i);
    });
  });

  test.describe('DRC Page', () => {
    test('should load DRC page and display form', async ({ page }) => {
      await page.goto(`${BASE_URL}/drc`);

      // Check that page loaded with correct heading
      const h1 = page.locator('h1#main');
      await expect(h1).toBeVisible();
      await expect(h1).toContainText(/Design Rule Check/i);

      // Verify form fields are present
      const idInput = page.locator('input[name="id"]');
      await expect(idInput).toBeVisible();

      const nameInput = page.locator('input[name="name"]');
      await expect(nameInput).toBeVisible();

      const coresInput = page.locator('input[name="cores"]');
      await expect(coresInput).toBeVisible();
    });

    test('should validate form fields on blur', async ({ page }) => {
      await page.goto(`${BASE_URL}/drc`);

      // Get form fields
      const idInput = page.locator('input[name="id"]');
      const nameInput = page.locator('input[name="name"]');

      // Leave ID field empty and blur
      await idInput.focus();
      await idInput.blur();

      // Should show validation error for ID
      const idError = page.locator('.field-error:has-text("id")');
      await expect(idError).toBeVisible();

      // Leave name field empty and blur
      await nameInput.focus();
      await nameInput.blur();

      // Should show validation error for name
      const nameError = page.locator('.field-error:has-text("name")');
      await expect(nameError).toBeVisible();
    });

    test('should enable submit button when form is valid', async ({ page }) => {
      await page.goto(`${BASE_URL}/drc`);

      // Initially, submit might be disabled or enabled - check form state
      const submitButton = page.locator('button[type="submit"]');

      // Fill out form with valid data
      await page.locator('input[name="id"]').fill('test-cable-001');
      await page.locator('input[name="name"]').fill('Test Cable Assembly');
      await page.locator('input[name="cores"]').fill('4');

      // Submit button should be enabled (or at least present and clickable)
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeEnabled();
    });

    test('should attempt to submit form with valid data', async ({ page }) => {
      // Mock the API response to avoid needing real backend
      await page.route('**/v1/drc', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            passed: true,
            errors: 0,
            warnings: 0,
            findings: [],
            fixes: [],
          }),
        });
      });

      await page.goto(`${BASE_URL}/drc`);

      // Fill out form
      await page.locator('input[name="id"]').fill('test-cable-001');
      await page.locator('input[name="name"]').fill('Test Cable Assembly');
      await page.locator('input[name="cores"]').fill('4');

      // Submit form
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Should show loading state or results
      // Wait for either loading indicator or results to appear
      await expect(
        page.locator('.loading, .drc-results, .validation-status')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should display error message on API failure', async ({ page }) => {
      // Mock API failure
      await page.route('**/v1/drc', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal server error',
          }),
        });
      });

      await page.goto(`${BASE_URL}/drc`);

      // Fill out form
      await page.locator('input[name="id"]').fill('test-cable-001');
      await page.locator('input[name="name"]').fill('Test Cable Assembly');
      await page.locator('input[name="cores"]').fill('4');

      // Submit form
      await page.locator('button[type="submit"]').click();

      // Should show error (either in ErrorCard or banner)
      await expect(
        page.locator('.error-card, .banner.error, .error')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should have proper form accessibility', async ({ page }) => {
      await page.goto(`${BASE_URL}/drc`);

      // Check that form fields have labels
      const idLabel = page.locator('label:has-text("ID")');
      await expect(idLabel).toBeVisible();

      const nameLabel = page.locator('label:has-text("Name")');
      await expect(nameLabel).toBeVisible();

      const coresLabel = page.locator('label:has-text("Cores")');
      await expect(coresLabel).toBeVisible();

      // Check that submit button has accessible text
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toContainText(/submit|validate/i);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper focus management', async ({ page }) => {
      await page.goto(BASE_URL);

      // Press Tab to focus skip link
      await page.keyboard.press('Tab');

      // Skip link should be focused
      const skipLink = page.locator('a.skip-link');
      await expect(skipLink).toBeFocused();
    });

    test('should allow keyboard navigation', async ({ page }) => {
      await page.goto(BASE_URL);

      // Tab through interactive elements
      await page.keyboard.press('Tab'); // Skip link
      await page.keyboard.press('Tab'); // First nav item or card

      // Should be able to navigate with keyboard
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto(BASE_URL);

      // Check that there's exactly one h1
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);

      // Check that h1 has id="main"
      const h1 = page.locator('h1#main');
      await expect(h1).toBeVisible();
    });
  });
});
