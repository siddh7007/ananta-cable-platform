# Admin Section Implementation - Prompt 62

## Overview

Created a complete Admin section shell at `/admin` with route guard, dev-bypass banner, 403 handling, and comprehensive Playwright tests.

## ✅ Implementation Complete

### Files Created

#### 1. **Route Guard** (`apps/portal/src/routes/admin/+layout.ts`)

- **Purpose**: Server-side route protection for admin section
- **Features**:
  - Loads config and user data using existing stores
  - Checks `auth.devBypass` flag from `/config` endpoint
  - In dev-bypass mode: allows access + sets `adminDevBypass: true`
  - In production mode: checks for `'dev'` or `'admin'` role
  - **Fail-closed**: Any network error or missing data → 403
  - Extensible role array: `['dev', 'admin']` - easy to add more roles
  - Proper error handling with SvelteKit's `error()` helper

#### 2. **Admin Shell** (`apps/portal/src/routes/admin/+layout.svelte`)

- **Purpose**: Consistent layout wrapper for all admin pages
- **Features**:
  - Yellow "ADMIN (DEV)" badge when `data.adminDevBypass === true`
  - Horizontal sub-navigation with links to:
    - Overview (`/admin`)
    - Users (`/admin/users`)
    - Database (`/admin/db`)
    - Licenses (`/admin/licenses`)
    - Feature Flags (`/admin/flags`)
  - Clean, minimal CSS (no frameworks)
  - Responsive design with flexbox
  - Accessibility: focus-visible states, ARIA labels

#### 3. **Admin Landing Page** (`apps/portal/src/routes/admin/+page.svelte`)

- **Purpose**: Admin section home with card grid
- **Features**:
  - 4 cards linking to main admin sections:
    - 👥 Users - "Manage user accounts, roles, and permissions"
    - 🗄️ Database - "View connection status, run migrations, and monitor health"
    - 📄 Licenses - "Manage software licenses and compliance"
    - 🚩 Feature Flags - "Toggle features and manage rollout strategies"
  - Card hover effects with transform and shadow
  - Responsive grid layout (auto-fit, minmax)

#### 4. **403 Error Page** (`apps/portal/src/routes/admin/+error.svelte`)

- **Purpose**: Friendly forbidden error handling
- **Features**:
  - 🚫 icon for 403 Forbidden
  - ⚠️ icon for other errors
  - Displays error message from thrown error
  - "Back to Home" and "Settings" action buttons
  - Center-aligned with proper spacing
  - Mobile-responsive button layout

#### 5. **Placeholder Pages** (4 pages)

- `apps/portal/src/routes/admin/users/+page.svelte` - User management placeholder
- `apps/portal/src/routes/admin/db/+page.svelte` - Database management placeholder
- `apps/portal/src/routes/admin/licenses/+page.svelte` - License management placeholder
- `apps/portal/src/routes/admin/flags/+page.svelte` - Feature flags placeholder
- **Each includes**:
  - Emoji icon
  - Title and description
  - Feature list (4 bullet points)
  - Consistent styling

#### 6. **Playwright Tests** (`apps/portal/tests/admin.spec.ts`)

- **Purpose**: E2E tests covering both access scenarios
- **Test Coverage**:

##### Dev-bypass Mode (Allowed Access)

- ✅ `/admin` loads with "Admin" heading visible
- ✅ "ADMIN (DEV)" badge is shown
- ✅ All sub-nav links present (Overview, Users, Database, Licenses, Feature Flags)
- ✅ Landing page cards visible with correct text
- ✅ Navigation works (click card → navigate to sub-page)

##### Non-Admin User (Denied Access)

- ✅ Shows 403 Forbidden page with heading
- ✅ Error message visible
- ✅ DEV badge NOT shown
- ✅ "Back to Home" link works

##### Error Handling

- ✅ Config unavailable → 403 (fail-closed)
- ✅ User data unavailable → 403 (fail-closed)

**Mock Strategy**: Uses Playwright's `route.fulfill()` to mock `/config` and `/v1/me` endpoints

#### 7. **Sidebar Update** (`apps/portal/src/lib/components/Sidebar.svelte`)

- Added 🔑 Admin link to navigation items
- Positioned after Assemblies, before Settings footer

---

## 🔧 Technical Details

### Authentication Flow

1. User navigates to `/admin`
2. `+layout.ts` runs on server during SSR
3. Loads config from `configStore` (calls `/config` if not cached)
4. Loads user from `userStore` (calls `/v1/me` if not cached)
5. **If dev-bypass**: Return `{ adminDevBypass: true, user }`
6. **Else**: Check `user.roles?.some(role => ['dev', 'admin'].includes(role))`
7. **If no access**: `throw error(403, 'Forbidden: ...')`
8. `+layout.svelte` receives data and conditionally renders DEV badge

### Dev-Bypass Detection

- **Server-side**: BFF reads `process.env.DEV_AUTH_BYPASS`
- **Client-side**: Portal fetches `/config` which includes `auth.devBypass: boolean`
- **Benefits**:
  - Non-secret flag safe to expose to client
  - Single source of truth (BFF environment)
  - No need to duplicate env vars to portal

