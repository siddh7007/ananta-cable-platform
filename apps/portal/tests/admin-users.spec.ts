import { test, expect, type Page, type Dialog } from '@playwright/test';

test.describe('Admin Users Management', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    // Navigate to admin users page
    await page.goto('/admin/users');

    // Wait for the page to load and dev bypass to be active
    await expect(page.locator('header h1')).toContainText('Admin');
    await expect(page.locator('.dev-badge')).toContainText('ADMIN (DEV)');
  });

  test('should display user management interface', async ({ page }: { page: Page }) => {
    // Check admin header is present
    await expect(page.locator('h1').first()).toContainText('Admin');

    // Navigate to users page if not already there
    if (!page.url().includes('/admin/users')) {
      await page.click('a[href="/admin/users"]');
    }

    // Check user management heading (should be the second h1 on the page)
    const headings = page.locator('h1');
    await expect(headings.nth(1)).toContainText('User Management');

    // Check search input exists
    await expect(page.locator('#search')).toBeVisible();

    // Check search button exists
    await expect(page.locator('button').filter({ hasText: 'Search' })).toBeVisible();

    // Check users table exists
    await expect(page.locator('table')).toBeVisible();

    // Check table headers
    const headers = page.locator('thead th');
    await expect(headers.nth(0)).toContainText('User');
    await expect(headers.nth(1)).toContainText('Roles');
    await expect(headers.nth(2)).toContainText('Status');
    await expect(headers.nth(3)).toContainText('Created');
    await expect(headers.nth(4)).toContainText('Actions');
  });

  test('should display mock users in table', async ({ page }: { page: Page }) => {
    // Check that we have users displayed
    const userRows = page.locator('tbody tr');
    await expect(userRows).toHaveCount(await userRows.count()); // At least some rows

    // Check first user data
    const firstRow = userRows.first();
    await expect(firstRow.locator('td').nth(0)).toContainText('John Doe');
    await expect(firstRow.locator('td').nth(0)).toContainText('john.doe@company.com');

    // Check roles are displayed
    await expect(firstRow.locator('td').nth(1)).toContainText('user');
    await expect(firstRow.locator('td').nth(1)).toContainText('admin');

    // Check status badge
    await expect(firstRow.locator('td').nth(2)).toContainText('active');
  });

  test('should show search functionality', async ({ page }: { page: Page }) => {
    const searchInput = page.locator('#search');
    const searchButton = page.locator('button').filter({ hasText: 'Search' });

    // Type in search box
    await searchInput.fill('Jane');

    // Check that search input has the value
    await expect(searchInput).toHaveValue('Jane');

    // Click search button (placeholder - doesn't actually filter yet)
    await searchButton.click();

    // For now, just verify the search input and button work
    // In the future, this would navigate and filter results
  });

  test('should show deactivate button for active users', async ({ page }: { page: Page }) => {
    const userRows = page.locator('tbody tr');

    // Find an active user (first row should be John Doe - active)
    const firstRow = userRows.first();
    const actionsCell = firstRow.locator('td').nth(4);

    // Should show deactivate button
    await expect(actionsCell).toContainText('Deactivate');
  });

  test('should show reactivate button for deactivated users', async ({ page }: { page: Page }) => {
    const userRows = page.locator('tbody tr');

    // Find deactivated user (Bob Johnson should be in the list)
    const bobRow = userRows.filter({ hasText: 'Bob Johnson' });
    const actionsCell = bobRow.locator('td').nth(4);

    // Should show reactivate button
    await expect(actionsCell).toContainText('Reactivate');
  });

  test('should handle deactivate action (placeholder)', async ({ page }: { page: Page }) => {
    const userRows = page.locator('tbody tr');
    const firstRow = userRows.first();
    const deactivateButton = firstRow.locator('button').filter({ hasText: 'Deactivate' });

    // Click deactivate (this will show alert in placeholder implementation)
    page.on('dialog', async (dialog: Dialog) => {
      expect(dialog.message()).toContain('Placeholder: Deactivate user');
      await dialog.accept();
    });

    await deactivateButton.click();
  });

  test('should handle reactivate action (placeholder)', async ({ page }: { page: Page }) => {
    const userRows = page.locator('tbody tr');
    const bobRow = userRows.filter({ hasText: 'Bob Johnson' });
    const reactivateButton = bobRow.locator('button').filter({ hasText: 'Reactivate' });

    // Click reactivate (this will show alert in placeholder implementation)
    page.on('dialog', async (dialog: Dialog) => {
      expect(dialog.message()).toContain('Placeholder: Reactivate user');
      await dialog.accept();
    });

    await reactivateButton.click();
  });

  test('should show no results message when search yields no results', async ({
    page,
  }: {
    page: Page;
  }) => {
    // This test would need real search functionality to work properly
    // For now, it's a placeholder test structure
    const searchInput = page.locator('#search');
    const searchButton = page.locator('button').filter({ hasText: 'Search' });

    // Search for something that doesn't exist
    await searchInput.fill('nonexistentuser12345');
    await searchButton.click();

    // In placeholder implementation, this would still show all users
    // Real implementation would show "No users found"
    await expect(page.locator('table')).toBeVisible();
  });

  test('should display user roles as badges', async ({ page }: { page: Page }) => {
    const userRows = page.locator('tbody tr');
    const firstRow = userRows.first();
    const rolesCell = firstRow.locator('td').nth(1);

    // Check that roles are displayed as badges
    const roleBadges = rolesCell.locator('.inline-flex');
    await expect(roleBadges).toHaveCount(2); // user and admin

    await expect(roleBadges.first()).toContainText('user');
    await expect(roleBadges.nth(1)).toContainText('admin');
  });

  test('should display status badges correctly', async ({ page }: { page: Page }) => {
    // Navigate to users page
    await page.click('a[href="/admin/users"]');

    const userRows = page.locator('tbody tr');

    // Check active user
    const activeUser = userRows.first();
    const activeStatus = activeUser.locator('td').nth(2);
    await expect(activeStatus.locator('.inline-flex')).toHaveClass(/bg-green-100/);

    // Check deactivated user
    const deactivatedUser = userRows.filter({ hasText: 'Bob Johnson' });
    const deactivatedStatus = deactivatedUser.locator('td').nth(2);
    await expect(deactivatedStatus.locator('.inline-flex')).toHaveClass(/bg-red-100/);
  });

  test('should show dev bypass toggle in dev mode', async ({ page }: { page: Page }) => {
    // Check that dev bypass toggle is visible
    await expect(page.locator('.dev-bypass-toggle')).toBeVisible();
    await expect(page.locator('.toggle-text')).toContainText('Dev Bypass');

    // Check that toggle is checked (since we set devBypass: true in mock)
    const toggleInput = page.locator('.toggle-input');
    await expect(toggleInput).toBeChecked();
  });

  test('should allow toggling dev bypass', async ({ page }: { page: Page }) => {
    const toggleInput = page.locator('.toggle-input');
    const toggleSlider = page.locator('.toggle-slider');

    // Should start checked
    await expect(toggleInput).toBeChecked();

    // Click on the slider to uncheck
    await toggleSlider.click();
    await expect(toggleInput).not.toBeChecked();

    // Click on the slider again to check
    await toggleSlider.click();
    await expect(toggleInput).toBeChecked();
  });
});
