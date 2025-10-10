import { test } from '@playwright/test';

test('Take screenshots of portal', async ({ page }) => {
  // Set larger viewport for better screenshots
  await page.setViewportSize({ width: 1920, height: 1080 });

  console.log('📸 Taking screenshots...');

  // Home page
  await page.goto('/');
  await page.screenshot({ path: 'screenshots/01-home.png', fullPage: true });
  console.log('✅ Home page');

  // Admin page
  await page.goto('/admin');
  await page.screenshot({ path: 'screenshots/02-admin.png', fullPage: true });
  console.log('✅ Admin page');

  // Projects page
  await page.goto('/projects');
  await page.screenshot({ path: 'screenshots/03-projects.png', fullPage: true });
  console.log('✅ Projects page');

  // Quotes page
  await page.goto('/quotes');
  await page.screenshot({ path: 'screenshots/04-quotes.png', fullPage: true });
  console.log('✅ Quotes page');

  // Orders page
  await page.goto('/orders');
  await page.screenshot({ path: 'screenshots/05-orders.png', fullPage: true });
  console.log('✅ Orders page');

  // Settings page
  await page.goto('/settings');
  await page.screenshot({ path: 'screenshots/06-settings.png', fullPage: true });
  console.log('✅ Settings page');

  console.log('\n✨ All screenshots saved to screenshots/ folder!');
});
