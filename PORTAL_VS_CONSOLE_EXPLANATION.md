# Portal vs Console GUI Comparison

## Overview

The Ananta Cable Platform has **two GUI applications**:

1. **Portal** - The primary customer-facing web application (fully implemented)
2. **Console** - A placeholder/future admin/internal tools application (not yet implemented)

---

## 📱 Portal Application

**Location**: `apps/portal/`  
**Status**: ✅ **Production Ready** (Fully Implemented)  
**Framework**: SvelteKit 2.46.4 with Svelte 4.2.19  
**Port**: http://localhost:5173 (Docker: 5173 → 3000)

### Purpose

The **Portal** is the main **customer-facing web interface** for cable assembly engineers and designers. It provides a complete workflow for:

1. **Cable Assembly Design** - Design and configure cable assemblies
2. **Design Rule Checking (DRC)** - Validate designs against industry standards
3. **Synthesis** - Generate optimized cable assembly proposals
4. **Technical Drawing Generation** - Create production-ready drawings (NEW feature you just added!)

### Key Features

#### 🏠 Home Page (`/`)

- Welcome dashboard with quick links
- Navigation to main features:
  - Design Rule Check
  - Synthesis
  - Drawing Generation (your new feature!)

#### 🔍 Design Rule Check (DRC)

**Input Form** (`/drc`)

- Simple form for initiating DRC checks
- Fields: Assembly ID, Name, Number of cores
- Validates cable designs against standards

**Review Page** (`/assemblies/drc?assembly_id=X`)

- Displays comprehensive DRC report
- Shows findings grouped by domain:
  - Mechanical issues
  - Electrical issues
  - Standards & compliance
  - Labeling & marking
  - Design consistency
- Pass/Fail status with error/warning counts
- **Apply automatic fixes** for detected issues
- **Generate Drawing button** (when DRC passes)

#### 🔧 Synthesis

**Proposal Generator** (`/synthesis`)

- Generate optimized cable assembly proposals
- Suggests component selections (connectors, cables, etc.)

**Review Page** (`/assemblies/synthesis?draft_id=X`)

- Review generated proposals
- Lock specific component choices
- Recompute with constraints
- Accept final proposal

#### 📐 Drawing Generation (NEW!)

**Render Dialog Component**

- Opens when clicking "Generate Drawing" on passing DRC report
- Select format: SVG, PDF, PNG, or DXF
- Choose template pack
- Preview SVG output inline
- Download other formats
- View render manifest with metadata

### Architecture

```
Browser (User)
    ↓
SvelteKit Pages (Portal)
    ↓
Server API Routes (Proxy)
    ↓
BFF Portal Service
    ↓
Backend Microservices (DRC, Catalog, Renderer, etc.)
```

**Tech Stack:**

- **Frontend**: Svelte 4 components with reactive state
- **Routing**: SvelteKit file-based routing
- **Server-Side Rendering (SSR)**: Fast initial page loads
- **API Communication**: Fetch-based client with TypeScript types
- **Build Tool**: Vite 5 for fast hot module replacement
- **Deployment**: Docker container with Node.js 20 Alpine

### Key Components

1. **Nav.svelte** - Global navigation bar
2. **DRCResults.svelte** - Display DRC findings and fixes
3. **RenderDialog.svelte** - Drawing generation modal
4. **SvgPreview.svelte** - SVG drawing preview
5. **ManifestPanel.svelte** - Render metadata display

### API Integration

The Portal communicates with backend services through:

- **API Client** (`$lib/api/client.ts`)
- **Server-Side Proxies** (`routes/api/`)
- **Environment Variables** for service URLs

Example API calls:

```typescript
api.getDrcReport(assemblyId); // Get existing report
api.runDrc(assemblyId); // Run new DRC check
api.applyDrcFixes(assemblyId, fixes); // Apply automatic fixes
api.listTemplatePacks(); // Get drawing templates
api.renderAssembly(request); // Generate drawing
```

### User Workflow Example

1. User opens Portal → Home page
2. Clicks "Design Rule Check" → DRC form
3. Enters assembly details → Submits form
4. Redirected to DRC review page
5. Reviews findings by domain
6. Applies automatic fixes if available
7. If DRC passes → "Generate Drawing" button appears
8. Clicks "Generate Drawing" → Render dialog opens
9. Selects format (SVG/PDF/PNG/DXF)
10. Chooses template pack
11. Clicks "Render"
12. Preview appears (SVG) or download triggers (other formats)

---

## 🎛️ Console Application

