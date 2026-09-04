#!/usr/bin/env pwsh
[CmdletBinding()]
param(
    [ValidateSet('all', 'quality', 'test', 'security')]
    [string]$Phase = 'all'
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
$failed = $false
$package = Get-Content (Join-Path $PSScriptRoot 'package.json') -Raw | ConvertFrom-Json
$manager = if (Test-Path (Join-Path $PSScriptRoot 'pnpm-lock.yaml')) { 'pnpm' } else { 'npm' }

function Test-Script([string]$Name) {
    return $package.scripts.PSObject.Properties.Name -contains $Name
}

function Invoke-Check([string]$Name, [scriptblock]$Command, [string]$SummaryPattern = '') {
    $output = [System.Collections.Generic.List[object]]::new()
    try {
        $global:LASTEXITCODE = 0
        & $Command *>&1 | ForEach-Object { $output.Add($_) }
        if ($LASTEXITCODE -ne 0) { throw "exit code $LASTEXITCODE" }
        $summary = if ($SummaryPattern) { $output | Select-String $SummaryPattern | Select-Object -Last 1 }
        $detail = if ($summary) { ": $($summary.Line.Trim())" } else { '' }
        Write-Host "[PASS] $Name$detail" -ForegroundColor Green
    } catch {
        $output | Select-Object -Last 40 | Out-Host
        Write-Host "[FAIL] ${Name}: $_" -ForegroundColor Red
        $script:failed = $true
    }
}

Set-Location $PSScriptRoot
if ($Phase -in @('all', 'quality', 'test') -and (Test-Script 'prisma:generate')) {
    Invoke-Check 'Prisma client generation' { & $manager run 'prisma:generate' }
}
if ($Phase -in @('all', 'quality')) {
    foreach ($script in @('typecheck', 'lint', 'complexity', 'duplication')) {
        if (Test-Script $script) { Invoke-Check $script { & $manager run $script } }
    }
    if (Test-Path 'worker/pyproject.toml') {
        Invoke-Check 'worker lint and complexity' {
            Push-Location worker
            try {
                uv run --locked ruff check --select C90 .
                if ($LASTEXITCODE -eq 0) { uv run --locked pylint --disable=all --enable=R0801 --fail-under=9.0 . }
            } finally { Pop-Location }
        }
    }
}
if ($Phase -in @('all', 'test')) {
    if (Test-Script 'test') {
        Invoke-Check 'tests' { & $manager test } '(passed|Tests\s+\d+)'
    } elseif (Test-Script 'build') {
        Invoke-Check 'build (no automated test suite configured)' { & $manager run build }
    }
    if (Test-Path 'worker/tests') {
        Invoke-Check 'worker tests' {
            Push-Location worker
            try { uv run --locked pytest -q } finally { Pop-Location }
        } 'passed'
    }
}
if ($Phase -in @('all', 'security')) {
    if ($manager -eq 'pnpm') {
        Invoke-Check 'production dependency audit (pnpm)' { pnpm audit --prod --no-optional }
    } else {
        Invoke-Check 'production dependency audit (npm)' { npm audit --omit=dev --omit=optional }
    }
    if (Test-Path 'worker/pyproject.toml') {
        Invoke-Check 'production dependency audit (uv)' {
            Push-Location worker
            try { uv audit --locked --no-dev --no-default-groups --no-extra dev } finally { Pop-Location }
        }
    }
    Invoke-Check 'Trivy vulnerabilities, secrets and misconfiguration' {
        trivy fs --scanners vuln,secret,misconfig --severity HIGH,CRITICAL --exit-code 1 --no-progress `
            --skip-dirs .git --skip-dirs node_modules --skip-dirs .next --skip-dirs .venv --skip-dirs tmp .
    }
}
if ($failed) { exit 1 }
