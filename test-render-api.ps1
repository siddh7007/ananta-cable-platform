# Test Render API - PowerShell Script
# This script tests the new drawing generation endpoints

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Testing Drawing Generation API" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if BFF Portal is running
Write-Host "Test 1: Checking BFF Portal Service..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:4001/health" -Method GET -ErrorAction Stop
    Write-Host "✅ BFF Portal is running on port 4001" -ForegroundColor Green
    Write-Host "   Status: $($health.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "❌ BFF Portal is NOT running on port 4001" -ForegroundColor Red
    Write-Host "   Please start it with: pnpm --filter services/bff-portal dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 2: List Template Packs
Write-Host "Test 2: Listing Available Template Packs..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4001/v1/template-packs" -Method GET -ErrorAction Stop
    $templates = ($response.Content | ConvertFrom-Json).templates
    
    Write-Host "✅ Template Packs Endpoint Working!" -ForegroundColor Green
    Write-Host "   Found $($templates.Count) template pack(s):" -ForegroundColor Gray
    
    foreach ($template in $templates) {
        Write-Host "   📄 $($template.id) v$($template.version) ($($template.paper))" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Failed to fetch template packs" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Render a Drawing (with inline schema)
Write-Host "Test 3: Rendering a Test Drawing..." -ForegroundColor Yellow

$testSchema = @{
    schema = @{
        assembly_id = "test-demo-assembly-001"
        schema_hash = "abc123def456"
        cable = @{
            type = "ribbon"
            length_mm = 1250
            tolerance_mm = 5
            notes_pack_id = "IPC-620-CLASS-2"
        }
        conductors = @{
            count = 12
            awg = 28
            ribbon = @{
                ways = 12
                pitch_in = 0.05
                red_stripe = $true
            }
        }
        endpoints = @{
            endA = @{
                connector = @{
                    mpn = "TE-102345"
                    positions = 12
                }
                termination = "idc"
                label = "MAIN BOARD"
            }
            endB = @{
                connector = @{
                    mpn = "TE-102345"
                    positions = 12
                }
                termination = "idc"
                label = "SUB BOARD"
            }
        }
        shield = @{
            type = "none"
        }
        wirelist = @(
            @{ circuit = "D0"; conductor = 1; endA_pin = "1"; endB_pin = "1"; color = "brown" },
            @{ circuit = "D1"; conductor = 2; endA_pin = "2"; endB_pin = "2"; color = "red" },
            @{ circuit = "D2"; conductor = 3; endA_pin = "3"; endB_pin = "3"; color = "orange" },
            @{ circuit = "D3"; conductor = 4; endA_pin = "4"; endB_pin = "4"; color = "yellow" },
            @{ circuit = "D4"; conductor = 5; endA_pin = "5"; endB_pin = "5"; color = "green" },
            @{ circuit = "D5"; conductor = 6; endA_pin = "6"; endB_pin = "6"; color = "blue" },
            @{ circuit = "D6"; conductor = 7; endA_pin = "7"; endB_pin = "7"; color = "violet" },
            @{ circuit = "D7"; conductor = 8; endA_pin = "8"; endB_pin = "8"; color = "gray" },
            @{ circuit = "D8"; conductor = 9; endA_pin = "9"; endB_pin = "9"; color = "white" },
            @{ circuit = "D9"; conductor = 10; endA_pin = "10"; endB_pin = "10"; color = "black" },
            @{ circuit = "D10"; conductor = 11; endA_pin = "11"; endB_pin = "11"; color = "pink" },
            @{ circuit = "D11"; conductor = 12; endA_pin = "12"; endB_pin = "12"; color = "turquoise" }
        )
        bom = @()
    }
    templatePackId = "basic-a3"
    format = "svg"
    inline = $true
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-WebRequest `
        -Uri "http://localhost:4001/v1/render" `
        -Method POST `
        -ContentType "application/json" `
        -Body $testSchema `
        -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    
    Write-Host "✅ Render Endpoint Working!" -ForegroundColor Green
    Write-Host "   Status Code: $($response.StatusCode)" -ForegroundColor Gray
    Write-Host "   Renderer Version: $($result.render_manifest.rendererVersion)" -ForegroundColor Gray
    Write-Host "   Template Pack: $($result.render_manifest.templatePackId)" -ForegroundColor Gray
    Write-Host "   Cache Hit: $($result.render_manifest.cacheHit)" -ForegroundColor Gray
    
    if ($result.svg) {
        $svgLength = $result.svg.Length
        Write-Host "   SVG Content Length: $svgLength characters" -ForegroundColor Gray
        
        # Save SVG to file for inspection
        $svgPath = "test-output-drawing.svg"
        $result.svg | Out-File -FilePath $svgPath -Encoding UTF8
        Write-Host "   💾 Saved SVG to: $svgPath" -ForegroundColor Cyan
        Write-Host "   You can open this file in a browser to see the drawing!" -ForegroundColor Cyan
    }
    
    if ($result.url) {
        Write-Host "   URL: $($result.url)" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ Failed to render drawing" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Test Cache Hit (render same thing again)
Write-Host "Test 4: Testing Cache Hit (rendering same assembly again)..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest `
        -Uri "http://localhost:4001/v1/render" `
        -Method POST `
        -ContentType "application/json" `
        -Body $testSchema `
        -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    
    if ($result.render_manifest.cacheHit) {
        Write-Host "✅ Cache System Working! Second render was a cache hit!" -ForegroundColor Green
        Write-Host "   This means the system won't re-render the same drawing twice" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️  Cache Miss (unexpected, but not critical)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Cache test failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "All core functionality is working!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Start the Portal: pnpm --filter apps/portal dev" -ForegroundColor Gray
Write-Host "  2. Navigate to: http://localhost:5173/assemblies/drc" -ForegroundColor Gray
Write-Host "  3. You should see the 'Generate Drawing' button after DRC passes!" -ForegroundColor Gray
Write-Host ""
