# ================================
# CI/CD Pre-Push Validation Script
# ================================
# Run this before pushing to ensure CI/CD will pass

Write-Host "SmartCareerAI - CI/CD Validation" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

$ErrorCount = 0

# Function to run command and track errors
function Invoke-Check {
    param(
        [string]$Name,
        [scriptblock]$Command
    )
    
    Write-Host "Checking $Name..." -ForegroundColor Yellow
    try {
        & $Command
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[FAILED] $Name" -ForegroundColor Red
            $script:ErrorCount++
            return $false
        }
        Write-Host "[PASSED] $Name" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "[ERROR] $Name failed with exception: $_" -ForegroundColor Red
        $script:ErrorCount++
        return $false
    }
}

# Remind user to stop dev servers
Write-Host "NOTE: Please ensure dev servers are stopped before continuing." -ForegroundColor Yellow
Write-Host "Press any key to continue or Ctrl+C to cancel..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Write-Host ""

# 1. ESLint
Invoke-Check "ESLint (Frontend)" {
    npm run lint
}

# 2. TypeScript Type Check
Invoke-Check "TypeScript Type Check" {
    Push-Location frontend
    npx tsc --noEmit
    Pop-Location
}

# 3. Prisma Schema Validation
Invoke-Check "Prisma Schema Validation" {
    npx prisma validate --schema=packages/database/prisma/schema.prisma
}

# 4. Build All Workspaces
Invoke-Check "Build All Workspaces" {
    npm run build
}

# Summary
Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
if ($ErrorCount -eq 0) {
    Write-Host "[SUCCESS] All checks passed! Safe to push." -ForegroundColor Green
    exit 0
}
else {
    Write-Host "[FAILED] $ErrorCount check(s) failed!" -ForegroundColor Red
    Write-Host "Please fix the errors before pushing." -ForegroundColor Yellow
    exit 1
}
