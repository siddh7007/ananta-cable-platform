# Portal Playwright Tests

Smoke tests for the Cable Platform Portal using Playwright.

## 📋 Test Coverage

### Home Page Tests

- ✅ Loads home page and displays main heading
- ✅ Displays navigation cards (DRC, Synthesis, Drawing Generation)
- ✅ Has skip to content link
- ✅ Navigates to DRC page when clicking card

### DRC Page Tests

- ✅ Loads DRC page and displays form
- ✅ Validates form fields on blur
- ✅ Enables submit button when form is valid
- ✅ Attempts to submit form with valid data (mocked API)
- ✅ Displays error message on API failure
- ✅ Has proper form accessibility

### Accessibility Tests

- ✅ Proper focus management
- ✅ Keyboard navigation
- ✅ Proper heading hierarchy (single h1 per page)

## 🚀 Running Tests

### Run all tests

```bash
pnpm test
```

### Run tests with UI mode (interactive)

```bash
pnpm test:ui
```

### Run tests in headed mode (see browser)

```bash
pnpm test:headed
```

### Debug tests

```bash
pnpm test:debug
```

### Run specific test file

```bash
pnpm test smoke.spec.ts
```

### Run tests in specific browser

```bash
pnpm test --project=chromium
pnpm test --project=firefox
pnpm test --project=webkit
```

## 🌐 Test Configuration

Tests are configured in `playwright.config.ts`:

- **Base URL:** `http://localhost:5173` (configurable via `PORTAL_URL` env var)
- **Browsers:** Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Auto-starts dev server:** Tests will automatically start `pnpm run dev` if server isn't running

## 🎭 Mocking

Tests use Playwright's route mocking to avoid requiring a real backend:

```typescript
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
```

## 📊 Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

## 🔧 Environment Variables

- `PORTAL_URL` - Base URL for the portal (default: `http://localhost:5173`)
- `CI` - Set to enable CI-specific settings (retries, single worker)

## 📝 Writing New Tests

Create new test files in this directory with the `.spec.ts` extension:

```typescript
import { test, expect } from '@playwright/test';

test('my new test', async ({ page }) => {
  await page.goto('/');
  // ... your test code
});
```

## 🐛 Debugging

### Visual debugging

```bash
pnpm test:debug
```

This opens the Playwright Inspector where you can:

- Step through tests
- Inspect the page
- View console logs
- Take screenshots

### Screenshots on failure

Screenshots are automatically captured on test failure and saved to `test-results/`.

### Trace viewer

If a test fails after retry, a trace is captured. View it with:

```bash
npx playwright show-trace test-results/<test-name>/trace.zip
```

## ✅ Best Practices

1. **Use page.locator()** instead of page.$() for better auto-waiting
2. **Mock API responses** to avoid backend dependencies
3. **Use semantic selectors** (role, text) over CSS selectors when possible
4. **Check accessibility** (headings, labels, keyboard navigation)
5. **Keep tests fast** - mock slow operations
6. **Avoid hard-coded waits** - rely on Playwright's auto-waiting

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Test Best Practices](https://playwright.dev/docs/best-practices)
- [Locators Guide](https://playwright.dev/docs/locators)
- [Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
