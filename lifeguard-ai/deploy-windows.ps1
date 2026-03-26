param(
  [string]$ProjectId = "lifeguard-ai-ac771",
  [string]$Region = "us-central1",
  [string]$ServiceName = "lifeguard-ai-backend"
)

$ErrorActionPreference = "Stop"
$RepoRoot = $PSScriptRoot

function Require-Command {
  param([string]$CommandName)
  if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $CommandName"
  }
}

Write-Host "Checking required CLIs..." -ForegroundColor Cyan
Require-Command "gcloud"
Require-Command "firebase"
Require-Command "npm"

Write-Host "Setting gcloud project to $ProjectId..." -ForegroundColor Cyan
gcloud config set project $ProjectId | Out-Null

Write-Host "Building backend image with Cloud Build..." -ForegroundColor Cyan
gcloud builds submit "$RepoRoot/backend" --tag "gcr.io/$ProjectId/$ServiceName"

$runArgs = @(
  "run", "deploy", $ServiceName,
  "--image", "gcr.io/$ProjectId/$ServiceName",
  "--region", $Region,
  "--platform", "managed",
  "--allow-unauthenticated",
  "--port", "8000"
)

$envVars = @()
if ($env:NVIDIA_API_KEY) { $envVars += "NVIDIA_API_KEY=$($env:NVIDIA_API_KEY)" }
if ($env:PINECONE_API_KEY) { $envVars += "PINECONE_API_KEY=$($env:PINECONE_API_KEY)" }
if ($env:PINECONE_INDEX_NAME) { $envVars += "PINECONE_INDEX_NAME=$($env:PINECONE_INDEX_NAME)" }

if ($envVars.Count -gt 0) {
  $runArgs += @("--set-env-vars", ($envVars -join ","))
} else {
  Write-Host "Warning: No backend env vars detected in current shell. Set NVIDIA_API_KEY and PINECONE_API_KEY before deploy." -ForegroundColor Yellow
}

Write-Host "Deploying backend to Cloud Run..." -ForegroundColor Cyan
& gcloud @runArgs

Write-Host "Installing frontend deps and building..." -ForegroundColor Cyan
Push-Location "$RepoRoot/frontend"
npm ci
npm run build
Pop-Location

Write-Host "Deploying frontend to Firebase Hosting..." -ForegroundColor Cyan
firebase deploy --only hosting --project $ProjectId

Write-Host "Deployment completed." -ForegroundColor Green
Write-Host "Hosting routes /api/* to Cloud Run service '$ServiceName' in region '$Region'." -ForegroundColor Green
