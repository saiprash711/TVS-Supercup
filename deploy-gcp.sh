#!/usr/bin/env bash
# ==============================================================================
# TVS Super Cup 2026-27 — GCP Cloud Run Deployment Script
# Target: TVS Certified GCP Cloud
# ==============================================================================
set -euo pipefail

# Configuration Defaults (can be overridden by environment variables)
PROJECT_ID="${GCP_PROJECT_ID:-tvs-supercup-prod}"
REGION="${GCP_REGION:-asia-south1}" # Mumbai
SERVICE_NAME="${GCP_SERVICE_NAME:-tvs-supercup}"
IMAGE_TAG="asia-south1-docker.pkg.dev/${PROJECT_ID}/tvs-apps/supercup:$(git rev-parse --short HEAD 2>/dev/null || echo 'latest')"

echo "================================================================="
echo "  TVS Super Cup — GCP Cloud Run Production Deployment"
echo "  Project: ${PROJECT_ID}"
echo "  Region:  ${REGION}"
echo "  Service: ${SERVICE_NAME}"
echo "================================================================="

# 1. Verify gcloud authentication & project configuration
echo "Checking gcloud authentication..."
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
if [ "${CURRENT_PROJECT}" != "${PROJECT_ID}" ]; then
  echo "Setting active GCP project to ${PROJECT_ID}..."
  gcloud config set project "${PROJECT_ID}"
fi

# 2. Build and submit image to Google Artifact Registry
echo "Building container image via Cloud Build..."
gcloud builds submit --tag "${IMAGE_TAG}" .

# 3. Deploy to Cloud Run with security controls
echo "Deploying to Google Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE_TAG}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 1 \
  --max-instances 10 \
  --memory 1Gi \
  --cpu 1 \
  --concurrency 80 \
  --timeout 60s \
  --set-env-vars "NODE_ENV=production,AUDIT_ALL_REQUESTS=true,STRICT_ADMIN_SUBDOMAIN=true" \
  --set-secrets "ADMIN_PASSWORD=supercup-admin-password:latest,INTERNAL_API_KEY=supercup-internal-key:latest,SESSION_SECRET=supercup-session-secret:latest"

# 4. Display service URL
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --region "${REGION}" --format='value(status.url)')
echo ""
echo "Deployment successful!"
echo "Cloud Run Service URL: ${SERVICE_URL}"
echo "Health Check:          ${SERVICE_URL}/api/health"
echo "================================================================="
