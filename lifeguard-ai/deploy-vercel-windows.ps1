param(
  [switch]$Prod
)

$ErrorActionPreference = 'Stop'

function Require-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $name"
  }
}

Require-Command vercel
Require-Command npm

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $root 'backend'
$frontendDir = Join-Path $root 'frontend'

$deployFlag = if ($Prod) { '--prod' } else { '' }

Write-Host 'Deploying backend (FastAPI on Vercel Python runtime)...' -ForegroundColor Cyan
Push-Location $backendDir

Write-Host 'Ensure backend env vars are configured in Vercel project settings:' -ForegroundColor Yellow
Write-Host 'NVIDIA_API_KEY, PINECONE_API_KEY, PINECONE_INDEX_NAME, FRONTEND_URL' -ForegroundColor Yellow

if ($deployFlag) {
  vercel deploy --yes --prod
} else {
  vercel deploy --yes
}

Pop-Location

Write-Host 'Deploying frontend (Vite on Vercel)...' -ForegroundColor Cyan
Push-Location $frontendDir

if ($deployFlag) {
  vercel deploy --yes --prod
} else {
  vercel deploy --yes
}

Pop-Location

Write-Host 'Deployment commands completed.' -ForegroundColor Green