**Location**: `apps/console/`  
**Status**: ⚠️ **NOT IMPLEMENTED** (Placeholder Only)  
**Framework**: None configured yet  
**Port**: Not assigned

### Purpose

The **Console** appears to be intended as an **internal admin/operations interface** for:

- System administration tasks
- Internal tooling and utilities
- Operations dashboards
- Developer/support tools
- Backend service management

### Current State

The Console application is essentially **empty**:

```json
// apps/console/package.json
{
  "name": "console",
  "private": true,
  "version": "0.0.1",
  "scripts": {
    "lint": "eslint . --ext .ts,.js --no-error-on-unmatched-pattern",
    "build": "node -e \"console.log('Console build not configured')\"",
    "dev": "node -e \"console.log('Console dev server not configured')\"",
    "test": "node -e \"console.log('Console tests not configured')\""
  }
}
```

**Contents:**

- Only contains `package.json`
- No source code
- No framework configured
- No README or documentation
- Scripts just print "not configured" messages

### Potential Future Use Cases

Based on typical patterns, the Console might be used for:

1. **User Management**
   - View/edit user accounts
   - Manage permissions and roles
   - Monitor user activity

2. **System Monitoring**
   - Service health dashboards
   - Performance metrics
   - Error logs and debugging

3. **Data Management**
   - Database administration
   - Bulk data operations
   - Schema migrations

4. **Configuration**
   - Feature flags
   - Environment settings
   - Service configuration

5. **Support Tools**
   - Customer support interface
   - Assembly inspection/debugging
   - Manual DRC overrides

---

## Key Differences

| Aspect           | Portal                       | Console                |
| ---------------- | ---------------------------- | ---------------------- |
| **Target Users** | Cable engineers, designers   | Internal staff, admins |
| **Purpose**      | Design & validation workflow | Admin & operations     |
| **Status**       | ✅ Production ready          | ⚠️ Not implemented     |
| **Framework**    | SvelteKit + Svelte           | None (TBD)             |
| **Complexity**   | Full application             | Placeholder only       |
| **Port**         | 5173                         | Not assigned           |
| **Docker**       | Yes, configured              | No                     |
| **Features**     | DRC, Synthesis, Drawing Gen  | None yet               |

---

## Portal File Structure

```
apps/portal/
├── src/
│   ├── app.html                    # HTML shell
│   ├── lib/
│   │   ├── api/
│   │   │   └── client.ts           # API client
│   │   ├── components/
│   │   │   ├── Nav.svelte          # Navigation
│   │   │   ├── DRCResults.svelte   # DRC display
│   │   │   ├── RenderDialog.svelte # Drawing dialog
│   │   │   ├── SvgPreview.svelte   # SVG viewer
│   │   │   └── ManifestPanel.svelte # Metadata
│   │   ├── stores/
│   │   │   ├── telemetry.ts        # Analytics
│   │   │   └── config.ts           # Config
│   │   └── types/
│   │       └── api.ts              # TypeScript types
│   └── routes/
│       ├── +layout.svelte          # Root layout
│       ├── +page.svelte            # Home page
│       ├── drc/
│       │   └── +page.svelte        # DRC form
│       ├── synthesis/
│       │   └── +page.svelte        # Synthesis form
│       ├── assemblies/
│       │   ├── drc/
│       │   │   └── +page.svelte    # DRC review
│       │   └── synthesis/
│       │       └── +page.svelte    # Synthesis review
│       ├── api/                    # Server-side routes
│       └── health/
│           └── +server.ts          # Health check
├── static/                         # Static assets
├── Dockerfile.portal               # Docker config
├── vite.config.ts                  # Vite config
├── svelte.config.js                # SvelteKit config
├── package.json
└── README.md                       # Documentation
```

---

## Console File Structure

```
apps/console/
└── package.json                    # Minimal placeholder
```

---

## Summary

### Portal (Customer-Facing Application)

✅ **Fully operational** web application for cable assembly design workflow  
✅ SvelteKit-based with SSR and optimized builds  
✅ Complete features: DRC, Synthesis, Drawing Generation  
✅ Dockerized and production-ready  
✅ Comprehensive documentation and testing

### Console (Internal/Admin Application)

⚠️ **Placeholder only** - not yet implemented  
⚠️ Intended for internal operations and administration  
⚠️ No code, no framework, no features  
⚠️ Future development needed

**Bottom Line:** The **Portal** is your main application where all the work happens. The **Console** is just a reserved directory name for future internal tooling that hasn't been built yet.
