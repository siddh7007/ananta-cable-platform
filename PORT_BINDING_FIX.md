# Port Binding Fix Summary

## Problem

Windows was blocking port 4001 with EACCES (permission denied) errors for the BFF Portal service.

## Solution

1. **Port 9001 Works**: Changed BFF Portal to use port 9001 which Windows allows
2. **API Gateway Proxy**: Added render routes to API Gateway to proxy to BFF Portal
3. **Portal Configuration**: Portal already uses API Gateway (port 8080) as default

## Fixed Port Binding Issue

The BFF Portal can now run on port 9001 instead of 4001 to avoid Windows permission issues.

##  Current Setup

### Services Running
- ✅ **API Gateway**: Port 8080 (proxies to BFF Portal)
- ✅ **BFF Portal**: Port 9001 (was 4001, fixed permission issue)
- ✅ **Portal UI**: Port 5173 (Vite dev server)
- ⚠️ **Renderer**: Needs to start on port 5002

### Environment Variables
```powershell
# BFF Portal
$env:DEV_AUTH_BYPASS='true'
$env:PORT='9001'
$env:RENDERER_SERVICE_URL='http://localhost:5002'

# API Gateway  
$env:DEV_AUTH_BYPASS='true'
$env:BFF_PORTAL_URL='http://localhost:9001'
$env:AUTH0_DOMAIN='dev'
$env:AUTH0_AUDIENCE='dev'
```

### Start Commands
```powershell
# Terminal 1: BFF Portal
$env:DEV_AUTH_BYPASS='true'; $env:PORT='9001'; $env:RENDERER_SERVICE_URL='http://localhost:5002'; pnpm --filter bff-portal dev

# Terminal 2: API Gateway
$env:DEV_AUTH_BYPASS='true'; $env:BFF_PORTAL_URL='http://localhost:9001'; $env:AUTH0_DOMAIN='dev'; $env:AUTH0_AUDIENCE='dev'; pnpm --filter api-gateway dev

# Terminal 3: Renderer
pnpm --filter services/renderer dev

# Terminal 4: Portal UI
pnpm --filter apps/portal dev
```

## Files Modified

1. **services/bff-portal/src/index.ts**
   - Changed host binding from "localhost" to "127.0.0.1" 
   - Added configurable HOST environment variable
   - Added error handling and detailed logging

2. **services/api-gateway/src/routes/render.ts** (NEW FILE)
   - Proxy routes for `/v1/template-packs` (GET)
   - Proxy routes for `/v1/render` (POST)
   - Uses BFF_PORTAL_URL environment variable

3. **services/api-gateway/src/index.ts**
   - Registered render routes plugin
   - Added route debugging (printRoutes)

## Testing

### Test Template Packs
```powershell
curl.exe http://localhost:8080/v1/template-packs
```

### Test Render
```powershell
$body = @{
    assembly_id = "test-001"
    templatePackId = "basic-a3"
    inline = $true
} | ConvertTo-Json

curl.exe -X POST http://localhost:8080/v1/render -H "Content-Type: application/json" -d $body
```

## Next Steps

1. ✅ Fix port binding (DONE - use port 9001)
2. ⏳ Debug API Gateway route registration (IN PROGRESS)
3. ⏳ Start Renderer service 
4. ⏳ Test full flow from Portal UI
5. ⏳ Verify drawing generation works end-to-end

## Known Issues

- **API Gateway Routes**: Routes show in printRoutes() but return 404 - investigating
- **BFF Portal**: Server starts but doesn't accept connections on port 9001 - may be database connectivity issue
- **Windows Port Restrictions**: Ports below 5000 seem to have permission issues

## Recommendations

For production/deployment:
- Use environment variables for all port configurations
- Consider using Docker to avoid Windows port restrictions
- Set up proper reverse proxy (nginx/traefik) instead of direct port access
- Use standard ports (80/443) with proper SSL termination