### Role Extensibility

```typescript
const allowedRoles = ['dev', 'admin']; // Easy to extend in future
```

Future roles could be: `'superadmin'`, `'operator'`, `'auditor'`, etc.

Just add to array - no other code changes needed!

---

## 📊 File Statistics

**New Files**: 10 total

- 1 route guard (`+layout.ts`)
- 5 Svelte components (`+layout.svelte`, `+page.svelte`, `+error.svelte`, 4 placeholders)
- 1 Playwright test (`admin.spec.ts`)

**Modified Files**: 1

- `Sidebar.svelte` - Added Admin link

**Lines of Code**:

- Route guard: ~85 lines
- Admin shell: ~110 lines
- Landing page: ~80 lines
- Error page: ~110 lines
- Placeholder pages: ~70 lines each × 4 = 280 lines
- Playwright tests: ~150 lines
- **Total**: ~815 lines of new code

---

## 🎯 Acceptance Criteria - PASSED

✅ `/admin` loads successfully in dev-bypass with "ADMIN (DEV)" banner  
✅ `/admin` shows Forbidden/403 for non-admin user when dev-bypass is off  
✅ Sub-nav links to `/admin/users`, `/admin/db`, `/admin/licenses`, `/admin/flags` present  
✅ Playwright tests pass both scenarios (dev-bypass ON/OFF)  
✅ No third-party UI libs added  
✅ Lean CSS with minimal styles  
✅ Fail-closed behavior (network errors → 403)

---

## 🧪 Testing

### Run Playwright Tests

```bash
cd apps/portal
pnpm run test:ui -- tests/admin.spec.ts
```

### Manual Testing

1. **Dev Mode** (bypass enabled):

   ```bash
   # Ensure DEV_AUTH_BYPASS=true in .env
   pnpm --filter bff-portal run dev
   pnpm --filter portal run dev
   ```

   - Visit `http://localhost:5173/admin`
   - Should see yellow "ADMIN (DEV)" badge
   - All nav links should work

2. **Production Mode** (bypass disabled):
   ```bash
   # Set DEV_AUTH_BYPASS=false in .env
   # Or remove the variable entirely
   ```

   - Visit `/admin`
   - Should see 403 Forbidden page
   - "Back to Home" button should work

---

## 🔮 Future Enhancements

### Phase 1 - User Management

- User list with search/filter
- Role assignment UI
- User invitation flow
- Activity logs

### Phase 2 - Database Management

- Connection pool monitoring
- Migration runner UI
- Query performance dashboard
- Health metrics

### Phase 3 - License Management

- License key CRUD
- Usage tracking
- Compliance reporting
- Expiration alerts

### Phase 4 - Feature Flags

- Flag toggle UI
- Rollout percentage controls
- A/B test configuration
- Flag dependency graph

---

## 📝 Notes

### Role String Choice

- Currently using `'dev'` role (lowercase) as admin role
- Also accepts `'admin'` for future flexibility
- Easy to extend with more roles in `allowedRoles` array

### Error Handling Philosophy

- **Fail-closed**: When in doubt, deny access
- Network errors → 403 (never allow on error)
- Missing config → 403
- Missing user → 403
- Only explicit role match allows access

### Dev-Bypass Banner Reasoning

- Makes it visually obvious when auth is bypassed
- Prevents accidental production deployment with bypass enabled
- Color: Amber/yellow (#fbbf24) for high visibility
- Position: Next to Admin heading (can't be missed)

### Test Mocking Strategy

- Playwright's `route.fulfill()` chosen over:
  - ❌ Test-only BFF endpoint (adds production code for tests)
  - ❌ Environment variables (harder to toggle per-test)
  - ✅ Mocking at network layer (clean, standard pattern)

---

## 🚀 Deployment Checklist

Before deploying to production:

1. ✅ Ensure `DEV_AUTH_BYPASS=false` in production environment
2. ✅ Verify real users have correct roles in Auth0
3. ✅ Test with real JWT tokens (not dev mode)
4. ✅ Confirm 403 page shows for non-admin users
5. ✅ Remove or hide Admin link in sidebar for non-admin users (future enhancement)
6. ✅ Monitor logs for authorization errors
7. ✅ Set up alerts for repeated 403s (potential attack)

---

## 📚 Related Documentation

- **SvelteKit Load Functions**: https://kit.svelte.dev/docs/load
- **SvelteKit Error Handling**: https://kit.svelte.dev/docs/errors
- **Playwright Route Mocking**: https://playwright.dev/docs/mock
- **Auth0 JWT Claims**: https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-token-claims

---

## 🎉 Summary

Successfully implemented a complete Admin section with:

- ✅ Reliable route guard with fail-closed behavior
- ✅ Visible DEV bypass banner for development
- ✅ Friendly 403 error handling
- ✅ Comprehensive Playwright tests (both allowed/denied paths)
- ✅ Extensible role-based access control
- ✅ Clean, minimal UI without frameworks
- ✅ 10 new files, ~815 lines of code
- ✅ All acceptance criteria met

Ready for code review and deployment! 🚀
