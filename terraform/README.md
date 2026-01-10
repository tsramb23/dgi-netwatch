# Terraform Configuration for DGI-NetWatch

## Prerequisites

- Install `terraform` (>=1.0)
- Install `gcloud` CLI and authenticate with an account that has access to the existing GKE cluster
- `kubectl` is installed (or will be installed by gcloud)

## Quick Start (Local)

1. **Authenticate with GCP and configure kubectl:**
   ```bash
   gcloud auth application-default login
   gcloud config set project <PROJECT_ID>
   gcloud container clusters get-credentials dgi_cluster --region us-central1 --project <PROJECT_ID>
   ```

2. **From this `terraform/` directory:**
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

3. **Access the frontend locally (ClusterIP only):**
   ```bash
   kubectl port-forward svc/dgi-netwatch-frontend-service 8080:80 -n production
   ```
   Then open: http://localhost:8080

## CI/CD Pipeline (GitHub Actions)

### Setup GitHub Secrets

Add the following secrets to your repository:
- **`GCP_SA_KEY`**: Service account JSON key with **Kubernetes Engine Developer** role

### How It Works

The workflow automatically:
1. Authenticates to GCP using `GCP_SA_KEY`
2. Configures `kubectl` via `gcloud container clusters get-credentials`
3. Terraform uses the kubeconfig set up by gcloud (no additional service account permissions needed)

## Cost Control & Free Tier Optimization

✅ **What we're doing to stay within free limits:**
- Frontend & Backend services use `type = "ClusterIP"` (no external LoadBalancer IP = no cost)
- Single replica per deployment (`replicas = 1`)
- Minimal resource requests: `100m` CPU, `128Mi` RAM
- `emptyDir` volume (ephemeral, no persistent storage costs)
- GKE Autopilot mode (node management is bundled/free for low usage)

⚠️ **What would cost money (avoid):**
- Changing frontend service to `LoadBalancer` (external IP provisioning)
- Adding persistent volumes (PV/PVC)
- Scaling to multiple replicas
- Using premium node types

## Troubleshooting

**Check deployment status:**
```bash
kubectl get deployments -n production
kubectl get pods -n production
kubectl logs -n production -l app=dgi-netwatch-backend
kubectl logs -n production -l app=dgi-netwatch-frontend
```

**Check services:**
```bash
kubectl get svc -n production
```

**Destroy all resources (clean up):**
```bash
terraform destroy -var="gcp_project_id=<YOUR_PROJECT_ID>"
```
