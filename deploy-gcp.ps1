<#
.SYNOPSIS
  TVS Super Cup 2026-27 — GCP Cloud Run Deployment Script (PowerShell)
  Target: TVS Certified GCP Cloud
#>

param(
  [string]$ProjectId = $env:GCP_PROJECT_ID,
  [string]$Region = $(if ($env:GCP_REGION) { $env:GCP_REGION } else { "asia-south1" }),
  [string]$ServiceName = $(if ($env:GCP_SERVICE_NAME) { $env:GCP_SERVICE_NAME } else { "tvs-supercup" })
)

if (-not $ProjectId) {
  $ProjectId = "tvs-supercup-prod"
}

$commitHash = try { git rev-parse --short HEAD } catch { "latest" }
$imageTag = "asia-south1-docker.pkg.dev/$ProjectId/tvs-apps/supercup:$commitHash"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  TVS Super Cup — GCP Cloud Run Production Deployment" -ForegroundColor Cyan
Write-Host "  Project: $ProjectId" -ForegroundColor Yellow
Write-Host "  Region:  $Region" -ForegroundColor Yellow
Write-Host "  Service: $ServiceName" -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Set active project
gcloud config set project $ProjectId

# 2. Build image
Write-Host "`n[1/3] Building container image via Google Cloud Build..." -ForegroundColor Green
gcloud builds submit --tag $imageTag .

if ($LASTEXITCODE -ne 0) {
  Write-Error "Cloud Build failed. Please check build logs."
  exit 1
}

# 3. Deploy to Cloud Run
Write-Host "`n[2/3] Deploying to Google Cloud Run..." -ForegroundColor Green
gcloud run deploy $ServiceName `
  --image $imageTag `
  --region $Region `
  --platform managed `
  --allow-unauthenticated `
  --min-instances 1 `
  --max-instances 10 `
  --memory 1Gi `
  --cpu 1 `
  --concurrency 80 `
  --timeout 60s `
  --set-env-vars "NODE_ENV=production,AUDIT_ALL_REQUESTS=true,STRICT_ADMIN_SUBDOMAIN=true" `
  --set-secrets "ADMIN_PASSWORD=supercup-admin-password:latest,INTERNAL_API_KEY=supercup-internal-key:latest,SESSION_SECRET=supercup-session-secret:latest"

if ($LASTEXITCODE -ne 0) {
  Write-Error "Cloud Run deployment failed."
  exit 1
}

# 4. Display service URL
Write-Host "`n[3/3] Deployment complete!" -ForegroundColor Green
$serviceUrl = gcloud run services describe $ServiceName --region $Region --format='value(status.url)'
Write-Host "Service URL:  $serviceUrl" -ForegroundColor Cyan
Write-Host "Health Check: $serviceUrl/api/health" -ForegroundColor Cyan
