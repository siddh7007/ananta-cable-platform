import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should render dashboard with all tiles', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/Dashboard/);

    // Verify main heading
    const heading = page.locator('h1');
    await expect(heading).toHaveText('Dashboard');

    // Verify all four dashboard tiles are present
    const systemHealthTile = page.locator('section').filter({ hasText: 'System Health' });
    await expect(systemHealthTile).toBeVisible();

    const projectsTile = page.locator('section').filter({ hasText: 'Recent Projects' });
    await expect(projectsTile).toBeVisible();

    const quotesTile = page.locator('section').filter({ hasText: 'Latest Quotes' });
    await expect(quotesTile).toBeVisible();

    const ordersTile = page.locator('section').filter({ hasText: 'Recent Orders' });
    await expect(ordersTile).toBeVisible();
  });

  test('should show system health status badge', async ({ page }) => {
    await page.goto('/');

    // Verify health tile has a status badge
    const healthTile = page.locator('section').filter({ hasText: 'System Health' });
    const statusBadge = healthTile.locator('.health-badge');
    
    await expect(statusBadge).toBeVisible();
    
    // Status should be one of: Operational, Degraded, or Unavailable
    const statusText = await statusBadge.textContent();
    expect(['Operational', 'Degraded', 'Unavailable']).toContain(statusText);
  });

  test('should show empty state when no items exist', async ({ page }) => {
    await page.goto('/');

    // Since BFF stubs return empty arrays, verify empty states are shown
    const projectsTile = page.locator('section').filter({ hasText: 'Recent Projects' });
    await expect(projectsTile.locator('.empty-state')).toHaveText('No items yet');

    const quotesTile = page.locator('section').filter({ hasText: 'Latest Quotes' });
    await expect(quotesTile.locator('.empty-state')).toHaveText('No items yet');

    const ordersTile = page.locator('section').filter({ hasText: 'Recent Orders' });
    await expect(ordersTile.locator('.empty-state')).toHaveText('No items yet');
  });

  test('should have accessible structure', async ({ page }) => {
    await page.goto('/');

    // Each tile should have a heading (h2)
    const tileHeadings = page.locator('.dashboard-tile h2');
    await expect(tileHeadings).toHaveCount(4);

    // Verify headings have proper IDs for aria-labelledby
    await expect(page.locator('h2#health-heading')).toBeVisible();
    await expect(page.locator('h2#projects-heading')).toBeVisible();
    await expect(page.locator('h2#quotes-heading')).toBeVisible();
    await expect(page.locator('h2#orders-heading')).toBeVisible();

    // Verify sections use aria-labelledby
    const healthSection = page.locator('section[aria-labelledby="health-heading"]');
    await expect(healthSection).toBeVisible();
  });

  test('should have view details link in health tile', async ({ page }) => {
    await page.goto('/');

    const healthTile = page.locator('section').filter({ hasText: 'System Health' });
    const viewDetailsLink = healthTile.locator('a:has-text("View details")');
    
    await expect(viewDetailsLink).toBeVisible();
    await expect(viewDetailsLink).toHaveAttribute('href', '/ready');
  });

  test('should handle health status changes gracefully', async ({ page }) => {
    // This test verifies the UI can handle different health statuses
    // In a real scenario, you would mock the /ready endpoint to return different statuses
    
    await page.goto('/');

    const healthTile = page.locator('section').filter({ hasText: 'System Health' });
    const statusBadge = healthTile.locator('.health-badge');

    // Verify badge has appropriate status class
    const badgeClasses = await statusBadge.getAttribute('class');
    expect(badgeClasses).toMatch(/status-(ok|degraded|fail)/);
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // All tiles should still be visible in mobile view
    const tiles = page.locator('.dashboard-tile');
    await expect(tiles).toHaveCount(4);

    // Verify tiles stack vertically on mobile (single column)
    const firstTile = tiles.nth(0);
    const secondTile = tiles.nth(1);
    
    const firstBox = await firstTile.boundingBox();
    const secondBox = await secondTile.boundingBox();
    
    if (firstBox && secondBox) {
      // Second tile should be below first tile (stacked vertically)
      expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height - 10);
    }
  });
});
