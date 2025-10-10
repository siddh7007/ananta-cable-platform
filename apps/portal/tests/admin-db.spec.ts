import { test, expect, type Page } from '@playwright/test';

test.describe('Admin DB Dashboard', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    // Navigate to admin DB page
    await page.goto('/admin/db');

    // Wait for the page to load and dev bypass to be active
    await expect(page.locator('header h1')).toContainText('Admin');
    await expect(page.locator('.dev-badge')).toContainText('ADMIN (DEV)');
  });

  test('should display database dashboard with heading', async ({ page }: { page: Page }) => {
    // Check main heading
    const mainHeading = page.locator('h1').filter({ hasText: 'Database' });
    await expect(mainHeading).toBeVisible();
  });

  test('should display connections section with three databases', async ({
    page,
  }: {
    page: Page;
  }) => {
    // Check connections section heading
    const connectionsHeading = page.locator('h2').filter({ hasText: 'Connections' });
    await expect(connectionsHeading).toBeVisible();

    // Check for three connection cards
    const connectionCards = page.locator('.connection-card');
    await expect(connectionCards).toHaveCount(3);

    // Check for specific database names
    await expect(page.locator('.connection-card h3').filter({ hasText: 'Supabase' })).toBeVisible();
    await expect(page.locator('.connection-card h3').filter({ hasText: 'PG Extra' })).toBeVisible();
    await expect(page.locator('.connection-card h3').filter({ hasText: 'Oracle' })).toBeVisible();
  });

  test('should display status pills for each connection', async ({ page }: { page: Page }) => {
    // Each connection card should have a status pill
    const statusPills = page.locator('.connection-card .pill');
    await expect(statusPills).toHaveCount(3);

    // Check that pills have proper aria-labels for accessibility
    const firstPill = statusPills.first();
    await expect(firstPill).toHaveAttribute('aria-label', /status:/);
  });

  test('should display entity counts section with five counters', async ({
    page,
  }: {
    page: Page;
  }) => {
    // Check entity counts section heading
    const countsHeading = page.locator('h2').filter({ hasText: 'Entity Counts' });
    await expect(countsHeading).toBeVisible();

    // Check for five count cards
    const countCards = page.locator('.count-card');
    await expect(countCards).toHaveCount(5);

    // Check for specific entity labels
    await expect(page.locator('.count-label').filter({ hasText: 'Workspaces' })).toBeVisible();
    await expect(page.locator('.count-label').filter({ hasText: 'Projects' })).toBeVisible();
    await expect(page.locator('.count-label').filter({ hasText: 'BOMs' })).toBeVisible();
    await expect(page.locator('.count-label').filter({ hasText: 'Orders' })).toBeVisible();
    await expect(page.locator('.count-label').filter({ hasText: 'Users' })).toBeVisible();
  });

  test('should display numeric values or placeholders for counts', async ({
    page,
  }: {
    page: Page;
  }) => {
    // Each count card should have a value (number or placeholder "—")
    const countValues = page.locator('.count-value');
    await expect(countValues).toHaveCount(5);

    // Check that each value is either a number or the placeholder
    for (let i = 0; i < 5; i++) {
      const value = await countValues.nth(i).textContent();
      expect(value).toMatch(/^\d+$|^—$/);
    }
  });

  test('should have a refetch button that is keyboard accessible', async ({
    page,
  }: {
    page: Page;
  }) => {
    // Check refetch button exists
    const refetchButton = page.locator('.refetch-button');
    await expect(refetchButton).toBeVisible();
    await expect(refetchButton).toContainText('Refetch');

    // Check button is keyboard accessible
    await refetchButton.focus();
    await expect(refetchButton).toBeFocused();

    // Check aria-busy attribute is false initially
    await expect(refetchButton).toHaveAttribute('aria-busy', 'false');
  });

  test('should reload data when refetch button is clicked', async ({ page }: { page: Page }) => {
    const refetchButton = page.locator('.refetch-button');

    // Click refetch button
    await refetchButton.click();

    // Button should show loading state
    await expect(refetchButton).toContainText('Refetching...');
    await expect(refetchButton).toHaveAttribute('aria-busy', 'true');
    await expect(refetchButton).toBeDisabled();

    // Wait for reload to complete
    await expect(refetchButton).toContainText('Refetch', { timeout: 5000 });
    await expect(refetchButton).toHaveAttribute('aria-busy', 'false');
    await expect(refetchButton).toBeEnabled();

    // Page should still be stable - check counters still render
    const countCards = page.locator('.count-card');
    await expect(countCards).toHaveCount(5);
  });

  test('should display connection latency when available', async ({ page }: { page: Page }) => {
    // At least one connection should show latency (in mock data, Supabase and PG Extra have latency)
    const latencyElements = page.locator('.latency');

    // Count how many latency elements exist
    const count = await latencyElements.count();

    if (count > 0) {
      // If latency is shown, verify it's in milliseconds format
      const firstLatency = await latencyElements.first().textContent();
      expect(firstLatency).toMatch(/^\d+ms$/);
    }
  });

  test('should handle error state gracefully', async ({ page }: { page: Page }) => {
    // Check if error banner is NOT displayed on successful load
    const errorBanner = page.locator('.error-banner');
    await expect(errorBanner).not.toBeVisible();

    // TODO: Add test for error state once we can mock failed API calls
    // This would require intercepting the +page.ts load function or the API endpoint
  });

  test('should meet accessibility requirements', async ({ page }: { page: Page }) => {
    // Section headings should be h2
    const sectionHeadings = page.locator('h2');
    await expect(sectionHeadings).toHaveCount(2);

    // Status pills should have aria-label
    const statusPills = page.locator('.pill');
    for (let i = 0; i < (await statusPills.count()); i++) {
      await expect(statusPills.nth(i)).toHaveAttribute('aria-label', /status:/);
    }

    // Refetch button should be keyboard accessible
    const refetchButton = page.locator('.refetch-button');
    await refetchButton.focus();
    await expect(refetchButton).toBeFocused();

    // If there's an error banner, it should have role="alert"
    const errorBanner = page.locator('.error-banner');
    if (await errorBanner.isVisible()) {
      await expect(errorBanner).toHaveAttribute('role', 'alert');
    }
  });

  // TODO (Prompt 66): Once the real BFF endpoint /admin/db/stats is implemented,
  // add tests that mock different API responses:
  // - All connections healthy
  // - Some connections failed
  // - Connections with different latencies
  // - Missing/not configured connections
  // - API timeout/error handling
});
